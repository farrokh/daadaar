# Infrastructure & Deployment

Our infrastructure is designed for high availability, security, and global delivery, leveraging AWS and Cloudflare.

## ☁️ Cloud Infrastructure (AWS)

### Compute
- **Backend**: AWS App Runner for containerized API deployment. Scaling is managed by App Runner autoscaling policies.
- **Frontend**: Vercel (Next.js) with global edge CDN.

### Persistence
- **Database**: AWS RDS (PostgreSQL) in private subnets (not publicly accessible). Backup retention is currently 0 days (no automated backups).
- **Caching**: AWS ElastiCache Serverless Redis for caching, sessions, and rate limiting (TLS `rediss://`).
- **Object Storage**: AWS S3 for media assets (`daadaar-media-v1-317430950654`).

### Current Deployment (New Account)
- **Backend Service**: `daadaar-backend` (AWS App Runner)
- **Backend URL**: https://bxg6ycd8ym.us-east-1.awsapprunner.com
- **Custom Domain**: https://api.daadaar.com (active)
- **Health Check**: https://api.daadaar.com/health
- **RDS Endpoint**: daadaar-prod.cq5go4qemamj.us-east-1.rds.amazonaws.com:5432
- **Redis Endpoint**: daadaar-redis-rrp0fe.serverless.use1.cache.amazonaws.com:6379 (TLS via `rediss://`)
- **S3 Bucket**: daadaar-media-v1-317430950654
- **SMTP**: Amazon SES SMTP (`email-smtp.us-east-1.amazonaws.com:587`)
- **Slack Notifications**: Lambda `daadaar-slack-notifier` (invoked by App Runner)
- **Frontend**: https://www.daadaar.com (Vercel)

---

### Database Operations (CodeBuild)

For database operations that require direct access to RDS (which is not publicly accessible), we use **AWS CodeBuild** running inside the VPC.

#### Project Configuration
- **Project Name**: `daadaar-migrations`
- **Type**: CodeBuild (VPC-enabled)
- **Buildspec**: `infrastructure/aws/codebuild-migrations.buildspec.yml`
- **Compute**: `BUILD_GENERAL1_SMALL` (3 GB memory, 2 vCPUs)
- **Service Role**: `daadaar-codebuild-migrations-role`

#### Secrets Management
All sensitive credentials stored in AWS Secrets Manager:
- `daadaar/prod/database-url` - Full PostgreSQL connection string
- `daadaar/prod/db-password` - Database password only

#### VPC Configuration
- **VPC**: vpc-0e9cd2c204069ca54
- **Subnets**: Private subnets across us-east-1a, us-east-1c, and us-east-1d.
- **Security Group**: sg-0b55ecfafd3522b27

**Required VPC Endpoints** (enabling private access to AWS services):
- `com.amazonaws.us-east-1.secretsmanager` - Retrieve DB credentials (and SMTP if stored here).
- `com.amazonaws.us-east-1.ecr.api` / `dkr` - Pull Docker images.
- `com.amazonaws.us-east-1.logs` - CloudWatch logs egress.
- `com.amazonaws.us-east-1.s3` - Gateway for media and ECR layers.
- `com.amazonaws.us-east-1.email-smtp` - **Private SMTP egress to Amazon SES**.
- `com.amazonaws.us-east-1.lambda` - Invoke Slack notifier Lambda from App Runner without NAT.

#### Use Cases
1. **Database Migrations / Cleanup**:
   - Running scripts via CodeBuild in the VPC.
2. **Transactional Emails**:
   - App Runner → VPC Endpoint → SES (private path).

---

## 🔴 Redis Configuration & Operations

Redis is a **required runtime dependency** for production deployments, used for session-based rate limiting and distributed state management.

### Environment Variables

**Required**:
- `REDIS_URL` - Connection string for Redis instance
  - Format: `redis://[username:password@]host:port[/database]` or `rediss://` for TLS
  - Examples:
    - Local: `redis://localhost:6379`
    - AWS ElastiCache Serverless (current): `rediss://daadaar-redis-rrp0fe.serverless.use1.cache.amazonaws.com:6379`
    - TLS-enabled Redis: `rediss://user:pass@host.cache.amazonaws.com:6380/0`

**Optional** (for advanced configurations):
- `REDIS_PASSWORD` - Separate password (if not in URL)
- `REDIS_TLS` - Enable TLS (`true`/`false`, defaults based on URL scheme)
- `REDIS_DB` - Database number (0-15, defaults to 0)
- `RATE_LIMITER_FAIL_CLOSED` - Fail-closed mode for rate limiting (`true`/`false`, default: `false`)
  - When `true`: Denies all requests when Redis is unavailable
  - When `false`: Uses in-memory fallback rate limiter (default)

### Configuration Parameters

**Connection Settings**:
- **Host**: Specified in `REDIS_URL` (e.g., `localhost`, `redis.example.com`)
- **Port**: Default `6379` (standard Redis), `6380` (TLS), or as specified in URL
- **Authentication**: Username/password via URL (`redis://user:pass@host:port`) or `REDIS_PASSWORD`
- **TLS/SSL**: Use `rediss://` scheme or set `REDIS_TLS=true` for encrypted connections
- **Database**: Default `0`, can be specified in URL path (`/database`) or `REDIS_DB`

**Key Prefixes**:
- Rate limiting: `ratelimit:{key}` (e.g., `ratelimit:user:123:reports`)
- CSRF tokens: `csrf:{sessionId}` (if migrated to Redis)
- Session data: `session:{sessionId}` (if implemented)

**TTL (Time-To-Live)**:
- Rate limit keys: Auto-expire based on window (e.g., 3600s for 1-hour windows)
- CSRF tokens: 24 hours (86400s)
- Keys are automatically cleaned up by Redis expiration

**Connection Pooling**:
- `ioredis` client handles connection pooling automatically
- Default: Up to 10 connections per instance
- Configure via `maxRetriesPerRequest` and `lazyConnect` options if needed

### Health Checks & Monitoring

**Health Check Endpoint**:
- Endpoint: `GET /health` (App Runner liveness)
- Endpoint: `GET /api/health` (detailed DB/Redis checks)
- Returns comprehensive health status including:
  - `redis.connected` - Redis connection status
  - `redis.latencyMs` - Redis ping latency
  - `rateLimiter.redisUnavailableCount` - Counter of Redis unavailability events
  - `rateLimiter.usingInMemoryFallback` - Boolean indicating fallback mode
- Function: `checkRedisConnection()` in `backend/src/lib/redis.ts`
- Function: `getRedisUnavailableCount()` in `backend/src/lib/rate-limiter.ts`

**Monitoring Metrics**:
- Connection status (connected/disconnected)
- Latency (ping response time)
- Error rates (connection failures, timeouts)
- Key count (rate limit keys in use)
- Memory usage (if monitoring Redis directly)

**Alerting**:
- **Critical**: Redis connection failures (in-memory fallback enables service to continue)
- **Warning**: High latency (>100ms ping response)
- **Warning**: `rateLimiter.redisUnavailableCount` increasing (indicates Redis issues)
- **Info**: Connection recovery after failure
- **Info**: In-memory fallback activation (check `rateLimiter.usingInMemoryFallback`)

**Recommended Monitoring**:
- CloudWatch alarms for Redis connection failures
- Sentry error tracking for Redis exceptions
- Application-level health check endpoint polling (every 30s)
- Redis server metrics (if self-hosted): memory, connections, commands/sec

### Persistence & Backup

**Data Persistence**:
- Rate limit counters are **ephemeral** (acceptable to lose on restart)
- No critical data stored in Redis (all persistent data in PostgreSQL)
- Redis restarts clear rate limit state (users can retry after restart)

**Backup Strategy**:
- **Managed Redis (AWS ElastiCache)**: Automatic backups included
- **Self-hosted**: Configure RDB snapshots or AOF persistence if needed
- **Note**: Rate limit state loss is acceptable; no backup required for this use case

**Disaster Recovery**:
- Redis failure triggers in-memory fallback (rate limiting continues per-instance)
- Report submission endpoint uses fail-closed mode (denies requests if Redis unavailable)
- No data recovery needed (rate limits reset automatically)
- Restore Redis connectivity to resume distributed rate limiting
- In-memory fallback provides per-instance protection during outages

### High Availability Options

**1. AWS ElastiCache** (Recommended for production):
- Serverless or Multi-AZ deployments with automatic backups
- VPC isolation and security group control

**2. Redis Sentinel** (Recommended for self-hosted):
- Automatic failover to replica if master fails
- Multiple sentinel instances for quorum
- Connection string format: `redis-sentinel://sentinel1:26379,sentinel2:26379/mymaster`
- Configure in `REDIS_URL` with sentinel endpoints

**3. Redis Cluster** (For horizontal scaling):
- Sharded data across multiple nodes
- Automatic failover and replication
- Connection string: `redis://node1:6379,node2:6379,node3:6379`
- `ioredis` supports cluster mode natively

**4. Redis Cloud**: Enterprise features, high availability, monitoring

**Connection Pooling**:
- `ioredis` manages connection pools automatically
- For high-traffic deployments, monitor connection count
- Adjust `maxRetriesPerRequest` if experiencing connection exhaustion

### Deployment Considerations

**Local Development**:
- Docker Compose includes Redis service (see `docker-compose.yml`)
- Default: `redis://localhost:6379` (no auth)
- Health check: `redis-cli ping` every 10s

**Production Deployment**:
1. **Provision Redis**: Set up managed Redis (AWS ElastiCache) or self-hosted cluster
2. **Configure Connection**: Set `REDIS_URL` (TLS `rediss://`) in App Runner service config
3. **Security**: Use TLS (`rediss://`) and authentication (password in URL) when enabled
4. **Network**: Ensure App Runner can reach Redis via the VPC connector and security groups
5. **Health Checks**: Configure application health endpoint to monitor Redis
6. **Alerts**: Set up CloudWatch/Sentry alerts for connection failures

**Upgrade/Migration Steps**:

**Migrating Redis Instances**:
1. Provision new Redis instance
2. Update `REDIS_URL` in environment variables
3. Deploy new version (old connections will fail gracefully)
4. Monitor for connection errors during transition
5. Old instance can be decommissioned (no data migration needed)

**Upgrading Redis Version**:
1. Check compatibility with `ioredis` client version
2. Test connection with new Redis version in staging
3. Zero-downtime: Update connection string during deployment
4. Monitor for any protocol incompatibilities

**Adding High Availability**:
1. Set up Redis Sentinel or Cluster
2. Update `REDIS_URL` with sentinel/cluster endpoints
3. Test failover scenarios in staging
4. Deploy with new configuration
5. Monitor connection stability

**Scaling Considerations**:
- Rate limiting is lightweight (simple INCR operations)
- Single Redis instance handles thousands of requests/second
- For very high traffic, consider Redis Cluster for horizontal scaling
- Monitor Redis memory usage (rate limit keys are small, ~100 bytes each)

### Operational Runbook

**Redis Connection Failure**:
1. Check Redis service status (managed service dashboard or `redis-cli ping`)
2. Verify network connectivity (security groups, VPC routes)
3. Check application logs for specific error messages
4. Verify `REDIS_URL` environment variable is correct
5. System continues operating (fail-open), but rate limiting is disabled
6. Restore Redis connectivity to resume rate limiting

**High Latency Issues**:
1. Check Redis server resources (CPU, memory, network)
2. Review connection pool usage
3. Consider Redis Cluster for geographic distribution
4. Monitor for key expiration bottlenecks

**Memory Issues**:
1. Rate limit keys auto-expire (no manual cleanup needed)
2. If memory grows, check for keys not expiring properly
3. Review TTL settings in rate limiter code
4. Consider increasing Redis memory limit or using eviction policies

---

## 🌐 Global Delivery & Security (Cloudflare)

Cloudflare acts as the first line of defense and performance optimization.

### 1. CDN & Caching
- **Media Delivery**: `media.daadaar.com` routes through Cloudflare to cache AVIF assets at the edge.
- **Cache Strategy**: 1-month edge cache, 1-week browser cache.
- **Cost Reduction**: Reduces S3 egress costs by ~78%.

### 2. DDoS & WAF
- **DDoS Mitigation**: Automated layer 3/4 protection.
- **Web Application Firewall (WAF)**: Rules to block common exploits (OWASP Top 10) and bot traffic.

---

## 📊 Monitoring & Observability

- **Sentry**: Real-time error tracking and performance profiling across frontend and backend.
- **PostHog**: Privacy-first product analytics (autocapture events, session recordings).
- **Amazon CloudWatch**: Infrastructure-level logging and alerting.
- **Cloudflare Analytics**: Traffic patterns, security events, and cache hit ratios.

---

## 🏗️ CI/CD Pipeline

1. **Lint & Test**: GitHub Actions runs ESLint, Prettier, and Vitest/Jest suites on every PR.
2. **Build**: Docker images are built and pushed to Amazon ECR.
3. **Deploy**: App Runner rolling deployments ensure zero-downtime updates.
4. **Database Migrations**: Run via the CodeBuild migration runner (`daadaar-migrations`) using the ECR image and Secrets Manager `DATABASE_URL`. **Note**: Per `.cursorrules` section 2, `drizzle-kit push` is forbidden in production; always use the generate + migrate workflow to ensure proper versioning and rollback capabilities.

---
*Back to [README](README.md)*
