# SEO Images for Social Media Sharing

## Overview

This document explains the SEO image system for Daadaar, which ensures that when users share links to organizations, individuals, or reports on social media platforms (X/Twitter, LinkedIn, Facebook, Instagram, etc.), a permanent, publicly accessible Open Graph image is displayed.

## Problem Statement

Social media crawlers need access to Open Graph (OG) images to display rich previews when links are shared. Previously, we faced these issues:

1. **Presigned URLs expire** - S3 presigned URLs are temporary and expire after a set time
2. **Private S3 objects** - Regular S3 objects require authentication
3. **Crawler limitations** - Social media scrapers cannot authenticate or use expiring URLs

## Solution

We've implemented a dual-layer solution:

### 1. Public S3 Folder

- Created a dedicated `seo/` folder in the S3 bucket with public read access
- Only this folder is publicly accessible; all other content remains private
- Images are stored permanently with predictable URLs

### 2. Dynamic SEO Image Generation

- Backend generates branded OG images on-demand
- Images are 1200x630px (optimal for social media)
- Branded with gradients and the Daadaar logo
- One image per entity (org, individual, report)

## Architecture

```
Frontend (Next.js)
    ↓
generateMetadata() → getSeoImageUrl(entityType, uuid)
    ↓
Public S3 URL (permanent)
    ↓
https://bucket.s3.amazonaws.com/seo/{entityType}/{uuid}.jpg
```

## S3 Folder Structure

```
daadaar-media-v1-317430950654/
├── seo/                          # ✅ Public (read-only)
│   ├── org/
│   │   ├── {uuid-1}.jpg
│   │   ├── {uuid-2}.jpg
│   │   └── ...
│   ├── individual/
│   │   ├── {uuid-1}.jpg
│   │   ├── {uuid-2}.jpg
│   │   └── ...
│   └── report/
│       ├── {uuid-1}.jpg
│       ├── {uuid-2}.jpg
│       └── ...
├── users/                        # 🔒 Private
│   └── ...
└── sessions/                     # 🔒 Private
    └── ...
```

## Setup Instructions

Follow these steps to set up the SEO image system:

### Step 1: Configure S3 Bucket Policy

Apply the bucket policy to make only the `seo/` folder publicly readable:

```bash
cd infrastructure/aws
cat docs/operations/s3-seo-images-setup.md
```

Follow the instructions in that document to:
1. Apply the S3 bucket policy
2. Update Block Public Access settings
3. Test public access

### Step 2: Generate SEO Images

You have two options to generate images:

#### Option A: Batch Generation (Recommended for existing data)

As an admin user, call the batch generation endpoint:

```bash
curl -X POST https://api.daadaar.com/api/seo/batch-generate \
  -H "Cookie: token=YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

This will generate SEO images for all existing organizations, individuals, and reports.

#### Option B: Individual Generation

Generate images for specific entities:

```bash
# Organization
curl -X POST https://api.daadaar.com/api/seo/generate-org-image/{uuid}

# Individual  
curl -X POST https://api.daadaar.com/api/seo/generate-individual-image/{uuid}

# Report
curl -X POST https://api.daadaar.com/api/seo/generate-report-image/{uuid}
```

### Step 3: Verify Setup

1. **Check S3**: Verify images exist in S3:
   ```bash
   aws s3 ls s3://daadaar-media-v1-317430950654/seo/org/
   aws s3 ls s3://daadaar-media-v1-317430950654/seo/individual/
   aws s3 ls s3://daadaar-media-v1-317430950654/seo/report/
   ```

2. **Test Public Access**: 
   ```bash
   curl -I https://daadaar-media-v1-317430950654.s3.us-east-1.amazonaws.com/seo/org/{uuid}.jpg
   ```
   Should return `200 OK`

3. **Test Social Media Preview**:
   - Use [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - Use [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - Use [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

## API Endpoints

### Generate SEO Images

```
POST /api/seo/generate-org-image/:uuid
POST /api/seo/generate-individual-image/:uuid
POST /api/seo/generate-report-image/:uuid
POST /api/seo/batch-generate (admin only)
```

### Get SEO Image URL

```
GET /api/seo/image-url/:entityType/:uuid
```

Returns the public URL without generating the image.

## Frontend Usage

The frontend automatically uses SEO images in Open Graph metadata:

```typescript
// frontend/app/[locale]/org/[uuid]/page.tsx
import { getSeoImageUrl } from '@/lib/seo-utils';

export async function generateMetadata({ params }: Props) {
  const { uuid } = await params;
  const seoImageUrl = getSeoImageUrl('org', uuid);
  
  return {
    openGraph: {
      images: [{ url: seoImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [seoImageUrl],
    },
  };
}
```

## Automation

### Automatic Generation on Entity Creation

To automatically generate SEO images when entities are created, you can:

1. Add a hook in the create/update controllers:
   ```typescript
   // After creating organization
   generateOrgSeoImage(newOrg.shareableUuid, newOrg.name, null)
     .catch(err => console.error('SEO image generation failed:', err));
   ```

2. Use a background job/worker (recommended for production):
   - Set up an SQS queue for SEO image generation
   - Trigger from entity creation events
   - Process asynchronously

### Regeneration

To regenerate images (e.g., after design updates):

```bash
# Regenerate all
curl -X POST https://api.daadaar.com/api/seo/batch-generate \
  -H "Cookie: token=YOUR_ADMIN_TOKEN"

# Regenerate specific entity
curl -X POST https://api.daadaar.com/api/seo/generate-org-image/{uuid}
```

## Image Specifications

- **Dimensions**: 1200x630px (Facebook/Twitter recommended)
- **Format**: JPEG (quality: 85%)
- **File size**: ~100-200KB per image
- **Naming**: `{entityType}/{uuid}.jpg`
- **Content**: 
  - Gradient background (unique per entity type)
  - Entity name (centered, bold, white text)
  - "Daadaar" branding (below name)

## Costs

Estimated AWS costs for SEO images:

- **Storage**: $0.023/GB/month
  - 1000 images × 150KB = ~150MB = **$0.003/month**
  
- **Data Transfer**: $0.09/GB (first 10TB)
  - 1000 shares/month × 150KB = ~150MB = **$0.01/month**

**Total**: ~$0.01-0.02/month for moderate usage

## Security Considerations

1. **Read-only public access** - Users cannot upload/modify SEO images
2. **ACL protection** - BlockPublicACLs prevents individual file permission changes
3. **Controlled folder** - Only `seo/*` is public, all other paths remain private
4. **No sensitive data** - SEO images contain only public entity names
5. **Bucket policy** - All access rules centralized in bucket policy

## Troubleshooting

### Images not showing on social media

1. **Check image exists**:
   ```bash
   curl -I https://daadaar-media-v1-317430950654.s3.us-east-1.amazonaws.com/seo/org/{uuid}.jpg
   ```

2. **Verify bucket policy is applied**:
   ```bash
   aws s3api get-bucket-policy --bucket daadaar-media-v1-317430950654
   ```

3. **Clear social media cache**:
   - Twitter: https://cards-dev.twitter.com/validator
   - Facebook: https://developers.facebook.com/tools/debug/
   - LinkedIn: https://www.linkedin.com/post-inspector/

### 403 Forbidden errors

1. Check Block Public Access settings:
   ```bash
   aws s3api get-public-access-block --bucket daadaar-media-v1-317430950654
   ```

2. Ensure `BlockPublicPolicy` and `RestrictPublicBuckets` are `false`

### Images not generating

1. Check backend logs for errors
2. Verify Sharp library is installed: `bun install sharp`
3. Test endpoint directly:
   ```bash
   curl -X POST http://localhost:4000/api/seo/generate-org-image/{uuid}
   ```

## Future Enhancements

1. **Dynamic image composition**: Include actual logos/profile images in OG images
2. **Localization**: Generate separate images for different locales
3. **A/B testing**: Test different designs for better engagement
4. **Analytics**: Track which OG images drive most clicks
5. **CDN**: Add CloudFront distribution for faster global delivery
6. **Webhook**: Auto-generate on entity creation/update

## Related Documentation

- [S3 Setup Guide](../operations/s3-seo-images-setup.md)
- [Implementation Summary](./seo-images-implementation.md)
- [Backend SEO Image Generator](../../backend/src/lib/seo-image-generator.ts)
- [Frontend SEO Utils](../../frontend/lib/seo-utils.ts)
- [API Routes](../../backend/src/routes/seo-images.ts)
