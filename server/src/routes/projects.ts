import { Router } from 'express';
import { pool } from '../db';

export const projectsRouter = Router();

projectsRouter.get('/', async (_req, res) => {
  const [projects, tasks] = await Promise.all([
    pool.query('SELECT * FROM projects ORDER BY created_at DESC'),
    pool.query('SELECT * FROM project_tasks ORDER BY id'),
  ]);
  const withTasks = projects.rows.map((p) => ({
    ...p,
    tasks: tasks.rows.filter((t) => t.project_id === p.id),
  }));
  res.json(withTasks);
});

projectsRouter.post('/', async (req, res) => {
  const { name, status, company, repo_url, technologies } = req.body;
  const result = await pool.query(
    'INSERT INTO projects (name, status, company, repo_url, technologies) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, status || 'Em andamento', company || null, repo_url || null, technologies || []]
  );
  res.status(201).json({ ...result.rows[0], tasks: [] });
});

projectsRouter.put('/:id', async (req, res) => {
  const { name, status, company, repo_url, technologies } = req.body;
  const result = await pool.query(
    'UPDATE projects SET name = $1, status = $2, company = $3, repo_url = $4, technologies = $5 WHERE id = $6 RETURNING *',
    [name, status, company || null, repo_url || null, technologies || [], req.params.id]
  );
  res.json(result.rows[0]);
});

projectsRouter.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

projectsRouter.post('/:id/tasks', async (req, res) => {
  const result = await pool.query(
    'INSERT INTO project_tasks (project_id, title) VALUES ($1, $2) RETURNING *',
    [req.params.id, req.body.title]
  );
  res.status(201).json(result.rows[0]);
});

projectsRouter.put('/tasks/:taskId', async (req, res) => {
  const { title, done } = req.body;
  const result = await pool.query(
    'UPDATE project_tasks SET title = COALESCE($1, title), done = COALESCE($2, done) WHERE id = $3 RETURNING *',
    [title ?? null, done ?? null, req.params.taskId]
  );
  res.json(result.rows[0]);
});

projectsRouter.delete('/tasks/:taskId', async (req, res) => {
  await pool.query('DELETE FROM project_tasks WHERE id = $1', [req.params.taskId]);
  res.status(204).end();
});
