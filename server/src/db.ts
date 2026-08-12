import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'acompanhamento',
});

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO settings (key, value) VALUES ('water_goal_ml', '2500') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('sleep_goal_h', '8') ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS water_logs (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  amount_ml INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sleep_logs (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  hours NUMERIC(4,1) NOT NULL,
  quality TEXT
);

CREATE TABLE IF NOT EXISTS meal_logs (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  description TEXT NOT NULL,
  healthy BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL,
  saved_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  deadline DATE
);

CREATE TABLE IF NOT EXISTS investments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  institution TEXT,
  amount NUMERIC(12,2) NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS study_cards (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  sections JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Em andamento',
  company TEXT,
  repo_url TEXT,
  technologies TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false
);
`;

export async function ensureSchema(): Promise<void> {
  await pool.query(SCHEMA_SQL);
}
