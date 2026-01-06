# Backend Architecture & API Design

The Daadaar backend is a robust Node.js API designed for high-concurrency, secure data processing, and seamless integration with the frontend.

## Runtime & Framework
- **Runtime**: Bun 1.x (Node.js-compatible runtime)
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
- **Verification**: Email verification flow required for account activation (configurable).
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

---
 
 ## 🔌 External Integrations
 
 ### 1. Email Service (Transactional Emails)
 We use **Amazon SES (Simple Email Service)** for sending transactional emails.
 - **Utility**: `backend/src/lib/email.ts`
 - **Provider**: Amazon SES (SMTP Interface)
 - **Email Types**:
   - Email Verification (signup)
   - Password Reset
   - Moderation Notifications
 - **Implementation**:
   - Uses Nodemailer with SMTP transport.
   - **Network**: App Runner egresses through VPC and reaches SES via the `email-smtp` VPC endpoint.
 - **Configuration**:
   ```bash
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=<SES_ACCESS_KEY_ID>
   SMTP_PASS=<SES_SMTP_PASSWORD>
   EMAIL_FROM="Daadaar Platform" <no-reply@daadaar.com>
   API_URL=https://api.daadaar.com
   ```
 
 ### 2. Slack Notifications
 We send Slack notifications via a dedicated Lambda function to avoid NAT costs while App Runner egresses through the VPC.
 - **Utility**: `backend/src/lib/slack.ts`
 - **Events Tracked**:
   - New User Registrations
   - New Incident Reports
   - New Individuals/Organizations added to the graph
   - Content Reports (Abuse/Moderation)
 - **Implementation**: Fire-and-forget async calls. App Runner invokes Lambda asynchronously; Lambda posts to Slack webhook.
 - **Configuration**:
   ```bash
   SLACK_LAMBDA_FUNCTION_NAME=daadaar-slack-notifier
   ```
   Lambda environment:
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```
   Local dev fallback:
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```
 
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
 
## 🧩 Deployment & Configuration

### Hosting
- **AWS App Runner** (containerized service)
- **Custom Domain**: https://api.daadaar.com

### CORS
The backend allows only the configured frontend origin:
- `FRONTEND_URL=https://www.daadaar.com`

### Required Environment Variables (Production)

**Core:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `SESSION_SECRET` - Session encryption secret
- `ENCRYPTION_KEY` - Data encryption key
- `EMAIL_VERIFICATION_ENABLED` - Enable email verification checks (`true`/`false`)

**AWS:**
- `AWS_REGION` - AWS region (us-east-1)
- `AWS_S3_BUCKET` - S3 bucket for media storage

**URLs:**
- `FRONTEND_URL` - Frontend URL (https://www.daadaar.com)
- `API_URL` - Backend API URL (https://api.daadaar.com)
- `CDN_URL` - CDN URL for media (https://media.daadaar.com)

**Email (SMTP):**
- `SMTP_HOST` - SMTP server (email-smtp.us-east-1.amazonaws.com)
- `SMTP_PORT` - SMTP port (587)
- `SMTP_USER` - SMTP username (SES SMTP user)
- `SMTP_PASS` - SMTP password
- `EMAIL_FROM` - Email from address (optional, defaults to SMTP_USER)

**Notifications (Optional):**
- `SLACK_LAMBDA_FUNCTION_NAME` - Lambda function name or ARN (production)
- `SLACK_WEBHOOK_URL` - Direct webhook (local dev fallback)

### Health Endpoints
- `GET /health` (App Runner liveness)
- `GET /api/health` (DB + Redis checks)

---
*Back to [README](README.md)*
