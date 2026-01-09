---
description: Comprehensive guide to deploying Daadaar to AWS Production
---

# Production Deployment Guide

This workflow steps you through deploying the **Daadaar** platform to AWS.
**Reference Docs**:
- `docs/architecture/infrastructure.md` (Architecture Overview)
- `docs/operations/cdn-configuration.md` (Media/CDN Setup)

**Note on Compute**: The architecture docs recommend **AWS ECS (Fargate)**. For this initial walkthrough, we use **AWS App Runner** as it handles the same container workloads with significantly less configuration overhead.

## Prerequisites

- AWS CLI installed and configured (`aws configure`).
- Docker installed and running.
- `daadaar.com` domain registered (managed via Namecheap).
- Cloudflare account (recommended per docs).

---

## Step 1: Network & Database Setup

1.  **Create an RDS PostgreSQL Instance**:
    *   **Engine**: PostgreSQL (v16 recommended).
    *   **Instance Class**: `db.t3.micro` (Free Tier) or `db.t4g.small`.
    *   **DB Name**: `daadaar`.
    *   **Master Username**: `daadaar_admin`.
    *   **Public Access**: No (recommended). Ensure it's in a VPC reachable by the backend.

2.  **Create a Redis Instance**:
    *   **Required Dependency**: Per `infrastructure.md`, Redis is required for rate limiting.
    *   **Provider**: AWS ElastiCache (Redis) or Upstash (easier).
    *   **URL**: Save the connection string (e.g., `rediss://...`).

3.  **S3 Media Bucket**:
    *   Create bucket: `daadaar-media-v1-<account-id>` (current prod: `daadaar-media-v1-317430950654`).
    *   Region: `us-east-1`.
    *   **Permissions**: Configure Bucket Policy to allow Cloudflare IPs (see `docs/operations/cdn-configuration.md`).

---

## Step 2: Backend Deployment (AWS App Runner)

### 2.1 Create ECR Repository
```bash
aws ecr create-repository --repository-name daadaar-backend --region us-east-1
```

### 2.2 Build and Push Image
```bash
# Authenticate
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build (Platform linux/amd64 is crucial for AWS)
docker build --platform linux/amd64 -t daadaar-backend -f backend/Dockerfile .

# Tag & Push
docker tag daadaar-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/daadaar-backend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/daadaar-backend:latest
```

### 2.3 Create App Runner Service
1.  **Source**: Container Registry (URI from above).
2.  **Configuration**:
    *   **Port**: `4000`.
    *   **Instance**: `1 vCPU / 2 GB`.
    *   **Environment Variables**:
        *   `NODE_ENV`: `production`
        *   `DATABASE_URL`: `postgres://daadaar_admin:PASS@HOST:5432/daadaar?sslmode=require`
        *   `REDIS_URL`: `rediss://...`
        *   `FRONTEND_URL`: `https://www.daadaar.com`
        *   `USE_CDN`: `true`
        *   `CDN_URL`: `https://media.daadaar.com`
        *   `AWS_REGION`: `us-east-1`
        *   `AWS_S3_BUCKET`: `daadaar-media-v1-<account-id>`
        *   `SLACK_LAMBDA_FUNCTION_NAME`: `daadaar-slack-notifier`
        *   **IAM**: Use the App Runner instance role for S3 access (avoid static access keys).
    *   **Health Check path**: `/health`
    *   **Secrets hygiene**:
        *   Ensure `.dockerignore` excludes `.env` files.
        *   Do not load `dotenv` in production containers.

---

## Step 3: Frontend Deployment (Vercel)

1.  **Create Project**: Import the repo in Vercel.
2.  **Root Directory**: `frontend`
3.  **Build Settings**: Use `frontend/vercel.json` (Bun install/build).
4.  **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: `https://api.daadaar.com/api`
    *   `NEXT_PUBLIC_APP_URL`: `https://www.daadaar.com`
    *   `NEXT_PUBLIC_AWS_S3_BUCKET`: `daadaar-media-v1-<account-id>`
    *   `NEXT_PUBLIC_AWS_REGION`: `us-east-1`
    *   `NEXT_PUBLIC_MOCK_MEDIA_SERVER`: `false`

---

## Step 4: Domain & CDN Configuration

### 4.1 DNS (Namecheap + Cloudflare)
Per `docs/operations/cdn-configuration.md`, it is highly recommended to proxy media traffic through Cloudflare.

1.  **Point Namecheap to Cloudflare**: Change Nameservers in Namecheap to Cloudflare's.
2.  **Cloudflare DNS Records**:
    *   `A` `@` -> `76.76.21.21` (Vercel apex, DNS only).
    *   `CNAME` `www` -> `cname.vercel-dns.com` (DNS only).
    *   `CNAME` `api` -> App Runner default domain (DNS only).
    *   `CNAME` `media` -> `daadaar-media-v1-<account-id>.s3.us-east-1.amazonaws.com` (Proxied).

### 4.2 Cloudflare Rules
*   **Media**: Set Page Rule for `media.daadaar.com/*` to "Cache Everything".
*   See `docs/operations/cdn-configuration.md` for exact configurations.

---

## Step 5: Database Migrations (Production)

Use the CodeBuild runner so migrations execute inside the VPC:
1. Create a CodeBuild project (example name: `daadaar-migrations`) that uses `infrastructure/aws/codebuild-migrations.buildspec.yml`.
2. Store `DATABASE_URL` in Secrets Manager (example secret: `daadaar/prod/database-url`).
3. Run a build with overrides:
   ```bash
   aws codebuild start-build \
     --project-name daadaar-migrations \
     --region us-east-1 \
     --environment-variables-override name=RUN_MIGRATIONS,value=true,type=PLAINTEXT
   ```

---

## Operational Checks

### Slack Notifications
- Health check: `GET /api/health/notifications/slack`
- Expect: `{"ok": true, "configured": true, "mode": "lambda"}`

### Media (S3)
- In production, the App Runner **instance role** must have `s3:ListBucket`, `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` on the media bucket.
- Do not set `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` in App Runner.

### Email Verification Toggle
- `EMAIL_VERIFICATION_ENABLED=false` allows logins without verification.

### Production seeding prohibition
- Automatic/seeding scripts must not run in production (risking data overwrite or security issues).
- **Seeding is not allowed in production.**

---

## Updating Production

### Backend Update Workflow
Since `AutoDeploymentsEnabled` is set to `false` (recommended for stability), updating the backend requires:

1.  **Build & Push Docker Image**:
    ```bash
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
    docker build --platform linux/amd64 -t daadaar-backend -f backend/Dockerfile .
    docker tag daadaar-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/daadaar-backend:latest
    docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/daadaar-backend:latest
    ```

2.  **Trigger Deployment**:
    ```bash
    aws apprunner start-deployment --service-arn <SERVICE_ARN>
    ```

### Database Migration Update
Migrations run via CodeBuild using the **latest Docker image from ECR**.
**CRITICAL**: You MUST push the updated Docker image (Step 1 above) *before* running the migration build, as CodeBuild pulls `daadaar-backend:latest` to execute the migration script.

```bash
aws codebuild start-build \
  --project-name daadaar-migrations \
  --region us-east-1 \
  --environment-variables-override name=RUN_MIGRATIONS,value=true,type=PLAINTEXT
```

### Frontend Update Workflow
To deploy frontend changes (including the automated changelog):

1.  **Deploy Production**:
    Run this single command from the `frontend/` directory. It will automatically generate translations (using your local key) and then trigger the deployment.
    ```bash
    bun run deploy:prod
    ```
