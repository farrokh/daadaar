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
