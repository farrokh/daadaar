#!/bin/bash

# Generate SEO Images for All Production Entities
# Run this AFTER deploying the backend to production

set -e

echo "📸 Generating SEO Images for Production"
echo "========================================"
echo ""

API_URL="https://api.daadaar.com/api/seo"

# Check if we have an admin token
if [ -z "$ADMIN_TOKEN" ]; then
  echo "⚠️  ADMIN_TOKEN environment variable not set"
  echo ""
  echo "To run this script, you need an admin authentication token."
  echo ""
  echo "How to get your token:"
  echo "1. Open https://www.daadaar.com/admin in your browser"
  echo "2. Open Developer Tools (F12)"
  echo "3. Go to Application > Cookies"
  echo "4. Copy the value of the 'token' cookie"
  echo "5. Run: export ADMIN_TOKEN='your-token-here'"
  echo "6. Then run this script again"
  echo ""
  exit 1
fi

echo "🔐 Using admin token: ${ADMIN_TOKEN:0:20}..."
echo ""

echo "🚀 Starting batch generation..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/batch-generate" \
  -H "Cookie: token=${ADMIN_TOKEN}" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Response Code: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Batch generation successful!"
  echo ""
  echo "Results:"
  echo "$BODY" | jq '.'
  echo ""
  
  # Parse results
  ORG_SUCCESS=$(echo "$BODY" | jq -r '.data.organizations.success')
  ORG_FAILED=$(echo "$BODY" | jq -r '.data.organizations.failed')
  IND_SUCCESS=$(echo "$BODY" | jq -r '.data.individuals.success')
  IND_FAILED=$(echo "$BODY" | jq -r '.data.individuals.failed')
  REP_SUCCESS=$(echo "$BODY" | jq -r '.data.reports.success')
  REP_FAILED=$(echo "$BODY" | jq -r '.data.reports.failed')
  
  echo "📊 Summary:"
  echo "  Organizations: $ORG_SUCCESS generated, $ORG_FAILED failed"
  echo "  Individuals:   $IND_SUCCESS generated, $IND_FAILED failed"
  echo "  Reports:       $REP_SUCCESS generated, $REP_FAILED failed"
  echo ""
  
  TOTAL_SUCCESS=$((ORG_SUCCESS + IND_SUCCESS + REP_SUCCESS))
  TOTAL_FAILED=$((ORG_FAILED + IND_FAILED + REP_FAILED))
  
  echo "  Total: $TOTAL_SUCCESS images generated, $TOTAL_FAILED failed"
  echo ""
  
  echo "🔍 Verify images in S3:"
  echo "  aws s3 ls s3://daadaar-media-v1-317430950654/seo/org/"
  echo "  aws s3 ls s3://daadaar-media-v1-317430950654/seo/individual/"
  echo "  aws s3 ls s3://daadaar-media-v1-317430950654/seo/report/"
  echo ""
  
elif [ "$HTTP_CODE" = "401" ]; then
  echo "❌ Authentication failed!"
  echo "Your admin token may be expired or invalid."
  echo "Please get a fresh token and try again."
  echo ""
  
elif [ "$HTTP_CODE" = "403" ]; then
  echo "❌ Authorization failed!"
  echo "Your account does not have admin permissions."
  echo ""
  
else
  echo "❌ Request failed with HTTP $HTTP_CODE"
  echo ""
  echo "Response:"
  echo "$BODY"
  echo ""
fi

echo "🧪 Test your SEO images:"
echo "1. Get a shareable UUID from your database"
echo "2. Construct URL: https://daadaar-media-v1-317430950654.s3.us-east-1.amazonaws.com/seo/org/{uuid}.jpg"
echo "3. Open in browser to verify"
echo ""
echo "📱 Test social media sharing:"
echo "  Twitter: https://cards-dev.twitter.com/validator"
echo "  Facebook: https://developers.facebook.com/tools/debug/"
echo "  LinkedIn: https://www.linkedin.com/post-inspector/"
