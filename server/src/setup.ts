import { Client } from 'pg';
import dotenv from 'dotenv';
import { pool, ensureSchema } from './db';

dotenv.config();

// Cria o banco de dados (se nao existir) e todas as tabelas.
async function main() {
  // Em servico gerenciado (Render) o banco ja existe: so criamos as tabelas.
  if (process.env.DATABASE_URL) {
    await ensureSchema();
    console.log('Tabelas criadas/verificadas com sucesso.');
    await pool.end();
    return;
  }

  const dbName = process.env.PGDATABASE || 'acompanhamento';
  const admin = new Client({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    database: 'postgres',
  });

  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Banco "${dbName}" criado.`);
  } else {
    console.log(`Banco "${dbName}" ja existe.`);
  }
  await admin.end();

  await ensureSchema();
  console.log('Tabelas criadas/verificadas com sucesso.');
  await pool.end();
}

main().catch((err) => {
  console.error('Erro no setup:', err.message);
  process.exit(1);
});
