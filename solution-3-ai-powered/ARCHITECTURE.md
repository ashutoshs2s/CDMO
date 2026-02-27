# Solution 3: AI-Powered Pipeline with Live Data Sources

## Overview

A production-grade platform that automatically sources, scores, and monitors CDMO intent signals using real APIs, NLP pipelines, and scheduled data collection. Extends Solution 2 with:

- **Live API integrations** (ClinicalTrials.gov, SEC EDGAR, job boards, news)
- **NLP pipeline** for extracting signal evidence from unstructured text
- **Automated monitoring** with scheduled scans and alerting
- **Confidence scoring** based on data freshness and source reliability
- **Audit trail** showing evidence behind every signal classification

## Tech Stack

| Layer           | Technology                        |
|-----------------|-----------------------------------|
| Frontend        | Next.js 14 (App Router)           |
| Styling         | Tailwind CSS + shadcn/ui          |
| Charts          | Recharts + D3.js (radar charts)   |
| Backend API     | Next.js API Routes + tRPC         |
| NLP / AI        | OpenAI API (GPT-4) or Claude API  |
| Database        | PostgreSQL                        |
| ORM             | Drizzle ORM                       |
| Job Queue       | BullMQ + Redis                    |
| Caching         | Redis                             |
| Auth            | NextAuth.js                       |
| Deployment      | Docker Compose / Vercel + Railway |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js Frontend                        │
│  Dashboard  │  Company Detail  │  Comparison  │  Alerts Config  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ tRPC / REST
┌──────────────────────▼──────────────────────────────────────────┐
│                      API Layer (Next.js)                        │
│  Companies  │  Signals  │  Scoring  │  Enrichment  │  Alerts   │
└──────────┬────────────────────────────────┬─────────────────────┘
           │                                │
    ┌──────▼──────┐                 ┌───────▼────────┐
    │  PostgreSQL  │                │   Job Queue    │
    │  (Drizzle)   │                │   (BullMQ)     │
    └─────────────┘                 └───────┬────────┘
                                            │
              ┌─────────────────────────────▼─────────────────┐
              │           Data Collection Workers              │
              ├─────────────┬──────────────┬──────────────────┤
              │ ClinicalTrials│  SEC EDGAR  │  Job Boards     │
              │ .gov API      │  API        │  Scraper        │
              ├─────────────┬──────────────┬──────────────────┤
              │ News APIs    │  LinkedIn   │  Conference      │
              │ (NewsAPI)    │  (Proxycurl)│  Data            │
              └──────────────┴─────────────┴──────────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │   NLP Pipeline     │
                          │  (LLM Extraction)  │
                          └───────────────────┘
```

## Live Data Source Integrations

### 1. ClinicalTrials.gov API (Free, no key needed)
**Signals powered:** Need #2, #3 | Timing #7, #9

```typescript
// Fetch active trials for a company
GET https://clinicaltrials.gov/api/v2/studies
  ?query.spons={companyName}
  &filter.overallStatus=RECRUITING,NOT_YET_RECRUITING
  &fields=protocolSection
```

Extracts: trial phase, modality, intervention type, start dates, enrollment targets.

### 2. SEC EDGAR Full-Text Search (Free, requires user-agent)
**Signals powered:** Need #1, #5, #6 | Timing #12

```typescript
// Search company filings
GET https://efts.sec.gov/LATEST/search-index
  ?q="third-party+manufacturer"+OR+"CDMO"
  &dateRange=custom&startdt=2024-01-01
  &forms=10-K,S-1,8-K
```

NLP extracts: manufacturing reliance language, M&A disclosures, use of proceeds.

### 3. Job Board Integration (Indeed/LinkedIn via Proxycurl or SerpAPI)
**Signals powered:** Timing #8 | Behavior #13, #14

```typescript
// Search for CDMO-related job postings
keywords: ["tech transfer", "external manufacturing", "CDMO",
           "CMC", "process development", "supply chain"]
```

### 4. News & Press Release Monitoring (NewsAPI, Google News RSS)
**Signals powered:** Need #6 | Timing #10, #11, #12 | Behavior #16

```typescript
// Monitor for relevant company news
GET https://newsapi.org/v2/everything
  ?q={companyName}+AND+(CDMO+OR+manufacturing+OR+"tech transfer")
  &sortBy=publishedAt
```

### 5. Earnings Call Transcripts (Seeking Alpha API / Financial Modeling Prep)
**Signals powered:** Timing #9 | Behavior #18

NLP pipeline scans transcripts for manufacturing-related keywords and sentiment.

### 6. Funding Data (Crunchbase API / PitchBook)
**Signals powered:** Timing #12

Monitors funding rounds and extracts "use of proceeds" signals.

## NLP Pipeline (LLM-Powered)

Each data source feeds into an LLM extraction pipeline:

```typescript
// services/nlp/signal-extractor.ts
interface ExtractionResult {
  signalId: string;
  classification: 'present' | 'inferred' | 'absent';
  confidence: number;        // 0.0 - 1.0
  evidence: string;          // Supporting quote
  sourceUrl: string;
  sourceDate: Date;
}

async function extractSignals(text: string, context: CompanyContext): Promise<ExtractionResult[]> {
  const prompt = `Analyze this text for CDMO outsourcing intent signals...`;
  const response = await llm.chat({
    model: 'claude-sonnet-4-6',
    messages: [{ role: 'user', content: prompt }],
    // Structured output schema for consistent extraction
  });
  return parseExtractions(response);
}
```

## Database Schema (PostgreSQL)

```sql
-- Core tables
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ticker TEXT,
  website TEXT,
  modality TEXT[],
  stage TEXT,
  employee_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE signal_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  signal_id TEXT NOT NULL,
  state TEXT CHECK(state IN ('absent','inferred','present')),
  confidence REAL DEFAULT 0.0,
  auto_classified BOOLEAN DEFAULT false,
  override_by_user BOOLEAN DEFAULT false,
  assessed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE signal_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES signal_assessments(id),
  source_type TEXT NOT NULL,    -- 'sec_filing', 'clinical_trial', 'job_posting', etc.
  source_url TEXT,
  source_date TIMESTAMPTZ,
  excerpt TEXT,                 -- Relevant quote/snippet
  nlp_confidence REAL,
  raw_data JSONB,
  collected_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  need_score REAL,
  timing_score REAL,
  behavior_score REAL,
  intent_level TEXT,
  total_score REAL,
  scored_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE monitoring_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  enabled BOOLEAN DEFAULT true,
  scan_frequency TEXT DEFAULT 'weekly',
  alert_on_change BOOLEAN DEFAULT true,
  alert_threshold TEXT DEFAULT 'medium'
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  signal_id TEXT,
  old_state TEXT,
  new_state TEXT,
  evidence_summary TEXT,
  seen BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Scheduled Jobs

```typescript
// workers/scan-company.ts
// Runs on schedule (daily/weekly per company config)

async function scanCompany(companyId: string) {
  const company = await db.getCompany(companyId);

  // 1. Collect data from all sources in parallel
  const [trials, filings, jobs, news, earnings] = await Promise.all([
    clinicalTrials.search(company.name),
    secEdgar.searchFilings(company.name),
    jobBoards.searchPostings(company.name),
    newsApi.search(company.name),
    earningsApi.getTranscripts(company.ticker)
  ]);

  // 2. Run NLP extraction on each
  const allEvidence = await nlpPipeline.extractAll({
    trials, filings, jobs, news, earnings
  }, company);

  // 3. Update signal assessments
  for (const evidence of allEvidence) {
    await db.upsertAssessment(companyId, evidence);
  }

  // 4. Re-score and check for alerts
  const newScore = scoringEngine.triangulate(companyId);
  const oldScore = await db.getLatestScore(companyId);

  if (hasSignificantChange(oldScore, newScore)) {
    await alertService.notify(companyId, oldScore, newScore);
  }

  await db.saveScore(companyId, newScore);
}
```

## Key Differentiators from Solution 2

| Feature                    | Solution 2        | Solution 3                |
|----------------------------|-------------------|---------------------------|
| Data entry                 | Manual            | Auto + manual override    |
| API integrations           | Mock              | Live (6+ sources)         |
| NLP processing             | None              | LLM-powered extraction    |
| Evidence trail             | None              | Full audit with excerpts  |
| Monitoring                 | None              | Scheduled scans + alerts  |
| Confidence scoring         | Binary            | 0-100% per signal         |
| User override              | N/A               | Override auto with notes  |
| Multi-user                 | No                | Auth + role-based access  |
| Deployment                 | Local             | Docker / Cloud            |

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/cdmo
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-...
NEWSAPI_KEY=...
PROXYCURL_API_KEY=...
SEC_EDGAR_USER_AGENT=CompanyName admin@company.com
NEXTAUTH_SECRET=...
```

## How to Run (when built)

```bash
docker-compose up -d          # PostgreSQL + Redis
npm install
npx drizzle-kit push          # Apply schema
npm run dev                   # Start Next.js dev server
npm run worker                # Start background job processor
```
