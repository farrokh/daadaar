---
description: How to add a new graph entity (Organization, Individual, Role, or a new type) to the platform.
---

# Adding a New Graph Entity Workflow

Follow these steps to ensure a new entity is correctly integrated across the entire stack.

## 1. Database Schema
1. Open `database/schema.ts`.
2. Define the new table. **Rule**: Every contributable entity MUST have:
   - `id`: serial primary key.
   - `createdByUserId`: integer referencing `users.id` (nullable).
   - `sessionId`: uuid (for anonymous tracking).
   - `createdAt`: timestamp (not null, default now).
   - `updatedAt`: timestamp (not null, default now).
3. If it's a node in the graph, ensure it has `name`/`nameEn` or `title`/`titleEn` fields for i18n.

## 2. Migration
1. Run the `/database-migration` workflow to generate and apply the SQL.

## 3. Shared Types
1. Open `shared/types.ts` (or the relevant types file).
2. Add the interface for the new entity.
3. Ensure the types match the Drizzle schema.

## 4. Backend Implementation
1. **Controller**: Create a new controller in `backend/src/controllers/`.
   - Implement standard CRUD (Create, List, Get, Update).
   - Ensure the `create` method captures both `userId` and `sessionId` from `req.currentUser`.
2. **Routes**: Create a new route file in `backend/src/routes/`.
   - Apply `authMiddleware`.
   - Mount the routes in `backend/src/server.ts`.

## 5. Frontend Implementation
1. **API Client**: Add necessary fetch functions in `frontend/lib/api.ts` (if they aren't generic).
2. **Components**:
   - Create an "Add [Entity] Modal" similar to `AddOrganizationModal`.
   - Add the entity to the `GraphCanvas` if it should be displayed in the graph.
3. **Translations**: Add the new labels/phrases to `frontend/messages/fa.json` and `en.json`.

## 6. Verification
1. Test creating the entity as an anonymous user.
2. Test creating it as a registered user.
3. Verify it shows up correctly in the graph with the correct RTL/LTR labels.
