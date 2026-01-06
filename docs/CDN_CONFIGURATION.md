# Cloudflare CDN Configuration for Media Delivery

## Overview

This document outlines the configuration for using Cloudflare CDN to deliver media files from AWS S3 with optimal performance and security.

## Architecture

```
User Request → Cloudflare CDN → AWS S3 (Origin)
                    ↓
              Cache (if available)
```

## Configuration Steps

### 1. Cloudflare Setup

1. **Add S3 Bucket as Origin**:
   - Go to Cloudflare Dashboard → Your Domain → DNS
   - Add CNAME record:
     - Name: `media` (or `cdn`)
     - Target: `daadaar-media-v1-317430950654.s3.us-east-1.amazonaws.com`
     - Proxy status: Proxied (orange cloud)

2. **Page Rules** (Cloudflare Dashboard → Rules → Page Rules):
   ```
   URL Pattern: media.daadaar.com/*
   Settings:
     - Cache Level: Cache Everything
     - Edge Cache TTL: 1 month
     - Browser Cache TTL: 1 week
     - Security Level: Medium
   ```

3. **Transform Rules** (for CORS):
   ```
   URL Pattern: media.daadaar.com/*
   Response Headers:
     - Access-Control-Allow-Origin: https://www.daadaar.com
     - Access-Control-Allow-Methods: GET, HEAD, OPTIONS
     - Access-Control-Max-Age: 86400
     - Cache-Control: public, max-age=604800
   ```

### 2. S3 Bucket Configuration

**Bucket Policy** (allow Cloudflare access):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudflareAccess",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::daadaar-media-v1-317430950654/*",
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": [
            "173.245.48.0/20",
            "103.21.244.0/22",
            "103.22.200.0/22",
            "103.31.4.0/22",
            "141.101.64.0/18",
            "108.162.192.0/18",
            "190.93.240.0/20",
            "188.114.96.0/20",
            "197.234.240.0/22",
            "198.41.128.0/17",
            "162.158.0.0/15",
            "104.16.0.0/13",
            "104.24.0.0/14",
            "172.64.0.0/13",
            "131.0.72.0/22"
          ]
        }
      }
    }
  ]
}
```

**CORS Configuration**:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["https://www.daadaar.com", "https://media.daadaar.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 3. Backend Code Changes

Update `backend/src/lib/s3-client.ts`:

```typescript
// Add CDN URL configuration
const CDN_URL = process.env.CDN_URL || 'https://media.daadaar.com';
const USE_CDN = process.env.USE_CDN === 'true';

/**
 * Get public URL for an S3 object (via CDN)
 */
export function getS3PublicUrl(key: string): string {
  if (!USE_S3) {
    return `http://localhost:4000/api/media/mock/${key}`;
  }

  if (USE_CDN) {
    return `${CDN_URL}/${key}`;
  }

  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
}

/**
 * Generate a presigned URL for reading a file from S3
 * Note: For public CDN delivery, use getS3PublicUrl instead
 */
export async function generatePresignedGetUrl(
  key: string,
  bucket?: string,
  expiresIn = 3600
): Promise<string> {
  // For CDN-enabled deployments, return CDN URL for public access
  if (USE_CDN) {
    return getS3PublicUrl(key);
  }

  // Fallback to presigned URLs for non-CDN deployments
  if (!USE_S3) {
    return `http://localhost:4000/api/media/mock/${key}`;
  }

  const command = new GetObjectCommand({
    Bucket: bucket || BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}
```

### 4. Environment Variables

Add to `.env`:
```bash
# CDN Configuration
USE_CDN=true
CDN_URL=https://media.daadaar.com
```

### 5. Frontend Changes

No changes needed! The backend already returns the correct URLs via `generatePresignedGetUrl`.

## Performance Optimizations

### 1. Image Optimization

Already implemented:
- ✅ AVIF conversion (60% quality, 4 effort)
- ✅ Max width: 2048px
- ✅ Sharp library for processing

Additional recommendations:
- Consider adding WebP fallback for older browsers
- Implement responsive images with srcset

### 2. Caching Strategy

**Cloudflare Cache**:
- Edge Cache TTL: 1 month (2592000 seconds)
- Browser Cache TTL: 1 week (604800 seconds)

**Cache Invalidation**:
```bash
# Purge specific file
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://media.daadaar.com/path/to/file.avif"]}'

# Purge all
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

### 3. Security

**Hotlink Protection** (Cloudflare Page Rule):
```
URL Pattern: media.daadaar.com/*
Settings:
  - Hotlink Protection: On
```

**Rate Limiting** (Cloudflare Rate Limiting):
```
URL Pattern: media.daadaar.com/*
Threshold: 100 requests per minute per IP
Action: Challenge
```

## Monitoring

### Cloudflare Analytics

Monitor:
- Cache hit ratio (target: >90%)
- Bandwidth savings
- Request volume
- Top countries/IPs

### CloudWatch Metrics

Monitor S3:
- GetObject requests (should decrease with CDN)
- Data transfer out (should decrease)
- 4xx/5xx errors

## Cost Optimization

**Expected Savings**:
- S3 Data Transfer: ~80% reduction
- S3 GET Requests: ~90% reduction
- Cloudflare: Free tier sufficient for MVP

**Estimated Costs** (1M requests/month):
- Without CDN: ~$90/month (S3 transfer + requests)
- With CDN: ~$20/month (S3 origin + Cloudflare free)
- **Savings**: ~$70/month (~78%)

## Testing

1. **Verify CDN is working**:
   ```bash
   curl -I https://media.daadaar.com/test-image.avif
   # Look for: cf-cache-status: HIT
   ```

2. **Test CORS**:
   ```bash
   curl -H "Origin: https://www.daadaar.com" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS \
        https://media.daadaar.com/test-image.avif
   ```

3. **Performance Test**:
   ```bash
   # First request (MISS)
   time curl -o /dev/null https://media.daadaar.com/test-image.avif
   
   # Second request (HIT - should be faster)
   time curl -o /dev/null https://media.daadaar.com/test-image.avif
   ```

## Rollback Plan

If issues occur:
1. Set `USE_CDN=false` in environment variables
2. Restart backend servers
3. System will fallback to presigned S3 URLs
4. No data loss, only performance impact

## Future Enhancements

1. **Image Resizing on-the-fly**:
   - Use Cloudflare Images or Cloudflare Workers
   - Generate thumbnails dynamically

2. **Video Streaming**:
   - Use Cloudflare Stream for video content
   - HLS/DASH adaptive bitrate streaming

3. **Smart Compression**:
   - Cloudflare Polish (automatic image optimization)
   - Brotli compression for text-based files

## References

- [Cloudflare CDN Documentation](https://developers.cloudflare.com/cache/)
- [S3 + Cloudflare Best Practices](https://developers.cloudflare.com/r2/examples/aws-s3/)
- [Cloudflare IP Ranges](https://www.cloudflare.com/ips/)
