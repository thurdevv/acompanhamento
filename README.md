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

## Estrutura

```
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
