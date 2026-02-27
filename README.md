# CDMO Signal Triangulation Dashboard

Score biotech/pharma companies across **18 intent signals** to identify high-potential CDMO outsourcing prospects. Signals are grouped into three categories — **Need**, **Timing**, and **Behavior** — and triangulated into an overall intent level: **High**, **Medium-High**, **Medium**, or **Low**.

---

## 3 Solutions (Simplest → Most Advanced)

| | Solution 1 | Solution 2 | Solution 3 |
|---|---|---|---|
| **Approach** | Static HTML | Full-Stack App | AI-Powered Platform |
| **Data Entry** | Manual toggles | Manual + CSV batch | Auto-sourced + manual override |
| **Backend** | None (client-side) | Express + SQLite | Next.js + PostgreSQL + Redis |
| **API Integrations** | None | Mock / simulated | Live (ClinicalTrials.gov, SEC EDGAR, job boards, news) |
| **NLP** | None | None | LLM-powered signal extraction |
| **Multi-Company** | Single | Yes, with comparison | Yes, with monitoring & alerts |
| **Deployment** | Open HTML file | `npm run dev` | Docker Compose / Cloud |
| **Build Time** | Ready now | ~1 week | ~4-6 weeks |
| **Status** | **Built** | Architecture doc | Architecture doc |

---

## Solution 1 — Static Dashboard (Ready to Use)

A single self-contained HTML file with no dependencies or build step.

### Quick Start

```bash
open solution-1-static/index.html
# or on Linux:
xdg-open solution-1-static/index.html
```

### Features

- **18 signal toggles** organized by Need (6), Timing (6), Behavior (6)
- **Three-state controls**: Absent → Inferred → Present
- **Real-time scoring** with SVG circular gauges per category
- **Triangulated intent badge** (High / Medium-High / Medium / Low)
- **4 example scenarios** from the spec (click to load)
- **JSON import/export** for saving and sharing assessments
- **AI sourcing reference** showing how each signal would be automated
- **Responsive design** — works on desktop, tablet, and mobile

### Scoring Logic

Each signal can be: **Present** (1.0), **Inferred** (0.5), or **Absent** (0.0).

Category strength is classified as:

| Strength | Threshold | Meaning |
|---|---|---|
| Strong | ≥ 3.0 | Multiple confirmed signals |
| Confirmed | ≥ 1.5 | Clear evidence present |
| Moderate | ≥ 0.5 | Some evidence (inferred) |
| Weak | > 0 | Minimal evidence |
| None | 0 | No evidence |

Triangulation matrix:

| Need | Timing | Behavior | Intent |
|---|---|---|---|
| Confirmed+ | Confirmed+ | Confirmed+ | **High** |
| Confirmed+ | Confirmed+ | Moderate | **High** |
| Confirmed+ | Moderate | Confirmed+ | **Medium-High** |
| Confirmed+ | Moderate | Moderate | **Medium** |
| Moderate | Moderate | None | **Medium** |
| Weak | Weak | None | **Low** |

---

## Solution 2 — Full-Stack App (Architecture)

See [`solution-2-fullstack/ARCHITECTURE.md`](solution-2-fullstack/ARCHITECTURE.md)

Adds: React UI, Express API, SQLite database, multi-company management, batch CSV import, side-by-side comparison view, mock data enrichment.

## Solution 3 — AI-Powered Platform (Architecture)

See [`solution-3-ai-powered/ARCHITECTURE.md`](solution-3-ai-powered/ARCHITECTURE.md)

Adds: Live API integrations (ClinicalTrials.gov, SEC EDGAR, job boards, news, earnings calls), LLM-powered NLP extraction, scheduled monitoring with alerts, confidence scoring, full evidence audit trail, multi-user auth.

---

## The 18 Signals

### Need Signals (1–6): Do they have a reason to outsource?

1. **Virtual Biotech Model** — No manufacturing footprint
2. **Complex Modality** — Cell/gene therapy, ADCs, mRNA
3. **Pipeline Depth** — Multiple candidates exceeding capacity
4. **Geographic Expansion** — EU/Asia without regional manufacturing
5. **Platform Technology** — One platform, many assets
6. **Post-Acquisition Integration** — M&A triggers re-evaluation

### Timing Signals (7–12): Are they at a decision point now?

7. **Pre-Clinical → Phase 1 Transition** — CDMO selection point
8. **CMC Work Underway** — Manufacturing decisions imminent
9. **Clinical Supply Timelines** — Hard deadlines create urgency
10. **Regulatory Pre-Submission** — Manufacturing plans being finalized
11. **CDMO Contract Renewal** — Rebid or expansion opportunity
12. **Recent Funding** — Capital earmarked for clinical advancement

### Behavior Proxies (13–18): Are they actively looking?

13. **Tech Transfer Roles Posted** — Active CDMO engagement
14. **CMC Leadership Hired** — New decision-maker onboarded
15. **CDMO Event Attendance** — Active buying behavior
16. **Competitor CDMO Deal** — Creates urgency
17. **Executive LinkedIn Activity** — Signals active research
18. **Earnings Call Mfg Mentions** — Internal priority signal
