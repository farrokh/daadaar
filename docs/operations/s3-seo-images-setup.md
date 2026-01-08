# Making SEO Images Publicly Accessible

## Overview

This document explains how to configure the S3 bucket to allow public read access for SEO/Open Graph images while keeping all other content private.

## Problem

Social media platforms (Twitter/X, LinkedIn, Facebook, Instagram, etc.) need to access Open Graph images when users share links. These crawlers cannot access:
- Presigned URLs (they expire)
- Private S3 objects (require authentication)

## Solution

Create a dedicated `seo/` folder in the S3 bucket with public read access for permanent, crawler-accessible images.

## Implementation

### Step 1: Update S3 Bucket Policy

Add the following policy to your S3 bucket (`daadaar-media-v1-<AWS_ACCOUNT_ID>`) to make only the `seo/` folder publicly readable:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadForSEOImages",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::daadaar-media-v1-<AWS_ACCOUNT_ID>/seo/*"
    }
  ]
}
```

### Step 2: Apply Using AWS CLI

```bash
# Create a policy file
cat > /tmp/seo-bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadForSEOImages",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::daadaar-media-v1-317430950654/seo/*"
    }
  ]
}
EOF

# Apply the policy
aws s3api put-bucket-policy \
  --bucket daadaar-media-v1-<AWS_ACCOUNT_ID> \
  --policy file:///tmp/seo-bucket-policy.json
```

### Step 3: Verify Block Public Access Settings

Ensure that the bucket's Block Public Access settings don't prevent this policy:

```bash
# Check current settings
aws s3api get-public-access-block \
  --bucket daadaar-media-v1-317430950654

# If needed, update to allow policy-based public access
aws s3api put-public-access-block \
  --bucket daadaar-media-v1-<AWS_ACCOUNT_ID> \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

**Important:** This configuration:
- ✅ Blocks public ACLs (security best practice)
- ✅ Allows bucket policies (needed for our SEO folder)
- ✅ Allows restricted public bucket access (controlled via policy)

### Step 4: Test Public Access

```bash
# Upload a test image
aws s3 cp /path/to/test-image.jpg \
  s3://daadaar-media-v1-<AWS_ACCOUNT_ID>/seo/test/test-image.jpg \
  --content-type image/jpeg

# Test public access (should return 200)
curl -I https://daadaar-media-v1-<AWS_ACCOUNT_ID>.s3.us-east-1.amazonaws.com/seo/test/test-image.jpg

# Test private path (should return 403)
curl -I https://daadaar-media-v1-<AWS_ACCOUNT_ID>.s3.us-east-1.amazonaws.com/users/123/private.jpg
```

## Folder Structure

```tree
daadaar-media-v1-317430950654/
├── seo/                          # Public folder (read-only)
│   ├── org/
│   │   └── {uuid}.jpg            # Organization OG images
│   ├── individual/
│   │   └── {uuid}.jpg            # Individual profile OG images
│   └── report/
│       └── {uuid}.jpg            # Report OG images
├── users/                        # Private folder
│   └── {user-id}/
│       └── {files}               # User uploaded content
└── sessions/                     # Private folder
    └── {session-id}/
        └── {files}               # Anonymous uploads
```

## Security Considerations

1. **Only SEO folder is public** - All other content remains private
2. **Read-only access** - Public users cannot upload/delete
3. **No ACL manipulation** - BlockPublicAcls prevents individual file permission changes
4. **Controlled via policy** - All access rules are centralized in bucket policy

## Alternative: CloudFront Distribution

For better performance and CDN benefits, consider creating a CloudFront distribution:

```bash
# Create CloudFront distribution for the bucket
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

Benefits:
- Faster global delivery
- HTTPS by default
- Potential cost savings
- Better analytics

## Monitoring

Set up CloudWatch alerts for unusual access patterns:

```bash
# Enable S3 access logging
aws s3api put-bucket-logging \
  --bucket daadaar-media-v1-<AWS_ACCOUNT_ID> \
  --bucket-logging-status \
  '{"LoggingEnabled": {"TargetBucket": "daadaar-logs", "TargetPrefix": "s3-access/"}}'
```

## Cost Implications

- **Storage**: SEO images are small (~100KB each)
- **Transfer**: Public reads incur standard S3 data transfer costs
- **Estimate**: For 1000 shares/month with 100KB images → ~$0.01/month

## Rollback

If you need to revert to private-only access:

```bash
# Remove the bucket policy
aws s3api delete-bucket-policy \
  --bucket daadaar-media-v1-317430950654

# Re-enable full block public access
aws s3api put-public-access-block \
  --bucket daadaar-media-v1-<AWS_ACCOUNT_ID> \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```
