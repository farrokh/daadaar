# 🚀 SEO Images - Production Deployment Guide

## Current Status

✅ **S3 Bucket Configured** - Public `seo/` folder is ready  
✅ **Code Committed** - All changes are in branch `feat/seo-images`  
⏳ **Pending**: PR merge & deployment  
⏳ **Pending**: Generate images for production data  

---

## Step-by-Step Deployment

### Step 1: Merge the Pull Request

1. **Open the PR**: https://github.com/farrokh/daadaar/pull/new/feat/seo-images

2. **Create Pull Request** with this info:
   - **Title**: `feat: Add SEO images for social media sharing`
   - **Description**: 
     ```
     Implements permanent, publicly accessible Open Graph images for social media sharing.
     
     ## Changes
     - ✅ Backend API endpoints for SEO image generation
     - ✅ Branded 1200x630px images (unique gradient per entity type)
     - ✅ S3 public folder configuration
     - ✅ Frontend metadata updates
     - ✅ Documentation and automation scripts
     
     ## Testing Required
     - Deploy backend to production
     - Generate SEO images via `/api/seo/batch-generate`
     - Test social media sharing on Twitter/Facebook
     
     ## S3 Configuration
     The S3 bucket policy has already been applied to allow public read access 
     to the `seo/` folder while keeping all other content private.
     ```

3. **Merge the PR** (after any required reviews/checks pass)

4. **Pull main branch locally**:
   ```bash
   git checkout main
   git pull origin main
   ```

---

### Step 2: Deploy Backend to Production

Run the automated deployment script:

```bash
cd /Users/farrokhrostamikia/projects/daadaar
./scripts/deploy-seo-images.sh
```

This script will:
- Build the Docker image
- Push to ECR
- Trigger App Runner deployment
- Perform health checks

**Estimated time**: 5-7 minutes

---

### Step 3: Generate SEO Images for Production Data

After the backend is deployed and healthy, generate images for all existing entities:

```bash
# 1. Get your admin token
# - Open https://www.daadaar.com/admin
# - Open Developer Tools (F12) > Application > Cookies
# - Copy the 'token' cookie value

# 2. Set the token
export ADMIN_TOKEN='your-token-here'

# 3. Run the generation script
./scripts/generate-production-seo-images.sh
```

The script will display progress and results like:
```
📊 Summary:
  Organizations: 25 generated, 0 failed
  Individuals:   50 generated, 0 failed
  Reports:       100 generated, 0 failed
  
  Total: 175 images generated, 0 failed
```

---

### Step 4: Verify the Images

#### Check S3
```bash
# List generated images
aws s3 ls s3://daadaar-media-v1-317430950654/seo/org/
aws s3 ls s3://daadaar-media-v1-317430950654/seo/individual/
aws s3 ls s3://daadaar-media-v1-317430950654/seo/report/
```

#### Test Public Access
```bash
# Pick any UUID from your database and test
curl -I https://daadaar-media-v1-317430950654.s3.us-east-1.amazonaws.com/seo/org/{uuid}.jpg

# Should return: HTTP/1.1 200 OK
```

#### Test in Browser
Open this URL in your browser (replace `{uuid}` with a real one):
```
https://daadaar-media-v1-317430950654.s3.us-east-1.amazonaws.com/seo/org/{uuid}.jpg
```

You should see a branded image with gradient background and entity name.

---

### Step 5: Test Social Media Sharing

1. **Share a link** on Twitter/X, LinkedIn, or Facebook:
   - https://www.daadaar.com/org/{uuid}
   - https://www.daadaar.com/person/{uuid}
   - https://www.daadaar.com/reports/{uuid}

2. **Validate with social media tools**:
   - **Twitter**: https://cards-dev.twitter.com/validator
   - **Facebook**: https://developers.facebook.com/tools/debug/
   - **LinkedIn**: https://www.linkedin.com/post-inspector/

3. **Expected result**: 
   - Large preview card with branded 1200x630 image
   - Entity name centered on gradient background
   - "Daadaar" branding below name

---

## Manual Generation (Alternative)

If you prefer to generate images manually via API:

### Batch Generate All Entities
```bash
curl -X POST https://api.daadaar.com/api/seo/batch-generate \
  -H "Cookie: token=YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Generate Individual Entity
```bash
# Organization
curl -X POST https://api.daadaar.com/api/seo/generate-org-image/{uuid}

# Individual
curl -X POST https://api.daadaar.com/api/seo/generate-individual-image/{uuid}

# Report
curl -X POST https://api.daadaar.com/api/seo/generate-report-image/{uuid}
```

---

## Troubleshooting

### Images not generating (500 error)
```bash
# Check backend logs in App Runner
# Verify Sharp library is installed in Docker image
# The Dockerfile already includes Sharp in dependencies
```

### Images generating but not accessible (403 error)
```bash
# Verify S3 bucket policy
aws s3api get-bucket-policy --bucket daadaar-media-v1-317430950654

# Should show the public read policy for seo/*
```

### Social media not showing images
```bash
# Clear social media cache using their validation tools
# Re-fetch the URL to update their cache
# Ensure images are < 5MB (our images are ~100-200KB, well within limit)
```

---

## What Happens Automatically

### For New Entities
Currently, SEO images are **not** autogenerated when entities are created. You have two options:

1. **Manual**: Generate on-demand via API when needed
2. **Automatic** (future enhancement): Add hooks to entity creation in controllers

To add automatic generation, edit these files:
- `backend/src/controllers/organizations.ts` (after creating org)
- `backend/src/controllers/individuals.ts` (after creating individual)  
- `backend/src/controllers/reports.ts` (after creating report)

Add this after entity creation:
```typescript
// Generate SEO image asynchronously
generateOrgSeoImage(newOrg.shareableUuid, newOrg.name, null)
  .catch(err => console.error('SEO image generation failed:', err));
```

---

## Summary of Changes

### Backend
- `backend/src/lib/seo-image-generator.ts` - Image generation logic
- `backend/src/controllers/seo-images.ts` - API endpoints
- `backend/src/routes/seo-images.ts` - Route definitions
- `backend/src/server.ts` - Route integration

### Frontend
- `frontend/lib/seo-utils.ts` - URL generation
- `frontend/app/[locale]/org/[uuid]/page.tsx` - Org metadata
- `frontend/app/[locale]/person/[uuid]/page.tsx` - Person metadata
- `frontend/app/[locale]/reports/[uuid]/page.tsx` - Report metadata

### Infrastructure
- S3 bucket policy updated (already applied)
- Public `seo/` folder configured

### Documentation
- `docs/seo-images.md` - Complete guide
- `infrastructure/aws/s3-seo-images-setup.md` - AWS setup
- `SEO-IMAGES-IMPLEMENTATION.md` - Quick reference

### Scripts
- `scripts/configure-seo-bucket.sh` - S3 configuration (already run)
- `scripts/deploy-seo-images.sh` - Production deployment
- `scripts/generate-production-seo-images.sh` - Image generation

---

## Quick Reference

### API Endpoints
```
POST /api/seo/generate-org-image/:uuid
POST /api/seo/generate-individual-image/:uuid
POST /api/seo/generate-report-image/:uuid
POST /api/seo/batch-generate (admin only)
GET  /api/seo/image-url/:entityType/:uuid
```

### SEO Image URLs
```
https://daadaar-media-v1-317430950654.s3.us-east-1.amazonaws.com/seo/org/{uuid}.jpg
https://daadaar-media-v1-317430950654.s3.us-east-1.amazonaws.com/seo/individual/{uuid}.jpg
https://daadaar-media-v1-317430950654.s3.us-east-1.amazonaws.com/seo/report/{uuid}.jpg
```

### Image Specs
- **Size**: 1200x630px (recommended by Facebook/Twitter)
- **Format**: JPEG (quality 85%)
- **File size**: ~100-200KB per image
- **Design**: Gradient background + entity name + Daadaar branding

---

## Cost Estimate

For **1,000 entities** with **1,000 shares/month**:
- Storage: ~$0.003/month
- Transfer: ~$0.01/month
- **Total: ~$0.01-0.02/month**

---

## Next Steps Checklist

- [ ] Merge PR: https://github.com/farrokh/daadaar/pull/new/feat/seo-images
- [ ] Pull main branch locally
- [ ] Run deployment script: `./scripts/deploy-seo-images.sh`
- [ ] Get admin token from browser cookies
- [ ] Run generation script: `./scripts/generate-production-seo-images.sh`
- [ ] Verify images in S3
- [ ] Test social media sharing
- [ ] Test with validation tools (Twitter, Facebook, LinkedIn)

---

**Need help?** See `docs/seo-images.md` for detailed documentation.
