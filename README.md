# Acompanhamento Pessoal

Sistema de acompanhamento pessoal com 4 áreas: **Saúde** (água, sono e alimentação),
**Finanças** (receitas, despesas, categorias, metas e investimentos), **Estudos**
(cartões personalizáveis) e **Projetos** (cartões de projetos de programação).

Sem gráficos — todos os indicadores são números e percentuais em texto.
Design baseado no modelo Nixtio (creme + carvão + amarelo, navegação em pílulas).

## Stack

- **Frontend:** React + TypeScript + Vite (`client/`)
- **Backend:** Node.js + Express + TypeScript (`server/`)
- **Banco:** PostgreSQL

## Como rodar pela primeira vez

### 1. Configurar a senha do PostgreSQL

Copie `server/.env.example` para `server/.env` e preencha a senha do seu usuário
`postgres`:

```bash
cd server
copy .env.example .env
```

```
PGPASSWORD=sua_senha_real
```

### 2. Criar o banco e as tabelas

```bash
cd server
npm run setup
```

Isso cria o banco `acompanhamento` e todas as tabelas automaticamente.

### 3. Subir a API

```bash
cd server
npm run dev
```

A API sobe em `http://localhost:3001`.

### 4. Subir o frontend (em outro terminal)

```bash
cd client
npm run dev
```

Acesse `http://localhost:5173`. A interface é responsiva — funciona no celular
(basta acessar pelo IP da máquina na mesma rede, ex: `http://192.168.x.x:5173`).

## Deploy no Render

O repositório é um monorepo e **não tem `package.json` na raiz** — por isso um
serviço apontado para a raiz falha com `ENOENT: package.json`. O
[`render.yaml`](render.yaml) resolve isso definindo o `rootDir` de cada serviço.

### Passo a passo

1. No Render: **New → Blueprint** e selecione este repositório. Ele lê o
   `render.yaml` e cria três recursos de uma vez:
   - `acompanhamento-db` — PostgreSQL gerenciado
   - `acompanhamento-api` — Web Service com o Express de `server/`
   - `acompanhamento-web` — Static Site com o build do `client/`
2. Quando pedir o valor de `CORS_ORIGIN`, **deixe em branco** (a URL do frontend
   ainda não existe).
3. Terminado o primeiro deploy, copie a URL do `acompanhamento-web`
   (ex: `https://acompanhamento-web.onrender.com`), cole em `CORS_ORIGIN` nas
   variáveis de ambiente do `acompanhamento-api` e salve. Isso restringe a API a
   aceitar chamadas só do seu frontend.

As tabelas são criadas sozinhas: o `ensureSchema()` roda no boot da API.

### Variáveis de ambiente

| Serviço | Variável | Origem |
| --- | --- | --- |
| API | `DATABASE_URL` | preenchida pelo Render a partir do banco |
| API | `CORS_ORIGIN` | manual, após o 1º deploy (aceita lista separada por vírgula) |
| Frontend | `VITE_API_URL` | preenchida pelo Render com o host da API |

Localmente nada disso é necessário: sem `DATABASE_URL` o backend continua usando
as variáveis `PG*` do `server/.env`, e sem `VITE_API_URL` o frontend usa o proxy
`/api` do Vite.

> O plano free do PostgreSQL no Render expira em 30 dias e os serviços free
> hibernam depois de 15 minutos sem tráfego (a primeira chamada depois disso
> demora alguns segundos).

## Estrutura

```
render.yaml           # blueprint do Render (banco + API + frontend)
server/
  src/
    index.ts          # servidor Express
    db.ts             # pool de conexão + schema (CREATE TABLE IF NOT EXISTS)
    setup.ts          # cria o banco e as tabelas (npm run setup)
    routes/
      health.ts       # água, sono, refeições, histórico, metas de saúde
      finance.ts      # transações, resumo mensal, metas, investimentos
      studies.ts      # cartões de estudo (seções livres em JSONB)
      projects.ts     # projetos + tarefas
client/
  src/
    App.tsx           # navegação em pílulas (Resumo, Saúde, Finanças, Estudos, Projetos)
    api.ts            # cliente HTTP + formatadores (R$, datas)
    styles.css        # design system (Inter + Poppins, paleta creme/carvão/amarelo)
    pages/            # uma página por área
```

## Ajustes rápidos

- **Metas de água/sono:** ficam na tabela `settings` (`water_goal_ml`, padrão 2500;
  `sleep_goal_h`, padrão 8). Dá para alterar via SQL ou pelo endpoint
  `PUT /api/health/settings`.
- **Categorias de gastos:** listas `EXPENSE_CATEGORIES` / `INCOME_CATEGORIES` em
  [`client/src/pages/Financas.tsx`](client/src/pages/Financas.tsx).
