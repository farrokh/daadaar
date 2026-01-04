# Security & Privacy Architecture

Security at Daadaar is multi-layered, designed to protect both the platform's integrity and the user's anonymity.

## 🛡️ Defensive Layers

### 1. Proof-of-Work (PoW)
To prevent automated abuse and "sybil attacks" without blocking VPN users via IP-based rate limiting, we implement a cryptographic challenge-response system.
- **Mechanism**: SHA-256 partial hash inversion.
- **Difficulty**: Dynamic based on activity (e.g., 5 leading zeros for reports, 2 for voting).
- **Validation**: The backend recomputes the hash using the provided solution and challenge nonce to ensure legitimacy.

### 2. Session-Based Rate Limiting
Limits are tied to session IDs (anonymous) or User IDs (registered), not IP addresses.
- **Storage**: Tracked in Redis with leaky bucket algorithms using atomic Lua scripts for race-condition-free increments.
- **Benefit**: Supports users behind shared VPN IPs while effectively curbing individual abuse.
- **Key Prefixes**: All rate limit keys use the `ratelimit:` prefix (e.g., `ratelimit:user:123:reports`, `ratelimit:session:abc123:votes`).
- **TTL Management**: Keys automatically expire based on the rate limit window (e.g., 1 hour for report submissions).

#### Redis Dependency & Fallback Behavior

**Runtime Requirement**: Redis is a **required runtime dependency** for production deployments. The system expects Redis to be available for proper rate limiting enforcement.

**Configuration**:
- **Environment Variable**: `REDIS_URL` (required in production)
  - Format: `redis://[username:password@]host:port[/database]` or `rediss://` for TLS
  - Example: `redis://localhost:6379` or `rediss://user:pass@redis.example.com:6380/0`
- **Connection**: Uses `ioredis` client with automatic reconnection enabled
- **Health Check**: Available via `checkRedisConnection()` function (returns connection status and latency)
- **Fail-Closed Mode**: `RATE_LIMITER_FAIL_CLOSED` (optional, default: `false`)
  - When `true`, denies requests when Redis is unavailable (fail-closed)
  - When `false`, uses in-memory fallback rate limiter (fail-open with fallback)

**Fallback Behavior** (Redis Unavailable):
When Redis is unavailable or not configured, the system implements a **multi-tier fallback strategy**:

1. **Development Mode** (`REDIS_URL` not set):
   - Uses **in-memory rate limiter** (same algorithm as Redis, per-instance)
   - Rate limiting continues to function locally
   - Warning logged: `"Redis not available, using in-memory fallback"`
   - Intended for local development only

2. **Production Mode - Fail-Open (Default)**:
   - Uses **in-memory rate limiter** as fallback (same fixed-window algorithm)
   - Rate limiting continues to function across all endpoints except critical ones
   - **Prominent alert** logged every minute: `"[RATE_LIMITER_ALERT] Redis unavailable - Using in-memory fallback"`
   - Metrics tracked: `redisUnavailableCount` exposed in `/api/health` endpoint
   - Automatic cleanup of expired entries every 5 minutes
   - **Note**: In-memory limits are per-instance (not shared across multiple backend instances)

3. **Production Mode - Fail-Closed (Critical Endpoints)**:
   - **Report submission** (`checkReportSubmissionLimit`) uses **fail-closed by default**
   - When Redis is unavailable, report submissions are **denied** with error: `"Rate limiting service unavailable. Please try again later."`
   - This ensures critical abuse prevention even during Redis outages
   - Other endpoints (voting, challenge generation) use fail-open with in-memory fallback

4. **Global Fail-Closed Mode** (`RATE_LIMITER_FAIL_CLOSED=true`):
   - All rate-limited endpoints deny requests when Redis is unavailable
   - Use only if rate limiting is absolutely critical for your deployment
   - **Warning**: This can cause service disruption during Redis outages

**Why In-Memory Fallback?**
- Continues rate limiting protection even when Redis is down
- Uses the same fixed-window algorithm for consistency
- Prevents service disruption while maintaining abuse protection
- Per-instance limits are acceptable for most use cases (PoW provides additional protection)

**Operational Notes**:
- Monitor Redis connection health via `/api/health` endpoint (includes `rateLimiter.redisUnavailableCount`)
- Set up alerts for Redis connection failures (CloudWatch, Sentry, etc.)
- Monitor `rateLimiter.usingInMemoryFallback` flag in health checks
- In high-availability deployments, use Redis Sentinel or Cluster mode (see Infrastructure docs)
- Rate limit state is ephemeral; Redis restarts clear all rate limit counters (acceptable trade-off)
- In-memory fallback limits are per-instance (not shared in multi-instance deployments)

### 3. CSRF Protection
Custom implementation (`lib/csrf-protection.ts`) using 32-byte tokens with 24-hour expiration.
- **Middleware**: Validates state-changing operations (POST, PUT, DELETE, PATCH). GET/HEAD/OPTIONS requests are automatically skipped.
- **Token Endpoint**: `GET /api/csrf-token` - Requires authentication (anonymous or registered) to generate token for the session.
- **Token Header**: Frontend must include CSRF token in `X-CSRF-Token` header for all state-changing requests.
- **Session-Based**: Tokens are tied to session IDs (anonymous) or user IDs (registered).
- **Automation**: Automatic cleanup of expired tokens via background process (every hour).
- **Integration Status**: ✅ Fully integrated into all state-changing routes (reports, media, organizations, individuals, roles, auth, pow).

---

## 👤 Privacy & Anonymity

- **Zero IP Logging**: We explicitly do not log or store user IP addresses. Cloudflare logs are anonymized at the edge.
- **Anonymous Sessions**: Users can fully participate without ever providing an email or name.
- **Session Migration**: Secure one-time migration allows anonymous users to move their identity between devices without registration.

---

## ⚖️ Moderation & Banning System

We maintain platform quality through a tiered moderation system.

### Content Reporting
A universal "Report" button allows the community to flag:
- Incorrect information
- Harassment or spam
- Duplicate entities

### Admin Roles
1. **User**: Standard permissions.
2. **Moderator**: Can review content reports and issue temporary bans.
3. **Admin**: Full system management and permanent banning capabilities.

### Banning Mechanism
- **Registered Users**: ID-based persistent ban.
- **Anonymous Users**: Session ID invalidation. Banned sessions cannot submit reports or vote but can still browse public content.
- **Ban History**: All actions are logged for accountability in the `ban_history` table.

---

## 🔒 API & Infrastructure Security

- **HTTPS/TLS**: Encrypted transit for all data.
- **S3 Server-Side Encryption**: Assets encrypted at rest.
- **Parameterized Queries**: Drizzle ORM prevents SQL injection.
- **Sanitization**: All user-generated content (e.g., Markdown) is sanitized via XSS filters before rendering.

---
*Back to [README](README.md)*
