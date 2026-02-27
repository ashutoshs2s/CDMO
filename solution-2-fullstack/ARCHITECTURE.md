# Solution 2: Full-Stack Dashboard with Mock APIs

## Overview

A React + Express application that extends Solution 1 with:
- Component-based UI architecture
- Backend scoring engine with REST API
- Mock data enrichment (simulated API responses)
- Multi-company management with SQLite persistence
- CSV import/export for batch scoring
- Company comparison view

## Tech Stack

| Layer       | Technology           |
|-------------|----------------------|
| Frontend    | React 18 + Vite      |
| Styling     | Tailwind CSS         |
| Charts      | Recharts             |
| Backend     | Express.js           |
| Database    | SQLite (via better-sqlite3) |
| Validation  | Zod                  |

## Project Structure

```
solution-2-fullstack/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CompanyInput.tsx
│   │   │   ├── SignalCard.tsx
│   │   │   ├── SignalColumn.tsx
│   │   │   ├── ScoreGauge.tsx
│   │   │   ├── IntentBadge.tsx
│   │   │   ├── CompanyList.tsx
│   │   │   ├── ComparisonView.tsx
│   │   │   └── BatchImport.tsx
│   │   ├── hooks/
│   │   │   ├── useSignals.ts
│   │   │   └── useScoring.ts
│   │   ├── lib/
│   │   │   ├── signals.ts       # Signal definitions
│   │   │   ├── scoring.ts       # Client-side scoring
│   │   │   └── api.ts           # API client
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── companies.ts     # CRUD for companies
│   │   │   ├── signals.ts       # Signal management
│   │   │   ├── scoring.ts       # Score computation
│   │   │   └── enrichment.ts    # Mock enrichment
│   │   ├── services/
│   │   │   ├── scoring-engine.ts
│   │   │   └── mock-enrichment.ts
│   │   ├── db/
│   │   │   ├── schema.sql
│   │   │   └── connection.ts
│   │   └── index.ts
│   └── package.json
└── package.json                 # Monorepo root
```

## Key Features Beyond Solution 1

### 1. Multi-Company Management
- Save scored companies to SQLite database
- List, search, filter saved companies
- Compare 2–4 companies side-by-side

### 2. Mock Data Enrichment
Simulate what real APIs would return without live integrations:

```typescript
// server/src/services/mock-enrichment.ts
export async function enrichCompany(companyName: string) {
  // Returns plausible mock data for any company name
  return {
    clinicalTrials: mockTrials(companyName),     // Simulated ClinicalTrials.gov
    secFilings: mockFilings(companyName),         // Simulated SEC EDGAR
    jobPostings: mockJobs(companyName),           // Simulated LinkedIn/Indeed
    newsArticles: mockNews(companyName),          // Simulated news monitoring
    fundingHistory: mockFunding(companyName)      // Simulated Crunchbase
  };
}
```

The mock enrichment returns randomized but contextually plausible data so users can see how the full pipeline would work.

### 3. Batch Import/Export
- CSV upload: `Company, Signal1, Signal2, ..., Signal18`
- Batch score multiple companies at once
- Export results as CSV or JSON

### 4. Comparison View
Side-by-side radar charts showing signal profiles of multiple companies.

### 5. REST API

| Method | Endpoint                     | Description              |
|--------|------------------------------|--------------------------|
| POST   | /api/companies               | Create & score company   |
| GET    | /api/companies               | List all companies       |
| GET    | /api/companies/:id           | Get company details      |
| PUT    | /api/companies/:id/signals   | Update signals           |
| GET    | /api/companies/:id/score     | Get computed score       |
| POST   | /api/enrich                  | Mock data enrichment     |
| POST   | /api/batch                   | Batch import CSV         |
| GET    | /api/compare?ids=1,2,3       | Compare companies        |

## Database Schema

```sql
CREATE TABLE companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE signal_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  signal_id TEXT NOT NULL,
  state TEXT CHECK(state IN ('absent','inferred','present')) DEFAULT 'absent',
  notes TEXT,
  source_url TEXT,
  UNIQUE(company_id, signal_id)
);

CREATE TABLE score_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  need_score REAL,
  timing_score REAL,
  behavior_score REAL,
  intent_level TEXT,
  total_score REAL,
  scored_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Scoring Engine (Server-Side)

Same triangulation logic as Solution 1 but implemented as a reusable service:

```typescript
// server/src/services/scoring-engine.ts
interface ScoringResult {
  categories: {
    need: { score: number; strength: Strength; signals: SignalState[] };
    timing: { score: number; strength: Strength; signals: SignalState[] };
    behavior: { score: number; strength: Strength; signals: SignalState[] };
  };
  intent: 'high' | 'medium-high' | 'medium' | 'low';
  totalScore: number;
  confidence: number; // % of signals with data (not 'absent')
}
```

## How to Run (when built)

```bash
npm install
npm run dev        # Starts both client (5173) and server (3001)
npm run build      # Production build
npm start          # Serve production build
```
