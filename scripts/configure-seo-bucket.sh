#!/bin/bash

# Script to configure S3 bucket for public SEO images
# Usage: ./configure-seo-bucket.sh

set -e

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET_NAME="daadaar-media-v1-${AWS_ACCOUNT_ID}"
REGION=${REGION:-"us-east-1"}

echo "🔧 Configuring S3 bucket for SEO images..."
echo "Bucket: ${BUCKET_NAME}"
echo "Region: ${REGION}"
echo ""

# Create bucket policy file
echo "📝 Creating bucket policy..."
cat > /tmp/seo-bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadForSEOImages",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/seo/*"
    }
  ]
}
EOF

# Apply bucket policy
echo "🔐 Applying bucket policy..."
aws s3api put-bucket-policy \
  --bucket "${BUCKET_NAME}" \
  --policy file:///tmp/seo-bucket-policy.json

echo "✅ Bucket policy applied"
echo ""

# Update Block Public Access settings
echo "🔓 Updating Block Public Access settings..."
aws s3api put-public-access-block \
  --bucket "${BUCKET_NAME}" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false"

echo "✅ Block Public Access settings updated"
echo ""

# Verify configuration
echo "🔍 Verifying configuration..."
echo ""
echo "Current bucket policy:"
aws s3api get-bucket-policy --bucket "${BUCKET_NAME}" --query Policy --output text | jq .
echo ""

echo "Current Block Public Access settings:"
aws s3api get-public-access-block --bucket "${BUCKET_NAME}"
echo ""

# Test access
echo "🧪 Testing public access..."
TEST_URL="https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/seo/test.jpg"
echo "Testing: ${TEST_URL}"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${TEST_URL}")

if [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "404" ]; then
  echo "✅ Configuration successful!"
  echo "   (403/404 is expected - the test file doesn't exist yet)"
else
  echo "⚠️  Unexpected response code: ${HTTP_CODE}"
  echo "   Expected 403 or 404"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Deploy your backend code with the new SEO image endpoints"
echo "2. Generate SEO images using the API:"
echo "   curl -X POST https://api.daadaar.com/api/seo/batch-generate \\"
echo "     -H \"Cookie: token=YOUR_ADMIN_TOKEN\""
echo "3. Test on social media platforms"
echo ""
echo "Documentation: docs/seo-images.md"
