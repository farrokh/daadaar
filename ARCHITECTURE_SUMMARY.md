# Daadaar Platform - Comprehensive Architecture Report

## Executive Summary

Daadaar is a decentralized, anonymous platform designed to expose government injustices in Iran through community-driven reporting, graph-based visualization, and AI-powered verification. The platform prioritizes user privacy, supports VPN usage, and maintains transparency through open-source development.

## System Architecture Overview

### High-Level Architecture

The platform follows a **separated frontend-backend architecture** for optimal scalability and performance:

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare (DDoS Protection, CDN)        │
└───────────────────────┬───────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐            ┌─────────▼──────────┐
│  Frontend      │            │  Backend API       │
│  (Next.js 16)  │◄──────────►│  (Express.js)      │
│  AWS Amplify   │   REST     │  AWS ECS           │
└────────────────┘            └─────────┬──────────┘
                                        │
                        ┌───────────────┼───────────────┐
                        │               │               │
                ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼─────┐
                │ PostgreSQL   │ │ Redis       │ │ AWS S3    │
                │ (RDS/Neon)   │ │ (Upstash)   │ │ (Media)   │
                └──────────────┘ └─────────────┘ └───────────┘
```

### Core Design Principles

1. **Privacy-First**: Anonymous participation by default, optional registration
2. **VPN-Friendly**: Session-based rate limiting (not IP-based)
3. **Scalable**: Independent scaling of frontend and backend
4. **Secure**: Multi-layered security with proof-of-work and encryption
5. **Open Source**: Transparent, community-driven development

### Quick Reference: Task Organization

**All tasks are organized in the plan file** (`.cursor/plans/daadaar_platform_architecture_ad9960ea.plan.md`) with:
- Task IDs for easy reference
- Dependencies clearly defined
- Status tracking (pending/in_progress/completed)
- Phase alignment (Phase 1: MVP, Phase 2: Enhanced, Phase 3: Advanced)

**Key Task Categories**:
- **Foundation**: Project setup, i18n, database, infrastructure
- **Authentication**: Anonymous sessions, user registration, OAuth
- **Core Features**: Reports, voting, graph visualization, AI verification
- **Management**: Organizations, trust scores, content reporting
- **Admin**: Banning system, moderation dashboard, admin roles
- **Advanced**: Session transfer, analytics, mobile app

## Technology Stack

### Frontend Layer
- **Framework**: Next.js 16+ (App Router) with React 19+
- **Internationalization**: next-intl (App Router optimized, RTL support)
- **Graph Visualization**: React Flow or Cytoscape.js
- **UI Components**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **Deployment**: AWS Amplify/EC2 with Cloudflare CDN

### Backend Layer
- **Runtime**: Node.js 24+ LTS with TypeScript
- **Framework**: Express.js
- **Authentication**: Passport.js (OAuth) + Custom JWT (email/password)
- **Deployment**: AWS ECS (Fargate) with Application Load Balancer
- **Auto-scaling**: Based on CPU/memory metrics

### Data Layer
- **Primary Database**: PostgreSQL 15+ (RDS, Railway, or Neon)
- **ORM**: Drizzle ORM for type-safe queries
- **Graph Queries**: PostgreSQL recursive CTEs
- **Caching**: Redis (Upstash) for sessions and rate limiting
- **Full-text Search**: PostgreSQL tsvector/tsquery

### External Services
- **AI Verification**: OpenAI GPT-4 API
- **File Storage**: AWS S3 for media uploads
- **DDoS Protection**: Cloudflare (Pro/Business)
- **Monitoring**: Sentry (errors), PostHog (analytics), CloudWatch (infrastructure)

## Authentication & Authorization System

### Unified Authentication Architecture

The platform supports **three authentication methods** through a unified middleware:

1. **Anonymous Sessions** (Default)
   - Automatic session creation on first visit
   - No registration or personal information required
   - Session stored in Redis with 30-day expiration
   - Used for rate limiting and preventing duplicate votes

2. **Email/Password Authentication**
   - Custom implementation with bcrypt password hashing
   - JWT tokens for session management
   - Optional email verification (future)

3. **OAuth Authentication** (Passport.js)
   - Google, GitHub, Twitter/X support
   - Same JWT format as email/password
   - Automatic user creation/update on first login

### Authentication Flow

```typescript
// Unified middleware handles all three methods
const authMiddleware = async (req, res, next) => {
  // 1. Try JWT token (registered users - email/password or OAuth)
  const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];
  if (token) {
    const user = await validateJWT(token);
    if (user) {
      req.user = { type: 'registered', id: user.id, ...user };
      return next();
    }
  }
  
  // 2. Fall back to anonymous session
  const sessionId = req.cookies.sessionId;
  if (sessionId) {
    const session = await redis.get(`session:${sessionId}`);
    if (session) {
      req.user = { type: 'anonymous', sessionId };
      return next();
    }
  }
  
  // 3. Create new anonymous session if none exists
  const newSessionId = generateUUID();
  await redis.set(`session:${newSessionId}`, {...});
  req.user = { type: 'anonymous', sessionId: newSessionId };
  next();
};
```

### User Data Model

**Registered Users**:
- `id`, `email` (unique, private), `username` (unique, public)
- `display_name`, `profile_image_url` (public)
- `password_hash` (nullable - null for OAuth users)
- `oauth_provider`, `oauth_id` (for OAuth users)
- `role`: 'user' | 'admin' | 'moderator' (default: 'user')
- `is_banned`: boolean (default: false)
- `banned_at`: timestamp | null
- `banned_until`: timestamp | null (for temporary bans)

**Anonymous Sessions**:
- `sessionId` (UUID), `createdAt`, `lastActivity`, `expiresAt`
- `export_token` (nullable) - One-time export token (null after import)
- `exportedAt` (nullable) - Timestamp when session was exported (for migration tracking)
- `importedAt` (nullable) - Timestamp when session was imported to new device
- `is_migrated` (boolean) - True if session has been migrated (old session invalidated)
- `migrated_to_session_id` (nullable) - New session ID if this session was migrated
- `is_banned`: boolean (default: false)
- `banned_at`: timestamp | null
- `banned_until`: timestamp | null (for temporary bans)
- No personal information stored

**Session Export/Import** (Optional Feature):
- Allows anonymous users to migrate sessions between devices
- Secure implementation with multiple protection layers

## Rate Limiting Strategy

### Three-Tier Approach (VPN-Friendly)

**Primary: Session-Based Rate Limiting**
- All limits tied to session tokens (anonymous) or user IDs (registered)
- Redis-based tracking
- Limits:
  - Report submission: 5/hour per session/user
  - Voting: 100/hour per session/user
  - Graph queries: 200/minute per session/user
  - Search: 50/minute per session/user

**Secondary: Proof-of-Work Challenges**
- Required for report submission (all users)
- Required for voting (anonymous users only - registered users exempt)
- Client-side SHA-256 puzzle solving
  - Report submission: 4-6 leading zeros (1-5 seconds)
  - Anonymous voting: 2-3 leading zeros (0.5-2 seconds, lightweight)
- Prevents automated abuse without blocking VPN users
- Prevents session deletion attacks for anonymous voting

**Tertiary: Cloudflare IP-Based** (Coarse-grained)
- Only for extreme abuse (1000+ requests/minute per IP)
- Not used for normal rate limiting

**Why This Approach**:
- VPN users share IPs → IP-based limiting blocks legitimate users
- Session-based limiting works regardless of VPN usage
- Proof-of-work adds computational cost to prevent abuse
- Maintains anonymity while preventing abuse

## Database Schema

### Core Entities

**Organizations**: Government bodies/institutions (nodes in graph)
**Roles**: Positions within organizations (director, manager, etc.)
**Individuals**: People who hold roles (nodes in graph)
**Role Occupancy**: Timeline of individuals in roles (start_date, end_date)
**Reports**: User-submitted reports/claims
**Report Links**: Many-to-many relationship linking reports to individuals + roles + time periods
**Votes**: Community votes on reports (upvote/downvote)
**Users**: Registered users (optional - supports anonymous)
**Sessions**: Anonymous session management
**Media**: Attached media files for reports
**AI Verification**: AI confidence scores and analysis
**User Trust Scores**: Reputation tracking for organization creation permissions
**Organization Hierarchy**: Parent-child relationships between organizations
**Content Reports**: User-submitted reports about incorrect/inappropriate content (moderation)
**Ban History**: Audit log of all ban/unban actions for accountability

### Key Relationships

- Organization → has many → Roles
- Role → occupied by → Individuals (via role_occupancy)
- Individual → can have → multiple Role Occupancies over time
- Individual → can have → multiple Reports (via report_links)
- Report → links to → Individual + Role + Time Period (via report_links)
- Report → can link to → multiple Individuals (if multiple people involved)
- Report → belongs to → User (optional) OR Anonymous Session
- Report → has many → Votes
- Report → has one → AI Verification
- Any content → can have → multiple Content Reports (for moderation)
- Content Report → belongs to → User (optional) OR Anonymous Session

### Design Decisions

**Multiple Reports per Individual**: Fully supported
- Each report is independent with own content, media, votes, AI verification
- Reports can reference same individual in different roles/time periods
- Enables tracking multiple incidents/actions over time

**Report Links Table**: Many-to-many relationship
- Links reports to individuals + roles + time periods
- Single report can link to multiple individuals
- Single individual can have multiple reports

## Core Features Implementation

### 1. Graph Visualization

**Purpose**: Visualize relationships between organizations, roles, and individuals over time

**Frontend**:
- React Flow or Cytoscape.js for interactive rendering
- Timeline slider for date range filtering
- Node click handlers to show details and reports
- Client-side state management (Zustand)

**Backend**:
- Graph data endpoint with date range filtering
- PostgreSQL recursive CTEs for efficient graph queries
- Redis caching for frequently accessed data
- Returns optimized JSON structure (nodes + edges)

**Data Flow**:
1. Frontend requests graph data with date range
2. Backend queries PostgreSQL using Drizzle ORM
3. Backend transforms relational data to graph format
4. Frontend renders interactive visualization

### 2. Report Submission

**Purpose**: Allow users to submit detailed reports linking individuals to incidents

**Frontend**:
- Multi-step form with React Hook Form + Zod validation
- Rich text editor (Tiptap)
- Proof-of-work challenge solving (client-side)
- Media upload (direct to S3 via presigned URLs)
- Auto-save drafts to localStorage
- Author display (user name/image OR "Anonymous")

**Backend**:
- Proof-of-work challenge generation
- Report creation with PoW validation
- S3 presigned URL generation for media
- Database insertion via Drizzle ORM
- AI verification job queuing (background processing)

**Submission Flow**:
1. Frontend requests PoW challenge
2. Frontend solves cryptographic puzzle (1-5 seconds)
3. Frontend submits report with PoW solution
4. Backend validates PoW, checks rate limits
5. Backend stores report (with user_id OR session_id)
6. Backend queues AI verification job
7. Returns created report with ID

### 3. Voting System

**Purpose**: Community-driven credibility assessment

**Frontend**:
- Upvote/downvote buttons with optimistic UI
- Vote count display
- Disable if already voted (session/user-based check)
- Show voter display names (for registered users)
- For anonymous users: Request PoW challenge before voting
- Solve lightweight PoW challenge (2-3 leading zeros, ~0.5-2 seconds)

**Backend**:
- Vote endpoint with duplicate prevention
- Check by user_id (registered) OR session_id (anonymous)
- For anonymous users: Validate PoW solution before processing vote
- Registered users: No PoW required (account-based protection sufficient)
- Atomic vote count updates (database transactions)
- Return updated totals and voter list

**Voting Flow**:
1. User clicks vote button
2. If anonymous: Frontend requests PoW challenge, solves it (0.5-2s), submits vote + solution
3. If registered: Frontend submits vote directly (no PoW needed)
4. Backend validates PoW (if anonymous), checks for existing vote
5. Backend updates vote counts atomically
6. Returns updated totals

### 4. AI Verification

**Purpose**: Provide confidence scores for reports using AI analysis

**Backend**:
- Background job queue (BullMQ) processes new reports
- OpenAI GPT-4 API calls with structured prompts
- Analysis includes:
  - Fact-checking
  - Consistency with existing reports
  - Credibility assessment
- Stores confidence score (0-100) in database

**Frontend**:
- Display confidence badge on reports
- Filter by confidence threshold
- Show AI analysis summary (if available)

### 5. Search & Filtering

**Purpose**: Enable users to find relevant reports

**Frontend**:
- Search input with debouncing
- Filter UI (organization, role, individual, date range, AI confidence)
- URL state management for filters
- Individual profile pages showing all their reports

**Backend**:
- Full-text search using PostgreSQL tsvector/tsquery
- Multi-criteria filtering
- Pagination support
- Returns filtered and sorted results

### 6. Organization Management & Trust System

**Purpose**: Allow users to create and manage organizations with a trust-based permission system

**Trust-Based Permission Model**:

**Phase 1: Open Creation (Initial Launch)**
- All users (registered and anonymous) can create organizations
- All users can connect organizations in hierarchy (parent-child relationships)
- No restrictions during early growth phase

**Phase 2: Trust-Based Creation (As Platform Grows)**
- Only "trusted users" can create new organizations
- Trust is earned by contributing accurate individual data
- Trust score calculated based on:
  - Reports with high AI confidence scores (80+)
  - Reports with high community votes (net positive votes)
  - Accurate role occupancy data (verified by community)
  - Consistent contributions over time

**Trust Score Calculation**:

```typescript
// Trust score factors (weighted)
trustScore = (
  highConfidenceReports * 10 +      // Reports with AI confidence ≥80
  highlyVotedReports * 5 +          // Reports with net votes ≥10
  accurateRoleData * 3 +            // Role occupancy data verified
  consistentContributions * 2       // Active over multiple months
) / totalContributions

// Trust threshold for organization creation
TRUST_THRESHOLD = 50  // Configurable, increases as platform grows
```

**Database Schema Additions**:

```typescript
// Organizations table additions
organizations {
  id: number
  name: string
  description: string | null
  parent_id: number | null        // For hierarchy
  created_by_user_id: number | null  // Track creator
  created_at: timestamp
  updated_at: timestamp
}

// User trust scores table
user_trust_scores {
  user_id: number (unique)
  trust_score: number (0-100)
  high_confidence_reports: number
  highly_voted_reports: number
  accurate_role_data_count: number
  contribution_months: number
  last_updated: timestamp
}

// Organization hierarchy tracking
organization_hierarchy {
  parent_id: number
  child_id: number
  created_by_user_id: number | null
  created_at: timestamp
}
```

**Frontend**:
- Organization creation form (conditional based on trust/permissions)
- Hierarchy visualization (parent-child relationships)
- Trust score display for registered users
- Permission indicators (can/cannot create organizations)
- Organization search and filtering

**Backend**:
- `POST /api/organizations` - Create organization (requires trust if enabled)
- `GET /api/organizations` - List organizations with filters
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization (creator or trusted users)
- `POST /api/organizations/:id/hierarchy` - Connect to parent organization
- `GET /api/organizations/hierarchy` - Get full hierarchy tree
- `GET /api/users/me/trust-score` - Get current user's trust score
- Background job: Recalculate trust scores periodically (daily)

**Permission Check Logic**:

```typescript
const canCreateOrganization = async (userId: number) => {
  // Phase 1: Open creation (check feature flag)
  if (process.env.ORGANIZATION_CREATION_MODE === 'open') {
    return true;
  }
  
  // Phase 2: Trust-based (check trust score)
  const trustScore = await getUserTrustScore(userId);
  return trustScore >= TRUST_THRESHOLD;
};
```

**Trust Score Updates**:
- Calculated when user submits report with high AI confidence
- Updated when report receives significant votes
- Recalculated daily via background job
- Cached in Redis for performance

**Migration Strategy**:
- Feature flag: `ORGANIZATION_CREATION_MODE` ('open' | 'trusted')
- Gradual transition: Start open, monitor abuse, switch to trusted
- Existing organizations remain accessible
- Users who created organizations before switch retain creation rights (grandfathered)

### 7. Content Reporting & Moderation System

**Purpose**: Allow users to report incorrect, inappropriate, or problematic content throughout the application for administrative review

**Reportable Content Types**:
- **Reports** (user-submitted content) - False information, spam, harassment
- **Organizations** - Incorrect information, duplicate entries, wrong hierarchy
- **Individuals** - Incorrect personal information, duplicate entries
- **Roles** - Incorrect role definitions, wrong organization associations
- **Media** - Inappropriate images/videos, copyright violations
- **Users** (registered) - Harassment, spam accounts, abuse
- **Comments** (if added) - Spam, harassment, inappropriate content

**Database Schema**:

```typescript
// Content reports table
content_reports {
  id: number
  content_type: 'report' | 'organization' | 'individual' | 'role' | 'media' | 'user' | 'comment'
  content_id: number                    // ID of the reported content
  reporter_user_id: number | null       // Registered user who reported
  reporter_session_id: string | null    // Anonymous session who reported
  reason: string                         // Predefined reason category
  description: string | null            // Optional detailed explanation
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed' | 'escalated'
  admin_notes: string | null            // Admin internal notes
  resolved_by_user_id: number | null    // Admin who resolved
  resolved_at: timestamp | null
  created_at: timestamp
  updated_at: timestamp
}

// Report reasons (enum or separate table)
report_reasons {
  'incorrect_information'      // Factually incorrect
  'spam'                       // Spam or irrelevant content
  'harassment'                 // Harassment or abuse
  'duplicate'                  // Duplicate entry
  'inappropriate_content'      // Inappropriate material
  'copyright_violation'        // Copyright infringement
  'privacy_violation'         // Personal information exposure
  'other'                      // Other reason (requires description)
}
```

**Frontend**:
- "Report" button/icon on all reportable content
- Modal/form for submitting reports
- Reason selection dropdown
- Optional description text area
- Confirmation message after submission
- Report status indicator (if user has reported)
- Admin dashboard for reviewing reports

**Backend**:
- `POST /api/content-reports` - Submit content report
  - Requires session (anonymous or registered)
  - Validates content exists and is reportable
  - Prevents duplicate reports (same user/session + content)
  - Rate limiting: 10 reports/hour per session/user
- `GET /api/content-reports` - List reports (admin only)
  - Filter by status, content type, date range
  - Pagination support
- `GET /api/content-reports/:id` - Get report details (admin only)
- `PUT /api/content-reports/:id` - Update report status (admin only)
- `GET /api/content-reports/my-reports` - Get user's own reports
- Background job: Auto-escalate reports with multiple submissions

**Moderation Workflow**:

```
1. User submits report → Status: 'pending'
2. Admin reviews report → Status: 'reviewing'
3. Admin takes action:
   - Resolve (remove/edit content) → Status: 'resolved'
   - Dismiss (false report) → Status: 'dismissed'
   - Escalate (needs higher authority) → Status: 'escalated'
4. User notified of resolution (if registered)
```

**Admin Actions**:
- **Remove Content**: Delete or hide reported content
- **Edit Content**: Correct incorrect information
- **Warn User**: Send warning to content creator (if registered)
- **Suspend User**: Temporarily suspend user account
- **Ban User**: Permanently ban user account
- **Merge Duplicates**: Combine duplicate entries
- **Dismiss Report**: Mark as false/invalid report

**Auto-Moderation Features**:
- **Multiple Reports Threshold**: Auto-flag content with 5+ reports
- **Trust Score Consideration**: Reports from trusted users weighted higher
- **Pattern Detection**: Flag users who report frequently (potential abuse)
- **AI-Assisted Review**: Use AI to pre-categorize reports (future enhancement)

**Security Measures**:
- Rate limiting on report submissions
- Prevent self-reporting (users can't report their own content)
- Prevent duplicate reports (same user + content)
- Admin authentication required for moderation actions
- Audit logging of all moderation actions

**Integration Points**:
- Report button on report detail pages
- Report button on organization pages
- Report button on individual profile pages
- Report button on user profiles
- Report option in media viewer
- Context menu option throughout UI

### 8. Admin Roles & Banned User System

**Purpose**: Enable administrative control over the platform with user banning capabilities for both registered users and anonymous sessions

**Admin Roles**:

```typescript
// User roles
type UserRole = 'user' | 'admin' | 'moderator';

// Role permissions
- 'user': Standard user (default)
- 'moderator': Can review content reports, ban users (limited)
- 'admin': Full access (ban users, manage admins, system configuration)
```

**Database Schema**:

```typescript
// Users table additions
users {
  // ... existing fields
  role: 'user' | 'admin' | 'moderator' (default: 'user')
  is_banned: boolean (default: false)
  banned_at: timestamp | null
  banned_until: timestamp | null  // For temporary bans (null = permanent)
  ban_reason: string | null        // Reason for ban (visible to user)
}

// Anonymous sessions (Redis) additions
session: {
  // ... existing fields
  is_banned: boolean (default: false)
  banned_at: timestamp | null
  banned_until: timestamp | null  // For temporary bans
}

// Ban history table (audit log)
ban_history {
  id: number
  target_type: 'user' | 'session'
  target_user_id: number | null      // If banning registered user
  target_session_id: string | null   // If banning anonymous session
  action: 'ban' | 'unban'
  reason: string | null
  banned_until: timestamp | null     // For temporary bans
  banned_by_user_id: number           // Admin who performed action
  created_at: timestamp
}
```

**Ban Types**:

1. **Permanent Ban**: User/session banned indefinitely
   - `banned_until: null`
   - Requires manual unban by admin

2. **Temporary Ban**: User/session banned until specific date
   - `banned_until: <future timestamp>`
   - Automatically lifted when date passes

**Ban Enforcement**:

**Updated Auth Middleware**:

```typescript
const authMiddleware = async (req, res, next) => {
  // 1. Try JWT token (registered users)
  const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];
  if (token) {
    const user = await validateJWT(token);
    if (user) {
      // Check if user is banned
      if (user.is_banned) {
        const isTemporaryBan = user.banned_until && new Date(user.banned_until) > new Date();
        if (isTemporaryBan || !user.banned_until) {
          return res.status(403).json({ 
            error: 'Account banned',
            banned_until: user.banned_until || null,
            ban_reason: user.ban_reason || null
          });
        }
        // Temporary ban expired, auto-unban
        await unbanUser(user.id);
      }
      req.user = { type: 'registered', id: user.id, role: user.role, ...user };
      return next();
    }
  }
  
  // 2. Fall back to anonymous session
  const sessionId = req.cookies.sessionId;
  if (sessionId) {
    const session = await redis.get(`session:${sessionId}`);
    if (session) {
      // Check if session is banned
      if (session.is_banned) {
        const isTemporaryBan = session.banned_until && new Date(session.banned_until) > new Date();
        if (isTemporaryBan || !session.banned_until) {
          return res.status(403).json({ 
            error: 'Session banned',
            banned_until: session.banned_until || null
          });
        }
        // Temporary ban expired, auto-unban
        await unbanSession(sessionId);
      }
      req.user = { type: 'anonymous', sessionId };
      return next();
    }
  }
  
  // 3. Create new anonymous session if none exists
  const newSessionId = generateUUID();
  await redis.set(`session:${newSessionId}`, {
    createdAt: Date.now(),
    lastActivity: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    is_banned: false
  });
  req.user = { type: 'anonymous', sessionId: newSessionId };
  next();
};

// Admin middleware (requires admin role)
const adminMiddleware = async (req, res, next) => {
  if (!req.user || req.user.type !== 'registered' || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Moderator middleware (requires moderator or admin role)
const moderatorMiddleware = async (req, res, next) => {
  if (!req.user || req.user.type !== 'registered' || 
      (req.user.role !== 'admin' && req.user.role !== 'moderator')) {
    return res.status(403).json({ error: 'Moderator access required' });
  }
  next();
};
```

**What Banned Users Cannot Do**:

- Submit reports
- Vote on reports
- Create organizations
- Submit content reports
- Create accounts (if banned user tries to register)
- Access admin/moderation features

**What Banned Users Can Do**:

- Browse public content (read-only)
- View reports, organizations, individuals
- Search and filter content

**Frontend**:
- Ban status indicator (if user is banned)
- Clear error messages when banned users try to contribute
- Admin dashboard for user management
- Ban/unban interface with reason and duration selection
- Ban history view

**Backend**:
- `POST /api/admin/users/:userId/ban` - Ban registered user (admin only)
  - Request: `{ reason: string, banned_until: timestamp | null }`
  - Updates user record, creates ban history entry
- `POST /api/admin/sessions/:sessionId/ban` - Ban anonymous session (admin only)
  - Request: `{ reason: string, banned_until: timestamp | null }`
  - Updates Redis session, creates ban history entry
- `POST /api/admin/users/:userId/unban` - Unban registered user (admin only)
- `POST /api/admin/sessions/:sessionId/unban` - Unban anonymous session (admin only)
- `GET /api/admin/bans` - List all bans (admin only)
  - Filter by user/session, status, date range
  - Pagination support
- `GET /api/admin/bans/history` - Get ban history (admin only)
- `GET /api/users/me/ban-status` - Check if current user/session is banned
- Background job: Auto-unban expired temporary bans (runs hourly)

**Admin User Management**:
- `POST /api/admin/users/:userId/role` - Change user role (admin only)
  - Can promote to moderator/admin
  - Can demote admin (with safeguards)
- `GET /api/admin/users` - List all users (admin only)
  - Filter by role, ban status, date range
  - Search by username/email
  - Pagination support

**Security Measures**:
- Admin actions require authentication + admin role
- All ban actions logged in `ban_history` table
- Cannot ban other admins (safeguard)
- Cannot ban yourself
- Rate limiting on ban actions (prevent abuse)
- IP-based tracking for anonymous session bans (optional, for detection)

**Ban Identification**:

**For Registered Users**:
- Banned by user ID (persistent)
- Email/username cannot create new account (if email-based ban)
- OAuth accounts linked to same email also banned

**For Anonymous Sessions**:
- Banned by session ID
- If user creates account, ban can be transferred to account
- New sessions are not automatically banned (session-specific)

**Ban Transfer** (Anonymous → Registered):
- When anonymous user creates account, check if session was banned
- Optionally transfer ban to new account
- Or allow account creation but warn about previous ban

### 9. Session Transfer & Migration (Secure)

**Purpose**: Allow anonymous users to transfer their sessions (including trust scores) between devices/browsers securely

**Security Analysis**:

**Risks of Allowing Session Transfer**:
- ⚠️ **Session Sharing**: Multiple people could use the same session simultaneously
- ⚠️ **Rate Limit Bypass**: Sharing sessions could bypass rate limiting
- ⚠️ **Trust Score Abuse**: Duplicating trusted sessions could enable abuse
- ⚠️ **Session Hijacking**: Exported files could be intercepted/stolen

**Recommended Secure Approach: Session Migration (One-Time Transfer)**

Instead of allowing unlimited session sharing, implement **one-time migration** with **singular session guarantee**:

**Core Principle: Singular Sessions**
- Only one active session can exist at a time per user
- Old session is **immediately invalidated** when transferred
- Cannot use old session after migration
- Atomic operations prevent race conditions

**Implementation**:

```typescript
// Session export (current device)
POST /api/sessions/export
- Requires active session
- Checks if session already exported (prevents re-export)
- Generates one-time export token (stored in session)
- Marks session with `exportedAt` timestamp
- Returns encrypted session data (AES-256 with user password)
- Export token expires after 24 hours

// Session import (new device)
POST /api/sessions/import
- Requires PoW challenge (prevents automated abuse)
- Validates export token (one-time use, not expired)
- **ATOMIC OPERATION**:
  1. Verify old session exists and has export token
  2. Create new session with migrated data
  3. Mark old session as `is_migrated: true`
  4. Set `migrated_to_session_id` to new session ID
  5. Delete export token from old session
  6. Invalidate old session in Redis (set TTL to 0 or delete)
  7. Transfer trust score and contributions to new session
- Returns new session ID
- Old session becomes unusable immediately
```

**Singular Session Enforcement**:

```typescript
// Middleware check (on every request)
const checkSessionValidity = async (sessionId: string) => {
  const session = await redis.get(`session:${sessionId}`);
  
  // Check if session has been migrated
  if (session?.is_migrated) {
    throw new Error('Session has been migrated. Please use new session.');
  }
  
  // Check if session is banned
  if (session?.is_banned) {
    // ... ban check logic
  }
  
  return session;
};

// Auth middleware updated
const authMiddleware = async (req, res, next) => {
  const sessionId = req.cookies.sessionId;
  if (sessionId) {
    const session = await checkSessionValidity(sessionId);
    if (!session) {
      // Session invalid or migrated, create new one
      const newSessionId = generateUUID();
      await redis.set(`session:${newSessionId}`, {...});
      req.user = { type: 'anonymous', sessionId: newSessionId };
      return next();
    }
    req.user = { type: 'anonymous', sessionId };
    return next();
  }
  // ... rest of auth logic
};
```

**Security Measures**:

1. **One-Time Use Tokens & Singular Sessions**:
   - Export generates single-use token tied to old session
   - Token expires after 24 hours
   - **Old session invalidated immediately on import** (atomic operation)
   - Old session marked as `is_migrated: true` and `migrated_to_session_id` set
   - Old session deleted from Redis or set to expire immediately
   - Prevents session duplication and ensures singular sessions
   - Middleware checks `is_migrated` flag and rejects old sessions

2. **Password Encryption**:
   - User must provide password to encrypt export
   - Same password required to decrypt on import
   - Password never stored (only used for encryption key)
   - AES-256 encryption

3. **Proof-of-Work Challenge**:
   - Required for import (prevents automated abuse)
   - Lightweight difficulty (2-3 leading zeros, ~1-2 seconds)
   - Adds computational cost to prevent mass imports

4. **Rate Limiting**:
   - Max 1 export per session per 7 days
   - Max 1 import per IP per hour
   - Prevents abuse and session farming

5. **Device Fingerprinting** (Optional):
   - Track device characteristics (browser, OS, screen resolution)
   - Detect suspicious activity (same session on very different devices)
   - Alert but don't block (could be legitimate)

6. **Audit Logging**:
   - Log all export/import events
   - Track IP addresses (for security, not rate limiting)
   - Monitor for suspicious patterns
   - Log old session invalidation with new session ID

7. **Singular Session Guarantee**:
   - **Atomic Migration**: All steps happen in single transaction/operation
   - **Immediate Invalidation**: Old session unusable as soon as import succeeds
   - **Migration Tracking**: Old session stores `migrated_to_session_id` for audit trail
   - **Middleware Enforcement**: All requests check `is_migrated` flag and reject migrated sessions
   - **No Duplication**: Cannot have same session active on multiple devices simultaneously
   - **Error Handling**: If import fails, old session remains valid (rollback mechanism)
   - **Session State**: Old session marked `is_migrated: true` prevents any further use

**Alternative: Account Claiming (Recommended)**

**Better Approach**: Allow anonymous users to "claim" their session by creating an account:

```typescript
// Claim session as registered user
POST /api/auth/claim-session
- User creates account (email/password or OAuth)
- Links anonymous session to new account
- Migrates trust score and all contributions
- Session becomes registered user session
- More secure than export/import
```

**Benefits of Account Claiming**:
- ✅ More secure (standard authentication flow)
- ✅ No session file to lose/steal
- ✅ Works across all devices automatically
- ✅ Better user experience
- ✅ Standard industry practice

**Recommendation**:

**Option 1: Secure Session Migration** (if you must support anonymous transfer)
- Implement one-time migration with all security measures above
- Acceptable risk level with proper safeguards
- More complex to implement

**Option 2: Account Claiming** (Recommended)
- Simpler and more secure
- Better long-term solution
- Users can claim their session anytime
- No file transfer needed

**Hybrid Approach** (Best of Both):
- Offer both options
- Encourage account claiming (better UX)
- Provide migration as fallback for users who refuse to register
- Migration has stricter security (PoW, rate limits, one-time use)

## Security Architecture

### Multi-Layered Security Approach

**1. Input Validation**
- Frontend: Zod schema validation
- Backend: Express validator middleware
- All inputs sanitized before processing

**2. SQL Injection Prevention**
- Drizzle ORM uses parameterized queries
- No raw SQL with user input
- Type-safe query builder

**3. XSS Prevention**
- Sanitize user-generated content
- React's built-in escaping
- CSP headers
- Rich text editor output sanitization

**4. CSRF Protection**
- CSRF tokens for state-changing operations
- SameSite cookie attributes
- Origin header verification

**5. Rate Limiting** (See detailed section above)

**6. Encryption**
- Sensitive content encrypted at rest (AES-256)
- HTTPS/TLS for all communications
- S3 server-side encryption for media
- Encrypted session tokens

**7. Privacy**
- No IP address logging (Cloudflare anonymized logs)
- No personal data collection for anonymous users
- Anonymous sessions expire after 30 days
- PostHog privacy-first analytics (no PII)

**8. API Security**
- CORS configured for frontend domain only
- Request size limits
- Timeout configurations
- API key authentication for internal services (if needed)

## Infrastructure & Deployment

### AWS Infrastructure

**Frontend**:
- AWS Amplify or EC2/ECS with CloudFront
- Cloudflare CDN for static assets
- Cloudflare DDoS protection in front

**Backend**:
- AWS ECS (Fargate) or EC2 instances
- Application Load Balancer (ALB) for traffic distribution
- Auto-scaling based on CPU/memory metrics
- Cloudflare DDoS protection in front

**Database**:
- PostgreSQL on AWS RDS (or Railway/Neon)
- Automated backups enabled
- Read replicas for scaling (Phase 2+)

**Storage**:
- AWS S3 for media uploads
- S3 bucket policies for secure access
- CloudFront distribution for media CDN (optional)

**Caching**:
- Redis (Upstash) for sessions and rate limiting
- ElastiCache Redis for application caching (optional)

### DDoS Protection

**Cloudflare** (Primary Layer):
- DDoS mitigation automatically enabled
- WAF rules (configured later)
- Bot management (optional)
- Coarse-grained IP-based limiting (1000+ req/min) - extreme abuse only

**Application-Level**:
- Session-based rate limiting (primary method)
- Proof-of-work challenges

**AWS Shield**:
- Standard protection (included)
- Advanced protection (optional)

### Monitoring & Analytics

- **Sentry**: Error tracking (frontend + backend)
- **PostHog**: Product analytics and user behavior (privacy-first)
- **Cloudflare Analytics**: Traffic and security metrics
- **CloudWatch**: AWS resource monitoring

## API Design

### RESTful API Structure

All endpoints follow consistent patterns:
- Base URL: `https://api.daadaar.com`
- Authentication via cookies (httpOnly) or Authorization header
- Standardized response format (success/error)
- Pagination for list endpoints
- Filtering and sorting support

### Key Endpoint Categories

**Authentication**: Session management, registration, login, OAuth
**Reports**: CRUD operations, search, filtering
**Votes**: Create/update votes, get vote counts
**Graph**: Graph data retrieval with date filtering
**Media**: Presigned URL generation, metadata retrieval
**AI Verification**: Get verification results, trigger manual verification
**Users**: Profile management, public profiles
**Organizations**: CRUD operations, hierarchy management, creation permissions
**Content Reports**: Report incorrect/inappropriate content for moderation
**Moderation**: Admin tools for reviewing and handling content reports

## Data Flow Examples

### Report Submission Flow

```
User → Frontend Form → PoW Challenge Request → Backend
Backend → Generate Challenge → Frontend
Frontend → Solve PoW (1-5s) → Submit Report + PoW Solution → Backend
Backend → Validate PoW → Check Rate Limit → Store Report → Queue AI Job → Return Success
```

### Graph Visualization Flow

```
User → Frontend Graph Page → Request Graph Data (with date range) → Backend
Backend → Query PostgreSQL (recursive CTEs) → Transform to Graph Format → Cache in Redis → Return JSON
Frontend → Render Graph (React Flow/Cytoscape) → User Interaction → Fetch Details → Backend
```

### Voting Flow

**For Anonymous Users**:
```
User → Click Vote Button → Frontend → Request PoW Challenge → Backend
Backend → Generate Challenge (difficulty: 2-3 zeros) → Frontend
Frontend → Solve PoW (0.5-2s) → Submit Vote + PoW Solution → Backend
Backend → Validate PoW → Check Existing Vote (session_id) → Update Vote Counts (atomic) → Return Totals
Frontend → Update UI Optimistically → Display Updated Counts
```

**For Registered Users**:
```
User → Click Vote Button → Frontend → Check Local State → Send Vote Request → Backend
Backend → Check Existing Vote (user_id) → Update Vote Counts (atomic) → Return Totals
Frontend → Update UI Optimistically → Display Updated Counts
```

## Development Phases & Task Organization

### Phase 1: MVP (Minimum Viable Product)

**Foundation & Infrastructure**:
- [ ] Initialize monorepo (Next.js 16, Express, TypeScript, Tailwind CSS)
- [ ] Set up i18n with next-intl (Persian primary, RTL support)
- [ ] Configure PostgreSQL database with Drizzle ORM
- [ ] Set up Redis (Upstash) for sessions
- [ ] Configure Cloudflare for DDoS protection
- [ ] Set up AWS infrastructure (S3, ECS, RDS, ALB)

**Core Authentication**:
- [ ] Implement anonymous session system (Redis-based)
- [ ] Implement user registration/login (JWT, bcrypt)
- [ ] Implement OAuth providers (Passport.js: Google, GitHub)
- [ ] Unified authentication middleware

**Core Features**:
- [ ] Basic database schema (organizations, roles, individuals, reports, votes, media, sessions)
- [ ] Report submission form with PoW challenge
- [ ] Basic graph visualization (static, no timeline filtering)
- [ ] Simple voting system (with PoW for anonymous users)
- [ ] Report listing page
- [ ] Basic AI verification (simple prompt, background job)

**Deployment**:
- [ ] Deploy frontend to AWS Amplify/EC2
- [ ] Deploy backend to AWS ECS
- [ ] Configure monitoring (Sentry, PostHog, CloudWatch)

### Phase 2: Enhanced Features

**Enhanced Graph & Visualization**:
- [ ] Interactive graph with timeline filtering
- [ ] Node click handlers for details
- [ ] Graph caching optimization

**Advanced Features**:
- [ ] Advanced AI verification with detailed analysis
- [ ] Media upload and display (S3 presigned URLs)
- [ ] Full-text search and filtering
- [ ] Individual profile pages
- [ ] User dashboard (view own submissions)

**Organization Management**:
- [ ] Organization CRUD operations
- [ ] Organization hierarchy management
- [ ] Trust score calculation system
- [ ] Trust-based organization creation (Phase 1: open, Phase 2: trusted)

**Moderation & Admin**:
- [ ] Content reporting system (universal report button)
- [ ] Admin roles (user/moderator/admin)
- [ ] User banning system (registered + anonymous)
- [ ] Admin moderation dashboard
- [ ] Ban history tracking

**Session Management**:
- [ ] Secure session transfer/migration
- [ ] Account claiming feature
- [ ] Singular session enforcement

### Phase 3: Advanced Features

**Advanced Analytics**:
- [ ] Advanced graph analytics
- [ ] AI-powered relationship discovery
- [ ] Trust score analytics dashboard

**Extended Functionality**:
- [ ] Export functionality (reports, graph data)
- [ ] Third-party API
- [ ] Advanced search with AI assistance

**Mobile & Beyond**:
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Offline support

## Internationalization (i18n) Strategy

### Overview

The platform uses **next-intl** (v3+) for internationalization, optimized for Next.js 16+ App Router with React Server Components support. Persian (Farsi) is the primary language, with support for additional languages as secondary options.

### Technology Choice: next-intl

**Why next-intl?**
- ✅ Built specifically for Next.js App Router (not Pages Router)
- ✅ Full React Server Components (RSC) support
- ✅ Type-safe translations with TypeScript
- ✅ Built-in RTL (Right-to-Left) support for Persian
- ✅ Dynamic routing with locale prefixes (`/fa`, `/en`, etc.)
- ✅ Server-side and client-side rendering support
- ✅ Optimized bundle size (tree-shaking)
- ✅ Active development and modern API

### Language Configuration

**Primary Language**: Persian (Farsi) - `fa`
- Default locale for all routes
- RTL layout support
- Persian date/number formatting

**Secondary Languages** (to be added):
- English (`en`) - LTR
- Arabic (`ar`) - RTL (if needed)
- Other languages as needed

### Implementation Structure

**Frontend (Next.js)**:

```
frontend/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx      # Locale-aware layout with RTL support
│   │   ├── page.tsx        # Home page
│   │   ├── reports/
│   │   │   └── page.tsx    # Reports listing
│   │   └── ...
│   ├── layout.tsx          # Root layout (required for App Router)
│   └── page.tsx            # Root page (redirects to default locale)
├── i18n/                   # next-intl config (outside app/ directory)
│   ├── request.ts          # Server-side locale detection
│   └── routing.ts          # Locale routing configuration
└── messages/
    ├── fa.json             # Persian translations (primary)
    ├── en.json             # English translations
    └── ...
```

**Translation File Structure** (`messages/fa.json`):

```json
{
  "common": {
    "submit": "ارسال",
    "cancel": "لغو",
    "search": "جستجو",
    "loading": "در حال بارگذاری..."
  },
  "reports": {
    "title": "گزارش‌ها",
    "create": "ایجاد گزارش جدید",
    "anonymous": "ناشناس"
  },
  "voting": {
    "upvote": "موافق",
    "downvote": "مخالف",
    "votes": "رای"
  }
}
```

**Locale Routing**:
- Persian (default): `/` or `/fa/*`
- English: `/en/*`
- Locale detection: Browser language → Cookie → Default (Persian)

**RTL Support**:
- Automatic RTL layout for Persian/Arabic
- CSS direction: `dir="rtl"` for Persian pages
- Tailwind CSS RTL plugin for proper styling
- Mirroring UI components (navigation, buttons, etc.)

**Backend (Express.js)**:

- API responses include locale-aware content when needed
- Date/time formatting based on locale
- Error messages can be localized (optional)
- Database stores content in original language (Persian)
- Translation metadata stored separately if needed

### Translation Management

**Development Workflow**:
1. All UI strings extracted to translation files
2. Persian (`fa.json`) is the source of truth
3. English translations added incrementally
4. Type-safe translation keys with TypeScript
5. Missing translations fallback to Persian

**Translation Keys Pattern**:
```typescript
// Type-safe usage
import { useTranslations } from 'next-intl';

const t = useTranslations('reports');
t('title'); // "گزارش‌ها"
```

**Future Enhancements**:
- Integration with translation management platforms (Crowdin, Lokalise)
- Community contributions for translations
- AI-assisted translation for new languages
- Context-aware translations (formal/informal variants)

### SEO & URL Structure

**URL Strategy**:
- Persian (default): `daadaar.com/reports/123`
- English: `daadaar.com/en/reports/123`
- Language switcher in navigation
- `hreflang` tags for SEO

**Metadata**:
- Locale-specific meta tags
- Open Graph tags per language
- Structured data in appropriate language

### Performance Considerations

- Translation files loaded per locale (tree-shaking)
- Server-side locale detection (no client-side redirect)
- Cached translations in production
- Minimal bundle size impact

## Key Architectural Decisions

### Why Separated Frontend-Backend?
- **Scalability**: Independent scaling based on load
- **Performance**: Next.js optimized for rendering, backend for computation
- **Cost**: Better resource allocation
- **Flexibility**: Easier to modify one without affecting the other

### Why ECS/EC2 Over Lambda?
- **Background Jobs**: BullMQ requires persistent processes
- **Long-Running Tasks**: AI verification can exceed Lambda timeout
- **Persistent Connections**: Redis and database connections need to stay warm
- **Cost**: More cost-effective at steady traffic

### Why Session-Based Rate Limiting?
- **VPN Support**: Many users use VPNs, IP-based limiting blocks legitimate users
- **Privacy**: No IP tracking required
- **Fairness**: Each user gets same limits regardless of network

### Why Proof-of-Work?
- **Abuse Prevention**: Adds computational cost to automated attacks
- **VPN-Friendly**: Works regardless of IP address
- **User-Friendly**: Minimal delay (1-5 seconds) for legitimate users
- **Scalable**: Cost scales with abuse attempts

### Why Passport.js Over Clerk?
- **Anonymous Sessions**: Clerk doesn't support anonymous users
- **Control**: Full control over session management and rate limiting
- **Cost**: No per-user fees, more cost-effective at scale
- **Integration**: Seamless integration with existing anonymous session system
- **Simplicity**: Single unified auth system vs. dual systems

## Environment Configuration

### Frontend Environment Variables
- API URL, App URL
- PostHog analytics key
- Sentry DSN

### Backend Environment Variables
- Database connection string
- OpenAI API key
- AWS credentials (S3, ECS)
- Redis connection (Upstash)
- Cloudflare tokens
- JWT secrets
- OAuth provider credentials (Google, GitHub, etc.)
- Session secrets, encryption keys

### Production Security
- Environment variables in AWS Systems Manager Parameter Store
- Secrets in AWS Secrets Manager
- ECS task definitions reference secrets securely
- No secrets in code or environment files

## Task Management Reference

### Complete Task List (For Task Management Tools)

**All tasks are defined in**: `.cursor/plans/daadaar_platform_architecture_ad9960ea.plan.md`

**Task IDs for Reference**:
- `init-project` - Project initialization
- `setup-i18n` - Internationalization setup
- `setup-database` - Database setup
- `auth-system` - Authentication system
- `rate-limiting` - Rate limiting & PoW
- `report-submission` - Report submission feature
- `graph-visualization` - Graph visualization
- `voting-system` - Voting system
- `ai-verification` - AI verification
- `organization-management` - Organization management
- `trust-score-system` - Trust score system
- `content-reporting` - Content reporting
- `admin-ban-system` - Admin & ban system
- `admin-moderation-dashboard` - Admin dashboard
- `search-filtering` - Search & filtering
- `session-transfer` - Session transfer
- `security-setup` - Security configuration
- `aws-infrastructure` - AWS infrastructure
- `deployment` - Deployment

### Phase-Based Prioritization

**Phase 1 (MVP) - Critical Path**:
1. Foundation: `init-project` → `setup-i18n`, `setup-database`, `security-setup`
2. Authentication: `auth-system` → `rate-limiting`
3. Core Features: `report-submission` → `voting-system`, `ai-verification`
4. Infrastructure: `aws-infrastructure` → `deployment`

**Phase 2 (Enhanced) - After MVP**:
1. Organization & Trust: `organization-management` → `trust-score-system`
2. Moderation: `content-reporting` → `admin-ban-system` → `admin-moderation-dashboard`
3. Session Management: `session-transfer`
4. Enhanced Features: `search-filtering`, enhanced graph, advanced AI

**Phase 3 (Advanced) - Future**:
- Advanced analytics, mobile app, export functionality

### Key Features Summary

1. **Authentication**: Anonymous sessions + registered users + OAuth
2. **Rate Limiting**: Session-based + PoW challenges (VPN-friendly)
3. **Reports**: User-submitted reports with AI verification
4. **Voting**: Community voting with PoW for anonymous users
5. **Graph**: Interactive visualization of organizations/roles/individuals
6. **Organizations**: Trust-based creation system
7. **Content Reporting**: Universal reporting system
8. **Admin System**: Roles, banning, moderation dashboard
9. **i18n**: Persian primary, RTL support, multi-language
10. **Session Transfer**: Secure migration with singular session guarantee

## Conclusion

The Daadaar platform architecture is designed to be:
- **Privacy-preserving**: Anonymous by default, optional registration
- **VPN-friendly**: Session-based rate limiting supports users behind VPNs
- **Scalable**: Separated architecture allows independent scaling
- **Secure**: Multi-layered security with proof-of-work and encryption
- **Transparent**: Open-source, community-driven development

The unified authentication system seamlessly integrates anonymous sessions, email/password authentication, and OAuth providers through Passport.js, providing a flexible and cost-effective solution that maintains full control over user sessions and rate limiting.

**Architecture Documents**:
- **Main Architecture**: `ARCHITECTURE_SUMMARY.md` (this file)
- **Detailed Plan**: `.cursor/plans/daadaar_platform_architecture_ad9960ea.plan.md`
- **Task Management**: Use task IDs from plan file for tracking and prioritization

