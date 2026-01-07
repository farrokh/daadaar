# Backend Contribution Guide

This guide covers backend-specific workflow for the Express API in `backend/`.

## Prerequisites
- Bun 1.0+
- PostgreSQL 15+ (local)
- Redis (local, optional but recommended)

## Local Setup
```bash
# From repo root
bun install
bun run dev:backend
```

Backend API runs at `http://localhost:4000`.

## Environment Variables
Copy `.env.example` to `.env` at the repo root and set:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/daadaar
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
JWT_SECRET=local-dev-secret
SESSION_SECRET=local-dev-session-secret
ENCRYPTION_KEY=local-dev-encryption-key
```

Notes:
- Redis is required in production for rate limiting; local dev can run without it.
- CORS allows only `FRONTEND_URL`.

## Database Workflow
```bash
# Generate migrations
bun run db:generate

# Apply migrations
bun run db:migrate
```

Do not use `db:push` in production.

## Commands
```bash
bun --cwd backend run dev
bun --cwd backend run build
bun --cwd backend run lint
bun --cwd backend run type-check
```

## Key Endpoints
- `GET /health` (liveness)
- `GET /api/health` (DB/Redis status)
- `GET /api/graph/*`

## Deployment Notes
The API is deployed on AWS App Runner with a custom domain:
- `https://api.daadaar.com`
Production CORS origin is `https://www.daadaar.com`.
