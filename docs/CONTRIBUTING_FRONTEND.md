# Frontend Contribution Guide

This guide covers frontend-specific workflow for the Next.js app in `frontend/`.

## Prerequisites
- Bun 1.0+
- Node.js (for editor tooling)

## Local Setup
```bash
# From repo root
bun install
bun run dev:frontend
```

Frontend dev server runs at `http://localhost:3000`.

## Environment Variables
Copy `.env.example` to `.env` at the repo root and set:
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_AWS_S3_BUCKET=daadaar-media-v1-317430950654
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_MOCK_MEDIA_SERVER=true
```

Notes:
- Use `NEXT_PUBLIC_MOCK_MEDIA_SERVER=true` for local media without S3.
- The production API is `https://api.daadaar.com/api`.

## Commands
```bash
bun --cwd frontend run dev
bun --cwd frontend run build
bun --cwd frontend run lint
bun --cwd frontend run type-check
```

## i18n Workflow
- Persian (`fa`) is the source of truth.
- Update translations in `frontend/messages`.
- Keep RTL layout intact for Persian.

## Shared Types
Frontend imports shared types via `@/shared/*`.
Because Vercel builds only the `frontend/` directory, we also keep a mirrored copy in `frontend/shared/`.
When you change `shared/`, mirror those changes in `frontend/shared/` too.

## UI/UX Expectations
- Maintain the glassmorphism look and intentional typography.
- Avoid introducing default UI patterns without matching the design language.
- Keep interactions fast and readable on mobile.

## Deployment Notes
Frontend is deployed on Vercel with Bun (see `frontend/vercel.json`).
Canonical production origin is `https://www.daadaar.com`.
