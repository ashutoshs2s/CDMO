import { Router } from 'express';
import pool from '../db/connection.js';
import { triangulate, ALL_SIGNAL_IDS } from '../services/scoring-engine.js';
import type { SignalState } from '../services/scoring-engine.js';
import { analyzeCompany } from '../services/website-analyzer.js';

const router = Router();

// Analyze company website with AI
router.post('/analyze', async (req, res) => {
  const { companyName, websiteUrl } = req.body as { companyName: string; websiteUrl?: string };
  if (!companyName?.trim()) {
    res.status(400).json({ error: 'Company name is required' });
    return;
  }

  try {
    const result = await analyzeCompany({ companyName: companyName.trim(), websiteUrl: websiteUrl?.trim() });
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    console.error('Analysis error:', err);
    res.status(500).json({ error: message });
  }
});

// List all companies with latest scores
router.get('/', async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT c.*, s.need_score, s.timing_score, s.behavior_score,
           s.intent_level, s.total_score, s.confidence
    FROM companies c
    LEFT JOIN LATERAL (
      SELECT * FROM score_snapshots WHERE company_id = c.id ORDER BY scored_at DESC LIMIT 1
    ) s ON true
    ORDER BY c.updated_at DESC
  `);
  res.json(rows);
});

// Get single company with signals
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const companyRes = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
  if (companyRes.rows.length === 0) { res.status(404).json({ error: 'Not found' }); return; }

  const signalRes = await pool.query('SELECT signal_id, state, notes, source_url FROM signal_states WHERE company_id = $1', [id]);
  const signals: Record<string, SignalState> = {};
  for (const sid of ALL_SIGNAL_IDS) signals[sid] = 'absent';
  for (const row of signalRes.rows) signals[row.signal_id] = row.state;

  const scoring = triangulate(signals);
  res.json({ ...companyRes.rows[0], signals, scoring });
});

// Create company
router.post('/', async (req, res) => {
  const { name, signals } = req.body as { name: string; signals?: Record<string, SignalState> };
  if (!name?.trim()) { res.status(400).json({ error: 'Name is required' }); return; }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('INSERT INTO companies (name) VALUES ($1) RETURNING *', [name.trim()]);
    const company = rows[0];

    const sigMap: Record<string, SignalState> = {};
    for (const sid of ALL_SIGNAL_IDS) sigMap[sid] = 'absent';
    if (signals) {
      for (const [id, val] of Object.entries(signals)) {
        if (ALL_SIGNAL_IDS.includes(id) && ['absent', 'inferred', 'present'].includes(val)) {
          sigMap[id] = val;
        }
      }
    }

    for (const [sigId, state] of Object.entries(sigMap)) {
      await client.query(
        'INSERT INTO signal_states (company_id, signal_id, state) VALUES ($1, $2, $3)',
        [company.id, sigId, state]
      );
    }

    const scoring = triangulate(sigMap);
    await client.query(
      `INSERT INTO score_snapshots (company_id, need_score, timing_score, behavior_score, intent_level, total_score, confidence)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [company.id, scoring.categories.need.score, scoring.categories.timing.score,
       scoring.categories.behavior.score, scoring.intent, scoring.totalScore, scoring.confidence]
    );

    await client.query('COMMIT');
    res.status(201).json({ ...company, signals: sigMap, scoring });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// Update signals
router.put('/:id/signals', async (req, res) => {
  const { id } = req.params;
  const { signals } = req.body as { signals: Record<string, SignalState> };

  const companyRes = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
  if (companyRes.rows.length === 0) { res.status(404).json({ error: 'Not found' }); return; }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [sigId, state] of Object.entries(signals)) {
      if (!ALL_SIGNAL_IDS.includes(sigId) || !['absent', 'inferred', 'present'].includes(state)) continue;
      await client.query(
        `INSERT INTO signal_states (company_id, signal_id, state)
         VALUES ($1, $2, $3)
         ON CONFLICT (company_id, signal_id) DO UPDATE SET state = $3`,
        [id, sigId, state]
      );
    }

    await client.query('UPDATE companies SET updated_at = NOW() WHERE id = $1', [id]);

    const sigRes = await client.query('SELECT signal_id, state FROM signal_states WHERE company_id = $1', [id]);
    const sigMap: Record<string, SignalState> = {};
    for (const sid of ALL_SIGNAL_IDS) sigMap[sid] = 'absent';
    for (const row of sigRes.rows) sigMap[row.signal_id] = row.state;

    const scoring = triangulate(sigMap);
    await client.query(
      `INSERT INTO score_snapshots (company_id, need_score, timing_score, behavior_score, intent_level, total_score, confidence)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, scoring.categories.need.score, scoring.categories.timing.score,
       scoring.categories.behavior.score, scoring.intent, scoring.totalScore, scoring.confidence]
    );

    await client.query('COMMIT');
    res.json({ ...companyRes.rows[0], signals: sigMap, scoring });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// Delete company
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM companies WHERE id = $1', [id]);
  if (result.rowCount === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ deleted: true });
});

// Compare companies
router.get('/compare/scores', async (req, res) => {
  const ids = (req.query.ids as string || '').split(',').filter(Boolean).map(Number);
  if (ids.length < 2) { res.status(400).json({ error: 'Provide at least 2 company ids' }); return; }

  const results = [];
  for (const id of ids) {
    const companyRes = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
    if (companyRes.rows.length === 0) continue;
    const sigRes = await pool.query('SELECT signal_id, state FROM signal_states WHERE company_id = $1', [id]);
    const sigMap: Record<string, SignalState> = {};
    for (const sid of ALL_SIGNAL_IDS) sigMap[sid] = 'absent';
    for (const row of sigRes.rows) sigMap[row.signal_id] = row.state;
    results.push({ ...companyRes.rows[0], signals: sigMap, scoring: triangulate(sigMap) });
  }
  res.json(results);
});

export default router;
