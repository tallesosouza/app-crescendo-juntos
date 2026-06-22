# Crescendo Juntos

Monorepo NestJS + Angular 22 para a aplicação Crescendo Juntos.

## Pré-requisitos

- **Node.js** 22.22.3+, 24.15.0+, or 26+
- **pnpm** 9+
- **Docker** (para executar o banco de dados Postgres localmente)

## Instalação e Setup

```bash
# Instalar dependências
pnpm install

# Subir banco de dados Postgres
pnpm db:up

# Verificar status do container
docker compose ps
```

## Desenvolvimento

```bash
# Backend (NestJS)
pnpm backend:dev

# Frontend (Angular)
pnpm frontend:dev

# Testes
pnpm test
```

## Parar o banco de dados

```bash
pnpm db:down
```

## Estrutura do Monorepo

```
├── backend/     # Aplicação NestJS
├── frontend/    # Aplicação Angular
├── shared/      # Código compartilhado
└── ...
```

## Banco de Dados

O Postgres é executado localmente em:
- **Host:** localhost
- **Porta:** 5432
- **Database:** crescendo
- **User:** crescendo
- **Password:** crescendo

## Deploy

### Backend (Render)

O arquivo `render.yaml` na raiz do monorepo configura o deploy do backend:

- **Root Directory:** `backend/`
- **Build:** `pnpm install && pnpm prisma:generate && pnpm build`
- **Start:** `pnpm prisma:deploy && pnpm start:prod`
- **Variáveis de Ambiente:**
  - `DATABASE_URL`: conexão RDS Postgres (sem sync automático)
  - `SUPABASE_JWKS_URL`: URL da JWKS do Supabase (sem sync automático)
  - `PORT`: 3000 (padrão)

### Frontend (Vercel)

O arquivo `frontend/vercel.json` configura o deploy do frontend:

- **Root Directory:** `frontend/`
- **Build Command:** `pnpm build`
- **Output Directory:** `dist/frontend/browser`
- **Rewrites:** SPA routing configurado para redirecionar todas as rotas para `index.html`

Ao conectar o repositório no Vercel, configure o Root Directory como `frontend` para que o deploy use a configuração do `vercel.json` automaticamente.
