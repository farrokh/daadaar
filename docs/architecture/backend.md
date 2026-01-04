# Backend Architecture & API Design

The Daadaar backend is a robust Node.js API designed for high-concurrency, secure data processing, and seamless integration with the frontend.

## Runtime & Framework
- **Runtime**: Node.js 24+ LTS
- **Language**: TypeScript
- **Framework**: Express.js
- **ORM**: Drizzle ORM

---

## 🔐 Unified Authentication System

Our authentication layer is uniquely designed to support both anonymous and registered users with a shared state.

### 1. Anonymous Sessions (Default)
- Generated on the first visit.
- Stored in Redis for high-performance access.
- Used for rate-limiting and preventing duplicate actions without requiring PII.

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
