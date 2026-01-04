# Infrastructure & Deployment

Our infrastructure is designed for high availability, security, and global delivery, leveraging AWS and Cloudflare.

## ☁️ Cloud Infrastructure (AWS)

### Compute
- **Backend**: AWS ECS (Fargate) for containerized API deployment. Scaling is managed via Application Load Balancer (ALB) based on CPU/Memory metrics.
- **Frontend**: AWS Amplify or EC2/ECS hosting the Next.js application.

### Persistence
- **Database**: AWS RDS (PostgreSQL) with automated daily backups and point-in-time recovery.
- **Caching**: Upstash Redis (managed) for globally distributed caching and rate limiting.
- **Object Storage**: AWS S3 for media assets (`daadaar-media-frkia`).

---

## 🔴 Redis Configuration & Operations

Redis is a **required runtime dependency** for production deployments, used for session-based rate limiting and distributed state management.

### Environment Variables

**Required**:
- `REDIS_URL` - Connection string for Redis instance
  - Format: `redis://[username:password@]host:port[/database]` or `rediss://` for TLS
  - Examples:
    - Local: `redis://localhost:6379`
    - Upstash: `rediss://default:password@host.upstash.io:6380`
    - AWS ElastiCache: `redis://user:pass@cluster.cache.amazonaws.com:6379/0`

**Optional** (for advanced configurations):
- `REDIS_PASSWORD` - Separate password (if not in URL)
- `REDIS_TLS` - Enable TLS (`true`/`false`, defaults based on URL scheme)
- `REDIS_DB` - Database number (0-15, defaults to 0)

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
- Function: `checkRedisConnection()` in `backend/src/lib/redis.ts`
- Returns: `{ connected: boolean, latencyMs?: number, error?: string }`
- Usage: Expose via `/api/health/redis` endpoint for monitoring

**Monitoring Metrics**:
- Connection status (connected/disconnected)
- Latency (ping response time)
- Error rates (connection failures, timeouts)
- Key count (rate limit keys in use)
- Memory usage (if monitoring Redis directly)

**Alerting**:
- **Critical**: Redis connection failures (fail-open behavior means service continues)
- **Warning**: High latency (>100ms ping response)
- **Info**: Connection recovery after failure

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
- **Managed Redis (Upstash/AWS ElastiCache)**: Automatic daily backups included
- **Self-hosted**: Configure RDB snapshots or AOF persistence if needed
- **Note**: Rate limit state loss is acceptable; no backup required for this use case

**Disaster Recovery**:
- Redis failure triggers fail-open behavior (rate limiting disabled)
- No data recovery needed (rate limits reset automatically)
- Restore Redis connectivity to resume rate limiting

### High Availability Options

**1. Redis Sentinel** (Recommended for self-hosted):
- Automatic failover to replica if master fails
- Multiple sentinel instances for quorum
- Connection string format: `redis-sentinel://sentinel1:26379,sentinel2:26379/mymaster`
- Configure in `REDIS_URL` with sentinel endpoints

**2. Redis Cluster** (For horizontal scaling):
- Sharded data across multiple nodes
- Automatic failover and replication
- Connection string: `redis://node1:6379,node2:6379,node3:6379`
- `ioredis` supports cluster mode natively

**3. Managed Services** (Production recommended):
- **Upstash**: Global distribution, automatic failover, serverless scaling
- **AWS ElastiCache**: Multi-AZ deployment, automatic backups, VPC isolation
- **Redis Cloud**: Enterprise features, high availability, monitoring

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
1. **Provision Redis**: Set up managed Redis (Upstash/ElastiCache) or self-hosted cluster
2. **Configure Connection**: Set `REDIS_URL` environment variable in ECS task definition
3. **Security**: Use TLS (`rediss://`) and authentication (password in URL)
4. **Network**: Ensure ECS tasks can reach Redis (VPC, security groups)
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
3. **Deploy**: Blue/Green deployment to ECS ensures zero-downtime updates.
4. **Database Migrations**: `drizzle-kit push` or `migrations` run as part of the deployment sequence.

---
*Back to [README](README.md)*
