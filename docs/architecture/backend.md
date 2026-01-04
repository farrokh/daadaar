# Backend Architecture & API Design

The Daadaar backend is a robust Node.js API designed for high-concurrency, secure data processing, and seamless integration with the frontend.

## Runtime & Framework
- **Runtime**: Node.js 24+ LTS
- **Language**: TypeScript
- **Framework**: Express.js
- **ORM**: Drizzle ORM

---

## 📊 Data Model Highlights

| Entity | Description |
|---|---|
| **Reports** | User-submitted claims about organizations/individuals. |
| **Organizations** | Companies, NGOs, government bodies. |
| **Individuals** | People associated with organizations or reports. |
| **Roles** | Positions held by individuals within organizations. |
| **Votes** | Community credibility assessments. |
| **Media** | Attachments linked to reports. |
| **Users** | Registered identities (Admin, Moderator, User). |

*Note: All entities (Reports, Organizations, Individuals, Roles) support attribution to either a `userId` or a `sessionId`.*

## 🔐 Unified Authentication System

Our authentication layer is uniquely designed to support both anonymous and registered users with a shared state.

### 1. Anonymous Sessions (Default)
- Generated on the first visit.
- Stored in Redis for high-performance access.
- Used for tracking contributions (Reports, Organizations, People, Roles) and rate-limiting without requiring PII.

### 2. Registered Users
- **Standard**: Email/Password with bcrypt hashing and JWT tokens.
- **OAuth**: Google OAuth integration via Passport.js.
- **Security**: Strict "No Auto-Link" policy to prevent account takeover from OAuth provider email matches.

### 3. Unified Middleware
All requests pass through an `authMiddleware` that populates a `currentUser` object:
- `RegisteredUser`: `{ type: 'registered', id, role, ... }`
- `AnonymousUser`: `{ type: 'anonymous', sessionId }`

---

## 📡 API Architecture

### Type-Safe Contracts
We use a shared library (`shared/api-types.ts`) to synchronize types between the frontend and backend.
- **Benefits**: Compile-time errors for API changes and full IDE autocomplete.
- **Structure**: All responses follow a standard `{ success: boolean, data?: T, error?: ApiError }` wrapper.

### Key Endpoints
- `/api/graph`: Retrieves graph nodes and edges with recursive PostgreSQL CTEs.
- `/api/reports`: CRUD for user reports with PoW validation.
- `/api/auth`: Multi-mode authentication management.
- `/api/admin`: Moderation, banning, and role management.

### Anonymous Contribution Flow
1. User lands on site (Anonymous session created).
2. User submits an entity (e.g., Organization).
3. `authMiddleware` identifies them by `sessionId`.
4. Controller saves `sessionId` in the database.
5. User can view/edit their own submissions within that session context.

---

## ⚙️ Background Processing

We use **BullMQ** (powered by Redis) for tasks that should not block the main request-response cycle:
- **AI Verification**: Triggering GPT-4 analysis of new reports.
- **Media Optimization**: Finalizing S3 uploads and generating thumbnails.
- **Trust Score Recalculation**: Daily background jobs to update user reputation.

---

## 🚀 Performance Optimizations

1. **Connection Pooling**: Managing database connections efficiently.
2. **Caching**: Redis caching for sessions, rate limits, and frequent graph queries.
3. **Optimistic Updates**: Backend designed to support fast client-side feedback.

---
*Back to [README](README.md)*
