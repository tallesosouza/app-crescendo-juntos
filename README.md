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
