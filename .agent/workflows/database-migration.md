---
description: How to manage and deploy database migrations in the Daadaar platform.
---

# Database Migration Workflow

This workflow ensures that database changes are properly tracked, versioned, and applied securely.

## 1. Schema Changes
// turbo
1. Modify `database/schema.ts` with your desired table or column changes.
2. Ensure you add `session_id` and `createdByUserId` to any new reportable or contributable entities to support our anonymous-first architecture.

## 2. Generate Migration File
// turbo
1. Navigate to the database directory: `cd database`
2. Run the generate script: `bun run generate`
3. This will create a new `.sql` file in `backend/drizzle/`. 
4. **Review the generated SQL** to ensure it matches your expectations and doesn't perform destructive actions unintentionally.

## 3. Apply Changes to Local Database
There are two ways to apply changes locally:

### Option A: Sync without Migration (Fast Development)
Use this when you are iterating quickly and don't need a stable migration history yet.
// turbo
1. Run: `bun run push --force` (inside the `database` directory)

### Option B: Run Formal Migrations
// turbo
1. Run: `bun run migrate` (inside the `database` directory)

## 4. Troubleshooting
- If `drizzle-kit` hangs, check your `DATABASE_URL` in `database/.env`.
- If you see "Script not found", ensure you are in the `database` directory, or use the root shortcuts: `bun run db:push` or `bun run db:generate`.
