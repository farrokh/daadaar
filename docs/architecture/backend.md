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
- `/api/admin/*`: Comprehensive admin panel for platform management (see Admin Panel section below).

### Admin Panel API

The admin panel provides comprehensive management capabilities for platform administrators. All admin endpoints require authentication and admin role verification via middleware.

#### User Management (`/api/admin/users`)
Manage platform users with role assignment, ban/unban, and verification controls.

**Endpoints:**
- `GET /api/admin/users` - List all users with pagination and filtering
  - Query params: `page`, `limit`, `q` (search), `role`, `isBanned`
  - Returns: Paginated list of users with full details
- `PATCH /api/admin/users/:id` - Update user role, ban status, or verification
  - Body: `{ role?, isBanned?, isVerified?, banReason?, bannedUntil?, displayName? }`
  - Protected: CSRF token required
- `DELETE /api/admin/users/:id` - Delete a user account
  - Protected: CSRF token required

**Features:**
- Search by username, email, or display name
- Filter by role (user, moderator, admin)
- Filter by ban status (active, banned)
- Bulk operations support via pagination

#### Individual Management (`/api/admin/individuals`)
Manage individuals (people) in the knowledge graph with role assignments.

**Endpoints:**
- `GET /api/admin/individuals` - List all individuals with pagination
  - Query params: `page`, `limit`, `q` (search)
  - Returns: Individuals with current organization and role info
- `PATCH /api/admin/individuals/:id` - Update individual details
  - Body: `{ fullName?, biography?, organizationId?, roleId?, startDate? }`
  - Protected: CSRF token required
  - Auto-creates default "Member" role if organization provided without role
- `DELETE /api/admin/individuals/:id` - Delete an individual
  - Protected: CSRF token required
  - Cascade deletes role occupancies

**Features:**
- Full-text search on names
- Displays current organization and role
- Automatic role assignment when adding to organization
- Biography and profile management

#### Organization Management (`/api/admin/organizations`)
Manage organizations with hierarchy support.

**Endpoints:**
- `GET /api/admin/organizations` - List all organizations with pagination
  - Query params: `page`, `limit`, `q` (search)
  - Returns: Organizations with parent/child relationships
- `PATCH /api/admin/organizations/:id` - Update organization details
  - Body: `{ name?, description?, logoUrl?, parentId? }`
  - Protected: CSRF token required
- `DELETE /api/admin/organizations/:id` - Delete an organization
  - Protected: CSRF token required
  - Cascade deletes roles and hierarchy relationships

**Features:**
- Hierarchical organization support (parent-child relationships)
- Full-text search on organization names
- Logo URL management
- Bilingual support (name/nameEn, description/descriptionEn)

#### Role Management (`/api/admin/roles`)
Manage roles within organizations.

**Endpoints:**
- `GET /api/admin/roles` - List all roles with filtering
  - Query params: `page`, `limit`, `q` (search), `organizationId`
  - Returns: Roles with organization context
- `PATCH /api/admin/roles/:id` - Update role details
  - Body: `{ title?, description?, titleEn?, descriptionEn? }`
  - Protected: CSRF token required
- `DELETE /api/admin/roles/:id` - Delete a role
  - Protected: CSRF token required
  - Cascade deletes role occupancies

**Features:**
- Filter by organization
- Full-text search on role titles
- Bilingual support
- Organization-scoped role management

#### Content Report Moderation (`/api/admin/content-reports`)
Moderate user-submitted content reports for abuse, spam, and policy violations.

**Endpoints:**
- `GET /api/admin/content-reports` - List all content reports
  - Query params: `page`, `limit`, `status`, `contentType`, `reason`
  - Returns: Reports with reporter/reviewer details and content metadata
- `GET /api/admin/content-reports/:id` - Get detailed report view
  - Returns: Full report with all relationships
- `PATCH /api/admin/content-reports/:id/status` - Update report status
  - Body: `{ status, adminNotes? }`
  - Status values: `pending`, `reviewing`, `resolved`, `dismissed`
  - Protected: CSRF token required
  - Auto-sets reviewer and timestamp
- `GET /api/admin/content-reports/stats` - Get moderation statistics
  - Returns: Counts by status and content type

**Features:**
- Filter by status (pending, reviewing, resolved, dismissed)
- Filter by content type (report, organization, individual, user, media)
- Filter by reason (spam, misinformation, harassment, inappropriate, duplicate, other)
- Displays content details inline (organization names, user info, etc.)
- Admin notes for internal tracking
- Automatic reviewer assignment and timestamps

#### Incident Report Management (`/api/admin/reports`)
Manage the actual incident reports, including AI verification status and manual triggers.

**Endpoints:**
- `GET /api/admin/reports` - List all incident reports with AI verification status
- `POST /api/admin/reports/:id/verify` - Manually trigger AI verification for a report

### Anonymous Contribution Flow
1. User lands on site (Anonymous session created).
2. User submits an entity (e.g., Organization).
3. `authMiddleware` identifies them by `sessionId`.
4. Controller saves `sessionId` in the database.
5. User can view/edit their own submissions within that session context.

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
 - **Health Check**:
   - `GET /api/health/notifications/slack` (Lambda dry-run, no message sent)
   - Returns `200` when the Lambda invocation permission is valid.
 
 ### 3. AI Verification Service
 We use **Perplexity AI (Sonar model)** for automated report analysis.
 - **Utility**: `backend/src/services/grok-service.ts`
 - **Functionality**: Performs fact-checking and consistency analysis.
 - **Integration**: Triggered via BullMQ in the background.

 ## ⚙️ Background Processing

We use **BullMQ** (powered by Redis) for tasks that should not block the main request-response cycle:
- **AI Verification**: Triggering Perplexity analysis of new reports.
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

### S3 Access & Credentials
- **Production**: Use the App Runner instance role for S3 access. Do not set `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` in production; static keys override role credentials.
- **Local dev**: Static keys are optional and can be set in `backend/.env` when testing S3 locally.
- **Bucket policy**: The media bucket explicitly allows the App Runner instance role to `List/Get/Put/Delete` objects.

### Environment Loading
- **Production**: The container does not load `dotenv` and the image excludes `.env` files via `.dockerignore`.
- **Development**: `dotenv` is loaded locally for convenience.

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
- `AI_VERIFICATION_ENABLED` - Enable automatic AI verification on submission (`true`/`false`)
- `PERPLEXITY_API_KEY` - API key for Perplexity AI service

**AWS:**
- `AWS_REGION` - AWS region (us-east-1)
- `AWS_S3_BUCKET` - S3 bucket for media storage
  - **Note**: App Runner instance role provides S3 access in production.

**URLs:**
- `FRONTEND_URL` - Frontend URL (https://www.daadaar.com)
- `API_URL` - Backend API URL (https://api.daadaar.com)
- **CDN**: Media is fronted by Cloudflare (proxy/DNS). The backend issues signed S3 URLs for read/write.

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
