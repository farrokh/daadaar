# Production Deployment & Database Management

This guide details the process for deploying database changes and managing the production environment using AWS CodeBuild.

## Overview

We use AWS CodeBuild to run database migrations and seeds in production. This is necessary because:
1. **VPC Access**: The production RDS instance is in a private subnet, so we need a compute environment (CodeBuild) inside the VPC to access it.
2. **Security**: We avoid exposing the database to the public internet or managing SSH tunnels.
3. **Automation**: It integrates with our CI/CD pipeline.

## 1. Prerequisites Setup

Before running migrations, ensure the following infrastructure is in place:

### CodeBuild Project (`daadaar-migrations`)
The project must be configured with:
- **Service Role**: `daadaar-codebuild-migrations-role` with permissions to:
  - Pull images from ECR
  - Create/write CloudWatch logs
  - Create network interfaces (for VPC access)
  - Get secrets from Secrets Manager (for `DATABASE_URL`)
- **VPC Configuration**:
  - Attached to the production VPC (`vpc-xxxxxxxxxx`)
  - Subnets: Private subnets capable of reaching RDS
  - Security Group: Allowed ingress to RDS (e.g., `sg-xxxxxxxx`)
- **Environment**:
  - Image: `aws/codebuild/standard:7.0` (or similar)
  - Compute: `BUILD_GENERAL1_SMALL`
  - Privileged: `true` (required for running Docker)
  - Environment Variables:
    - `DATABASE_URL`: Retrieved from Secrets Manager (`daadaar/prod/database-url`)
    - `IMAGE_URI`: The ECR URI for the backend image (e.g., `317430950654.dkr.ecr.us-east-1.amazonaws.com/daadaar-backend:latest`)
    - `RUN_MIGRATIONS`: `true`/`false`
    - `RUN_SEED`: `true`/`false`

### Build Specification
The project uses `infrastructure/aws/codebuild-migrations.buildspec.yml`. This file:
1. Logs into ECR
2. Pulls the backend Docker image
3. executing `bun src/db/migrate.ts` or `bun src/db/seed-organizations.ts` *inside* the container, passing the `DATABASE_URL`.

## 2. Deploying Changes

### Step 1: Build & Push Docker Image
Since CodeBuild runs the Docker container, the image must contain the latest code (migrations/seeds) and be compatible with the CodeBuild architecture (x86_64/AMD64).

**Important**: If building from an Apple Silicon (M1/M2/M3) mac, you **MUST** specify the platform:

```bash
docker buildx build --platform linux/amd64 -f backend/Dockerfile -t 317430950654.dkr.ecr.us-east-1.amazonaws.com/daadaar-backend:latest --push .
```

### Step 2: Trigger CodeBuild

You can trigger the build via AWS Console or CLI.

#### To Run Migrations:
```bash
aws codebuild start-build \
  --project-name daadaar-migrations \
  --region us-east-1 \
  --environment-variables-override name=RUN_MIGRATIONS,value=true,type=PLAINTEXT name=RUN_SEED,value=false,type=PLAINTEXT
```

#### To Run Seeds (e.g., Organizations):
```bash
aws codebuild start-build \
  --project-name daadaar-migrations \
  --region us-east-1 \
  --environment-variables-override name=RUN_SEED,value=true,type=PLAINTEXT name=RUN_MIGRATIONS,value=false,type=PLAINTEXT
```

## 3. Common Issues & Solutions

### "Exec Format Error"
**Cause**: The Docker image was built for ARM64 (Apple Silicon) but CodeBuild is running on AMD64.
**Fix**: Rebuild the image with `--platform linux/amd64`.

### "Module not found" or "Cannot find package"
**Cause**: The script path in `buildspec.yml` is incorrect relative to the Docker container's working directory, or dependencies are not resolvable.
**Fix**: 
- Ensure scripts are in `backend/src/db/` (or similar mapped path).
- Do not rely on loose scripts in root `/scripts/` folder if the Docker image uses workspaces.
- Check `buildspec.yml` command path.

### Connection Timed Out
**Cause**: CodeBuild cannot reach RDS.
**Fix**:
- Check CodeBuild VPC settings.
- Ensure the Security Group allows inbound traffic on port 5432 from the CodeBuild Security Group.
- Ensure CodeBuild is in a subnet with correct routing tables.

### "No matching manifest for linux/amd64"
**Cause**: The pulled image only has an ARM64 manifest.
**Fix**: Rebuild with `docker buildx build --platform linux/amd64 ...`.
