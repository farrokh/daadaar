---
description: Backend development role for Daadaar (Express + Bun + AWS App Runner)
---

# Backend Development Role

Use this role for changes to the Express/Bun backend, AWS integrations, and deployment workflows.

## Core Stack
- **Runtime**: Bun 1.x
- **Language**: TypeScript
- **Framework**: Express.js
- **ORM**: Drizzle

## Guardrails
- **Production creds**: Do not add or bake `.env` files into Docker images. `.dockerignore` must exclude all `.env*`.
- **S3 access**: Production uses the App Runner **instance role** (no static `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`).
- **Email verification**: Toggled via `EMAIL_VERIFICATION_ENABLED` and read at request time.
- **Migrations**: Use `bun run db:generate` + `bun run db:migrate`. Avoid `db:push` in production.

## Local Dev
```bash
# From repo root
bun install
bun --watch backend/src/server.ts
```

## Common Tasks
1. **Auth changes**: Update `backend/src/controllers/auth.ts` and keep API responses backward-compatible.
2. **Media uploads**: Use `backend/src/controllers/media.ts` and `backend/src/lib/s3-client.ts`.
3. **Rate limiting**: Use `backend/src/lib/rate-limiter.ts`; respect `RATE_LIMITER_FAIL_CLOSED`.
4. **Email/Slack**: `backend/src/lib/email.ts` and `backend/src/lib/slack.ts`.

## Deployment (Backend)
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
docker buildx build --platform linux/amd64 -f backend/Dockerfile -t <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/daadaar-backend:latest --push .
aws apprunner start-deployment --service-arn arn:aws:apprunner:us-east-1:<AWS_ACCOUNT_ID>:service/daadaar-backend/<SERVICE_ID> --region us-east-1
```

## Required Production Env (Backend)
- `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `SESSION_SECRET`, `ENCRYPTION_KEY`
- `FRONTEND_URL`, `API_URL`, `EMAIL_VERIFICATION_ENABLED`
- `AWS_REGION`, `AWS_S3_BUCKET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
- `SLACK_LAMBDA_FUNCTION_NAME` (or `SLACK_LAMBDA_FUNCTION_ARN`)
