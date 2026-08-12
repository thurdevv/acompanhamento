import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ensureSchema } from './db';
import { healthRouter } from './routes/health';
import { financeRouter } from './routes/finance';
import { studiesRouter } from './routes/studies';
import { projectsRouter } from './routes/projects';

dotenv.config();

const app = express();

// O frontend roda em outra origem (Static Site do Render), entao o CORS precisa
// liberar essa URL. Sem CORS_ORIGIN definido, libera geral (util no dev local).
// Aceita "site.onrender.com" ou "https://site.onrender.com", separados por virgula.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean)
  .map((o) => (/^https?:\/\//.test(o) ? o : `https://${o}`));

app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : {}));
app.use(express.json());

app.get('/api/status', (_req, res) => res.json({ ok: true }));
app.use('/api/health', healthRouter);
app.use('/api/finance', financeRouter);
app.use('/api/studies', studiesRouter);
app.use('/api/projects', projectsRouter);

// Handler de erro generico para nao derrubar o servidor
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const port = Number(process.env.PORT || 3001);

ensureSchema()
  .then(() => {
    app.listen(port, () => console.log(`API rodando em http://localhost:${port}`));
  })
  .catch((err) => {
    console.error('Falha ao conectar no PostgreSQL:', err.message);
    console.error(
      process.env.DATABASE_URL
        ? 'Verifique a variavel DATABASE_URL do servico.'
        : 'Verifique a senha em server/.env e rode "npm run setup" primeiro.'
    );
    process.exit(1);
  });
