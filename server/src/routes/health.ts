import { Router } from 'express';
import { pool } from '../db';

export const healthRouter = Router();

// Resumo do dia: agua, sono e refeicoes
healthRouter.get('/day', async (req, res) => {
  const date = String(req.query.date || new Date().toISOString().slice(0, 10));
  const [water, waterLogs, sleep, meals, settings] = await Promise.all([
    pool.query('SELECT COALESCE(SUM(amount_ml), 0)::int AS total FROM water_logs WHERE date = $1', [date]),
    pool.query('SELECT id, amount_ml, created_at FROM water_logs WHERE date = $1 ORDER BY created_at', [date]),
    pool.query('SELECT id, hours, quality FROM sleep_logs WHERE date = $1', [date]),
    pool.query('SELECT id, meal_type, description, healthy FROM meal_logs WHERE date = $1 ORDER BY created_at', [date]),
    pool.query('SELECT key, value FROM settings'),
  ]);
  const settingsMap: Record<string, string> = {};
  for (const row of settings.rows) settingsMap[row.key] = row.value;
  res.json({
    date,
    water_total_ml: water.rows[0].total,
    water_goal_ml: Number(settingsMap.water_goal_ml || 2500),
    water_logs: waterLogs.rows,
    sleep: sleep.rows[0] || null,
    sleep_goal_h: Number(settingsMap.sleep_goal_h || 8),
    meals: meals.rows,
  });
});

// Historico dos ultimos N dias
healthRouter.get('/history', async (req, res) => {
  const days = Math.min(Number(req.query.days || 7), 90);
  const result = await pool.query(
    `SELECT d.date::text AS date,
            COALESCE(w.total, 0)::int AS water_ml,
            s.hours AS sleep_hours,
            COALESCE(m.count, 0)::int AS meals_count,
            COALESCE(m.healthy_count, 0)::int AS healthy_meals
     FROM generate_series(CURRENT_DATE - ($1::int - 1), CURRENT_DATE, '1 day') AS d(date)
     LEFT JOIN (SELECT date, SUM(amount_ml) AS total FROM water_logs GROUP BY date) w ON w.date = d.date
     LEFT JOIN sleep_logs s ON s.date = d.date
     LEFT JOIN (
       SELECT date, COUNT(*) AS count, COUNT(*) FILTER (WHERE healthy) AS healthy_count
       FROM meal_logs GROUP BY date
     ) m ON m.date = d.date
     ORDER BY d.date DESC`,
    [days]
  );
  res.json(result.rows);
});

healthRouter.post('/water', async (req, res) => {
  const { date, amount_ml } = req.body;
  const result = await pool.query(
    'INSERT INTO water_logs (date, amount_ml) VALUES ($1, $2) RETURNING *',
    [date, amount_ml]
  );
  res.status(201).json(result.rows[0]);
});

healthRouter.delete('/water/:id', async (req, res) => {
  await pool.query('DELETE FROM water_logs WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

healthRouter.put('/sleep', async (req, res) => {
  const { date, hours, quality } = req.body;
  const result = await pool.query(
    `INSERT INTO sleep_logs (date, hours, quality) VALUES ($1, $2, $3)
     ON CONFLICT (date) DO UPDATE SET hours = EXCLUDED.hours, quality = EXCLUDED.quality
     RETURNING *`,
    [date, hours, quality || null]
  );
  res.json(result.rows[0]);
});

healthRouter.post('/meals', async (req, res) => {
  const { date, meal_type, description, healthy } = req.body;
  const result = await pool.query(
    'INSERT INTO meal_logs (date, meal_type, description, healthy) VALUES ($1, $2, $3, $4) RETURNING *',
    [date, meal_type, description, healthy !== false]
  );
  res.status(201).json(result.rows[0]);
});

healthRouter.delete('/meals/:id', async (req, res) => {
  await pool.query('DELETE FROM meal_logs WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

healthRouter.put('/settings', async (req, res) => {
  const entries = Object.entries(req.body as Record<string, string>);
  for (const [key, value] of entries) {
    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
      [key, String(value)]
    );
  }
  res.json({ ok: true });
});
