# AWS Cost Optimization Summary

**Last Updated:** 2026-01-07  
**Total Monthly Savings:** ~$25-40

---

## Completed Optimizations

### 1. ElastiCache Migration (Serverless → t4g.micro)

**Status:** ✅ Complete  
**Date:** 2026-01-07  
**Savings:** $25.38-40.38/month (68-78% reduction)

#### Before
- ElastiCache Serverless: ~$15-30/month
- 3 Auto-created VPC Endpoints: $21.90/month
- **Total:** ~$36.90-51.90/month

#### After
- ElastiCache t4g.micro: $11.52/month
- VPC Endpoints: $0 (removed)
- **Total:** $11.52/month

#### Performance Impact
- ✅ Latency improved: 13ms (consistent) vs 10-20ms (variable)
- ✅ No global user impact (Redis is internal)
- ✅ More predictable performance

---

## Current AWS Infrastructure Costs

### Compute
- **App Runner (Backend):** ~$25-50/month (based on usage)
- **Vercel (Frontend):** Handled separately

### Database & Cache
- **RDS PostgreSQL:** ~$15-30/month (db.t4g.micro)
- **ElastiCache Redis:** $11.52/month (cache.t4g.micro) ✅ Optimized

### Storage
- **S3 (Media):** ~$1-5/month (based on usage)

### Networking
- **VPC Endpoints (7 total):** $51.10/month
  - Secrets Manager: $7.30/month
  - CloudWatch Logs: $7.30/month
  - ECR API: $7.30/month
  - ECR DKR: $7.30/month
  - STS: $7.30/month
  - SES SMTP: $7.30/month
  - Lambda: $7.30/month

### Total Estimated Monthly Cost
**~$103-136/month** (down from ~$128-176/month)

---

## Potential Future Optimizations

### 1. CodeBuild VPC Endpoints (Moderate Savings)

**Current Cost:** $21.90/month (3 endpoints: ECR API, ECR DKR, STS)  
**Usage:** Only during database migrations/builds (infrequent)

**Option A:** Keep endpoints (current)
- Cost: $21.90/month
- Benefit: Instant builds

**Option B:** Use NAT Gateway on-demand
- Cost: $0.045/hour = ~$0.09 per 2-hour build
- Savings: ~$21/month if builds are infrequent
- Trade-off: Need to create/delete NAT Gateway for each build

**Recommendation:** Keep endpoints unless builds are very rare (< 1/month)

---

### 2. RDS Instance Optimization (If Applicable)

**Current:** Likely db.t4g.micro or similar  
**Review:** Check actual database usage

If database CPU/memory usage is consistently low:
- Consider db.t4g.micro (if not already)
- Review backup retention (currently 0 days - consider enabling)
- Potential savings: $5-15/month

---

### 3. S3 Lifecycle Policies

**Current:** All media stored indefinitely  
**Optimization:** Implement lifecycle policies

- Move old/unused media to S3 Glacier after 90 days
- Delete temporary uploads after 7 days
- Potential savings: $1-3/month

---

### 4. CloudWatch Logs Retention

**Review:** Log retention periods  
**Optimization:** Set appropriate retention (7-30 days for most logs)

- Reduce storage costs
- Maintain compliance requirements
- Potential savings: $2-5/month

---

## Cost Monitoring Recommendations

### 1. Set Up AWS Budgets
```bash
aws budgets create-budget \
  --account-id YOUR-ACCOUNT-ID \
  --budget file://budget-config.json \
  --notifications-with-subscribers file://notifications.json
```

### 2. Enable Cost Anomaly Detection
- Automatically detect unusual spending
- Get alerts for unexpected cost increases

### 3. Review Cost Explorer Monthly
- Identify trending costs
- Spot optimization opportunities
- Track savings from optimizations

---

## Documentation

- **Migration Guide:** `elasticache-migration-guide.md`
- **Performance Analysis:** `performance-analysis.md`
- **Infrastructure Overview:** `../../architecture/infrastructure.md`

---

## Summary

✅ **Completed:** ElastiCache optimization (-$25-40/month)  
⏭️ **Next:** Review RDS usage and consider backup strategy  
📊 **Monitoring:** Set up AWS Budgets and Cost Anomaly Detection

**Total Annual Savings from ElastiCache Migration:** $304.56-484.56
