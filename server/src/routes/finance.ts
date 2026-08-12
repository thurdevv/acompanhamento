import { Router } from 'express';
import { pool } from '../db';

export const financeRouter = Router();

// Transacoes do mes (YYYY-MM) + resumo por categoria
financeRouter.get('/month', async (req, res) => {
  const month = String(req.query.month || new Date().toISOString().slice(0, 7));
  const [transactions, byCategory, totals] = await Promise.all([
    pool.query(
      `SELECT id, date::text, type, category, description, amount
       FROM transactions WHERE to_char(date, 'YYYY-MM') = $1
       ORDER BY date DESC, id DESC`,
      [month]
    ),
    pool.query(
      `SELECT type, category, SUM(amount) AS total, COUNT(*)::int AS count
       FROM transactions WHERE to_char(date, 'YYYY-MM') = $1
       GROUP BY type, category ORDER BY total DESC`,
      [month]
    ),
    pool.query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE type = 'receita'), 0) AS receitas,
         COALESCE(SUM(amount) FILTER (WHERE type = 'despesa'), 0) AS despesas
       FROM transactions WHERE to_char(date, 'YYYY-MM') = $1`,
      [month]
    ),
  ]);
  res.json({
    month,
    transactions: transactions.rows,
    by_category: byCategory.rows,
    totals: totals.rows[0],
  });
});

financeRouter.post('/transactions', async (req, res) => {
  const { date, type, category, description, amount } = req.body;
  const result = await pool.query(
    'INSERT INTO transactions (date, type, category, description, amount) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [date, type, category, description || null, amount]
  );
  res.status(201).json(result.rows[0]);
});

financeRouter.delete('/transactions/:id', async (req, res) => {
  await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

// Metas
financeRouter.get('/goals', async (_req, res) => {
  const result = await pool.query('SELECT * FROM goals ORDER BY id');
  res.json(result.rows);
});

financeRouter.post('/goals', async (req, res) => {
  const { name, target_amount, saved_amount, deadline } = req.body;
  const result = await pool.query(
    'INSERT INTO goals (name, target_amount, saved_amount, deadline) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, target_amount, saved_amount || 0, deadline || null]
  );
  res.status(201).json(result.rows[0]);
});

financeRouter.put('/goals/:id', async (req, res) => {
  const { name, target_amount, saved_amount, deadline } = req.body;
  const result = await pool.query(
    'UPDATE goals SET name = $1, target_amount = $2, saved_amount = $3, deadline = $4 WHERE id = $5 RETURNING *',
    [name, target_amount, saved_amount, deadline || null, req.params.id]
  );
  res.json(result.rows[0]);
});

financeRouter.delete('/goals/:id', async (req, res) => {
  await pool.query('DELETE FROM goals WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

// Investimentos
financeRouter.get('/investments', async (_req, res) => {
  const result = await pool.query('SELECT * FROM investments ORDER BY id');
  res.json(result.rows);
});

financeRouter.post('/investments', async (req, res) => {
  const { name, type, institution, amount, notes } = req.body;
  const result = await pool.query(
    'INSERT INTO investments (name, type, institution, amount, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, type, institution || null, amount, notes || null]
  );
  res.status(201).json(result.rows[0]);
});

financeRouter.put('/investments/:id', async (req, res) => {
  const { name, type, institution, amount, notes } = req.body;
  const result = await pool.query(
    'UPDATE investments SET name = $1, type = $2, institution = $3, amount = $4, notes = $5 WHERE id = $6 RETURNING *',
    [name, type, institution || null, amount, notes || null, req.params.id]
  );
  res.json(result.rows[0]);
});

financeRouter.delete('/investments/:id', async (req, res) => {
  await pool.query('DELETE FROM investments WHERE id = $1', [req.params.id]);
  res.status(204).end();
});
