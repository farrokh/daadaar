# ElastiCache Migration: Serverless → t4g.micro

**Date:** 2026-01-07  
**Purpose:** Cost optimization guide for migrating ElastiCache from Serverless to t4g.micro  
**Savings:** ~$25-40/month (68-78% reduction)

---

## Overview

This guide documents the migration from AWS ElastiCache Serverless to a cost-effective t4g.micro instance, reducing monthly costs while maintaining or improving performance.

---

## Cost Comparison

### Before Migration
- ElastiCache Serverless: ~$15-30/month (variable)
- 3 Auto-created VPC Endpoints: $21.90/month
- **Total: ~$36.90-51.90/month**

### After Migration
- ElastiCache t4g.micro: $11.52/month (fixed)
- No VPC endpoints needed
- **Total: $11.52/month**
- **Savings: ~$25.38-40.38/month (68-78%)**

---

## Migration Steps

### Step 1: Create ElastiCache Subnet Group

```bash
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name YOUR-SUBNET-GROUP-NAME \
  --cache-subnet-group-description "Subnet group for Redis" \
  --subnet-ids subnet-XXXXX subnet-YYYYY \
  --region YOUR-REGION
```

### Step 2: Create t4g.micro Redis Cluster

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id YOUR-CLUSTER-ID \
  --engine redis \
  --cache-node-type cache.t4g.micro \
  --num-cache-nodes 1 \
  --cache-subnet-group-name YOUR-SUBNET-GROUP-NAME \
  --security-group-ids sg-XXXXX \
  --engine-version 7.1 \
  --port 6379 \
  --preferred-maintenance-window sun:05:00-sun:06:00 \
  --snapshot-retention-limit 1 \
  --snapshot-window 04:00-05:00 \
  --region YOUR-REGION \
  --tags Key=Project,Value=YourProject Key=Environment,Value=Production
```

**Expected time:** 10-15 minutes to provision

### Step 3: Wait for Cluster to be Available

```bash
aws elasticache describe-cache-clusters \
  --cache-cluster-id YOUR-CLUSTER-ID \
  --show-cache-node-info \
  --region YOUR-REGION \
  --query 'CacheClusters[0].{Status:CacheClusterStatus,Endpoint:CacheNodes[0].Endpoint}'
```

Wait until status is `available`.

### Step 4: Get New Endpoint

```bash
aws elasticache describe-cache-clusters \
  --cache-cluster-id YOUR-CLUSTER-ID \
  --show-cache-node-info \
  --region YOUR-REGION \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.{Address:Address,Port:Port}' \
  --output json
```

### Step 5: Update Application Environment Variable

Update your application's `REDIS_URL` environment variable to point to the new endpoint:

```
redis://YOUR-NEW-ENDPOINT:6379
```

**Note:** This will trigger a new deployment (~5 minutes)

### Step 6: Verify New Redis Connection

```bash
# Check your application health endpoint
curl https://YOUR-API-URL/health | jq '.redis'
```

Expected output:
```json
{
  "connected": true,
  "latencyMs": <number>
}
```

### Step 7: Delete ElastiCache Serverless (After Verification)

⚠️ **IMPORTANT:** Only run this after confirming the new cluster works!

```bash
aws elasticache delete-serverless-cache \
  --serverless-cache-name YOUR-SERVERLESS-CACHE-NAME \
  --region YOUR-REGION
```

This will automatically delete the 3 auto-created VPC endpoints.

### Step 8: Verify VPC Endpoints Cleanup

```bash
# Check that ElastiCache VPC endpoints are gone
aws ec2 describe-vpc-endpoints \
  --filters "Name=vpc-id,Values=YOUR-VPC-ID" \
  --region YOUR-REGION \
  --query 'VpcEndpoints[?contains(ServiceName, `elasticache`)].{ID:VpcEndpointId,Service:ServiceName,State:State}' \
  --output table
```

Should return empty (no ElastiCache endpoints).

---

## Rollback Plan

If anything goes wrong:

1. **Keep the Serverless instance running** until new cluster is verified
2. **Revert application environment variable** to old endpoint
3. **Delete the t4g cluster** if needed:
   ```bash
   aws elasticache delete-cache-cluster \
     --cache-cluster-id YOUR-CLUSTER-ID \
     --region YOUR-REGION
   ```

---

## Post-Migration Verification

- [ ] Application health check shows Redis connected
- [ ] Rate limiting works (test with multiple requests)
- [ ] Session management works (login/logout)
- [ ] No errors in application logs
- [ ] ElastiCache Serverless deleted
- [ ] 3 ElastiCache VPC endpoints removed
- [ ] Monthly bill reduced by ~$25-40

---

## Expected Downtime

**Zero downtime** if done correctly:
1. New cluster is created while old one runs
2. Application switches to new endpoint (rolling deployment)
3. Old cluster deleted only after verification

**Worst case:** ~5 minutes during application deployment (fail-open rate limiting continues to work)

---

## Monitoring

After migration, monitor:
- CloudWatch metrics for new cluster
- Application logs for Redis connection errors
- Health endpoint for Redis status
- Cost Explorer for reduced VPC endpoint charges

---

## Notes

- t4g.micro has **555 MB memory** (sufficient for sessions + rate limiting)
- Automatic backups enabled (1-day retention)
- Maintenance window: Sundays 5:00-6:00 AM UTC
- No TLS required for VPC-internal connections (but can be enabled if needed)

---

## Security Considerations

- Redis cluster runs in private VPC subnets
- Security groups control access
- No public internet access
- Backups encrypted at rest
- Consider enabling in-transit encryption if required by compliance

---

## Performance Notes

### Latency Comparison
- **Serverless:** 10-20ms (variable)
- **t4g.micro:** ~13ms (consistent)

### Consistency
- **Serverless:** Auto-scaling can cause variable latency
- **t4g.micro:** Dedicated resources, predictable performance

---

**Last Updated:** 2026-01-07  
**Status:** Production-ready migration guide
