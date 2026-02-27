CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signal_states (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  signal_id TEXT NOT NULL,
  state TEXT CHECK(state IN ('absent','inferred','present')) DEFAULT 'absent',
  notes TEXT,
  source_url TEXT,
  UNIQUE(company_id, signal_id)
);

CREATE TABLE IF NOT EXISTS score_snapshots (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  need_score REAL,
  timing_score REAL,
  behavior_score REAL,
  intent_level TEXT,
  total_score REAL,
  confidence REAL,
  scored_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signal_states_company ON signal_states(company_id);
CREATE INDEX IF NOT EXISTS idx_score_snapshots_company ON score_snapshots(company_id);
