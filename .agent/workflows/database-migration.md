---
description: How to manage and deploy database migrations in the Daadaar platform.
---

# Database Migration Workflow

This workflow ensures that database changes are properly tracked, versioned, and applied securely.

## 1. Schema Changes
1. Modify `database/schema.ts` with your desired table or column changes.
2. Ensure you add `session_id` and `createdByUserId` to any new reportable or contributable entities to support our anonymous-first architecture.

## 2. Generate Migration File
1. From the repo root, run: `bun run db:generate`
3. This will create a new `.sql` file in `backend/drizzle/`. 
4. **Review the generated SQL** to ensure it matches your expectations and doesn't perform destructive actions unintentionally.

## 3. Apply Changes to Local Database
There are two ways to apply changes locally:

### Option A: Sync without Migration (Fast Development)
Use this when you are iterating quickly and don't need a stable migration history yet.
1. Run: `bun run db:push` (local only)

### Option B: Run Formal Migrations
1. Run: `bun run db:migrate`

## 4. Apply Changes to Production (CodeBuild)
Production migrations run inside the VPC using CodeBuild so they can reach RDS:

1. Build and push the backend image to ECR.
2. Create or update the CodeBuild project (example: `daadaar-migrations`) using `infrastructure/aws/codebuild-migrations.buildspec.yml`.
3. Store `DATABASE_URL` in Secrets Manager (example secret: `daadaar/prod/database-url`).
4. Start the build:
   ```bash
   aws codebuild start-build \
     --project-name daadaar-migrations \
     --region us-east-1 \
     --environment-variables-override name=RUN_MIGRATIONS,value=true,type=PLAINTEXT
   ```
5. Optional seed:
   ```bash
   aws codebuild start-build \
     --project-name daadaar-migrations \
     --region us-east-1 \
     --environment-variables-override name=RUN_SEED,value=true,type=PLAINTEXT
   ```

## 5. Troubleshooting
- If `drizzle-kit` hangs, check your `DATABASE_URL` in `database/.env`.
- If you see "Script not found", use the root shortcuts: `bun run db:push`, `bun run db:generate`, or `bun run db:migrate`.
