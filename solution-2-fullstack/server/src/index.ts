import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import pool from './db/connection.js';
import companiesRouter from './routes/companies.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// API routes
app.use('/api/companies', companiesRouter);

// In production, serve the built client
if (process.env.NODE_ENV === 'production') {
  const clientDist = join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.use((_req, res) => {
    res.sendFile(join(clientDist, 'index.html'));
  });
}

// Auto-migrate on startup
async function migrate() {
  try {
    const schema = readFileSync(join(__dirname, 'db/schema.sql'), 'utf-8');
    await pool.query(schema);
    console.log('Database schema applied.');
  } catch (err) {
    console.error('DB migration warning:', err);
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  migrate();
});
