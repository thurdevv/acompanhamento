import { Router } from 'express';
import { pool } from '../db';

export const studiesRouter = Router();

studiesRouter.get('/', async (_req, res) => {
  const result = await pool.query('SELECT * FROM study_cards ORDER BY created_at DESC');
  res.json(result.rows);
});

studiesRouter.post('/', async (req, res) => {
  const { title, subtitle, color, sections } = req.body;
  const result = await pool.query(
    'INSERT INTO study_cards (title, subtitle, color, sections) VALUES ($1, $2, $3, $4) RETURNING *',
    [title, subtitle || null, color || '#6366f1', JSON.stringify(sections || [])]
  );
  res.status(201).json(result.rows[0]);
});

studiesRouter.put('/:id', async (req, res) => {
  const { title, subtitle, color, sections } = req.body;
  const result = await pool.query(
    'UPDATE study_cards SET title = $1, subtitle = $2, color = $3, sections = $4 WHERE id = $5 RETURNING *',
    [title, subtitle || null, color || '#6366f1', JSON.stringify(sections || []), req.params.id]
  );
  res.json(result.rows[0]);
});

studiesRouter.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM study_cards WHERE id = $1', [req.params.id]);
  res.status(204).end();
});
