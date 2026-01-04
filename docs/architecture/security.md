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

**Fallback Behavior** (Redis Unavailable):
When Redis is unavailable or not configured, the system implements a **fail-open policy** with reduced guarantees:

1. **Development Mode** (`REDIS_URL` not set):
   - Rate limiting is **disabled** (all requests allowed)
   - Warning logged: `"Redis not available, skipping rate limit check"`
   - Intended for local development only

2. **Production Mode** (Redis connection failure):
   - Rate limiting **temporarily disabled** (fail-open)
   - **Loud alert** logged: `"Rate limit check error: [error details]"`
   - Requests are allowed to prevent service disruption
   - **Critical**: Operators must monitor Redis health and restore connectivity immediately

**Why Fail-Open?**
- Prevents cascading failures if Redis is temporarily unavailable
- Ensures platform remains accessible during infrastructure issues
- Rate limiting is a protective layer, not a hard requirement for core functionality
- PoW protection still provides abuse prevention even without rate limiting

**Operational Notes**:
- Monitor Redis connection health via application logs and health check endpoints
- Set up alerts for Redis connection failures (CloudWatch, Sentry, etc.)
- In high-availability deployments, use Redis Sentinel or Cluster mode (see Infrastructure docs)
- Rate limit state is ephemeral; Redis restarts clear all rate limit counters (acceptable trade-off)

### 3. CSRF Protection
Custom implementation (`lib/csrf-protection.ts`) using 32-byte tokens with 24-hour expiration.
- **Middleware**: Validates state-changing operations (POST, PUT, DELETE).
- **Automation**: Automatic cleanup of expired tokens via background process.

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
