#!/bin/bash

# Deploy SEO Images Feature to Production
# Run this AFTER merging the PR and checking out main branch

set -e

echo "🚀 Deploying SEO Images Feature to Production"
echo "=============================================="
echo ""

# Configuration
AWS_ACCOUNT_ID="317430950654"
AWS_REGION="us-east-1"
ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/daadaar-backend"
SERVICE_ARN="arn:aws:apprunner:us-east-1:317430950654:service/daadaar-backend-service/24ad2d8ead7e47dfa18db82af1db52f8"

echo "📦 Step 1: Build Docker Image"
echo "------------------------------"
cd "$(dirname "$0")/.."
docker build --platform linux/amd64 -t daadaar-backend -f backend/Dockerfile .
echo "✅ Image built"
echo ""

echo "🔐 Step 2: Authenticate with ECR"
echo "--------------------------------"
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin ${ECR_REPO}
echo "✅ Authenticated"
echo ""

echo "📤 Step 3: Tag and Push Image"
echo "-----------------------------"
docker tag daadaar-backend:latest ${ECR_REPO}:latest
docker push ${ECR_REPO}:latest
echo "✅ Image pushed to ECR"
echo ""

echo "🔄 Step 4: Trigger App Runner Deployment"
echo "---------------------------------------"
aws apprunner start-deployment --service-arn ${SERVICE_ARN} --region ${AWS_REGION}
echo "✅ Deployment triggered"
echo ""

echo "⏳ Waiting for deployment to complete (this may take 3-5 minutes)..."
echo "You can monitor progress at:"
echo "https://us-east-1.console.aws.amazon.com/apprunner/home?region=us-east-1#/services/${SERVICE_ARN}/activity"
echo ""

# Wait for deployment to complete
sleep 30

echo "🧪 Step 5: Health Check"
echo "----------------------"
HEALTH_URL="https://api.daadaar.com/api/health"
echo "Checking: ${HEALTH_URL}"

for i in {1..10}; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${HEALTH_URL} || echo "000")
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Backend is healthy!"
    break
  else
    echo "   Attempt $i/10: HTTP $HTTP_CODE (waiting 15s...)"
    sleep 15
  fi
done

if [ "$HTTP_CODE" != "200" ]; then
  echo "⚠️  Backend health check failed. Check App Runner logs."
  echo "Continuing anyway..."
fi

echo ""
echo "📸 Step 6: Generate SEO Images for Production Data"
echo "---------------------------------------------------"
echo ""
echo "To generate SEO images, you need to:"
echo "1. Log in as an admin user on https://www.daadaar.com/admin"
echo "2. Get your auth token from browser cookies"
echo "3. Run the batch generation:"
echo ""
echo "curl -X POST https://api.daadaar.com/api/seo/batch-generate \\"
echo "  -H \"Cookie: token=YOUR_ADMIN_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""
echo "OR generate individual entities:"
echo ""
echo "# For specific organization"
echo "curl -X POST https://api.daadaar.com/api/seo/generate-org-image/{uuid}"
echo ""
echo "# For specific individual"
echo "curl -X POST https://api.daadaar.com/api/seo/generate-individual-image/{uuid}"
echo ""
echo "# For specific report"
echo "curl -X POST https://api.daadaar.com/api/seo/generate-report-image/{uuid}"
echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "Next Steps:"
echo "1. Generate SEO images (see commands above)"
echo "2. Test social media sharing:"
echo "   - Share a link on Twitter/X"
echo "   - Use Twitter Card Validator: https://cards-dev.twitter.com/validator"
echo "   - Use Facebook Debugger: https://developers.facebook.com/tools/debug/"
echo ""
echo "Documentation: docs/seo-images.md"
