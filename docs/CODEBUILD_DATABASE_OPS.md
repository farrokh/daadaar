# CodeBuild VPC Database Operations

**Last Updated:** 2026-01-05  
**Status:** ✅ WORKING

---

## Overview

We use **AWS CodeBuild** running inside our VPC to perform database operations that require direct access to RDS (which is not publicly accessible for security).

**Use Cases:**
- Running database migrations
- Database cleanup/maintenance tasks
- Emergency database operations
- Data seeding

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CodeBuild                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Build Container (VPC-enabled)                     │     │
│  │  - Python 3.11                                    │     │
│  │  - psycopg2-binary                                │     │
│  │  - boto3                                          │     │
│  └──────────────┬─────────────────────────────────────┘     │
│                 │                                            │
│                 │ VPC Network                                │
│                 │                                            │
│     ┌───────────▼──────────┐        ┌──────────────────┐   │
│     │  VPC Endpoints       │        │  RDS PostgreSQL  │   │
│     │  - Secrets Manager   │        │  (Private)       │   │
│     │  - CloudWatch Logs   │◄───────┤  Port 5432       │   │
│     │  - ECR              │        └──────────────────┘   │
│     └─────────────────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Setup

### 1. VPC Endpoints (Required)

For CodeBuild to work in a private VPC, these endpoints must be created:

```bash
# Secrets Manager (interface endpoint)
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-0e9cd2c204069ca54 \
  --service-name com.amazonaws.us-east-1.secretsmanager \
  --vpc-endpoint-type Interface \
  --subnet-ids subnet-058489269eab00608 subnet-0a836887b9508ed97 \
  --security-group-ids sg-ENDPOINT-SG \
  --region us-east-1

# CloudWatch Logs (interface endpoint)
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-0e9cd2c204069ca54 \
  --service-name com.amazonaws.us-east-1.logs \
  --vpc-endpoint-type Interface \
  --subnet-ids subnet-058489269eab00608 subnet-0a836887b9508ed97 \
  --security-group-ids sg-ENDPOINT-SG \
  --region us-east-1

# ECR API (interface endpoint)
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-0e9cd2c204069ca54 \
  --service-name com.amazonaws.us-east-1.ecr.api \
  --vpc-endpoint-type Interface \
  --subnet-ids subnet-058489269eab00608 subnet-0a836887b9508ed97 \
  --security-group-ids sg-ENDPOINT-SG \
  --region us-east-1

# ECR DKR (interface endpoint)
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-0e9cd2c204069ca54 \
  --service-name com.amazonaws.us-east-1.ecr.dkr \
  --vpc-endpoint-type Interface \
  --subnet-ids subnet-058489269eab00608 subnet-0a836887b9508ed97 \
  --security-group-ids sg-ENDPOINT-SG \
  --region us-east-1

# S3 (gateway endpoint - for ECR images)
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-0e9cd2c204069ca54 \
  --service-name com.amazonaws.us-east-1.s3 \
  --route-table-ids rtb-XXXXXXXXX \
  --region us-east-1
```

**Security Group Rules:**
- VPC endpoint security group must allow inbound 443 from CodeBuild security group
- CodeBuild security group must allow outbound 443 to VPC endpoints
- CodeBuild security group must allow outbound 5432 to RDS security group

### 2. Secrets Manager

Store database credentials securely:

```bash
# Database connection string (for migrations)
aws secretsmanager create-secret \
  --name daadaar/prod/database-url \
  --secret-string "postgresql://daadaar_admin:XXXXXXXX@daadaar-prod.cq5go4qemamj.us-east-1.rds.amazonaws.com:5432/daadaar?sslmode=require" \
  --region us-east-1

# Database password only (for other scripts)
aws secretsmanager create-secret \
  --name daadaar/prod/db-password \
  --secret-string "XXXXXXXX" \
  --region us-east-1
```

### 3. IAM Role

The CodeBuild service role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateNetworkInterface",
        "ec2:CreateNetworkInterfacePermission",
        "ec2:DescribeDhcpOptions",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DescribeNetworkInterfaceAttribute",
        "ec2:DeleteNetworkInterface",
        "ec2:DescribeSubnets",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeVpcs",
        "ec2:DescribeRouteTables",
        "ec2:DescribeNetworkAcls",
        "ec2:DescribeAvailabilityZones"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:daadaar/prod/database-url*",
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:daadaar/prod/db-password*"
      ]
    }
  ]
}
```

**Update existing role:**
```bash
python3 update-codebuild-iam.py
```

---

## CodeBuild Project Configuration

**Project:** `daadaar-migrations`

```json
{
  "name": "daadaar-migrations",
  "source": {
    "type": "NO_SOURCE"
  },
  "environment": {
    "type": "LINUX_CONTAINER",
    "image": "aws/codebuild/standard:7.0",
    "computeType": "BUILD_GENERAL1_SMALL",
    "privilegedMode": true,
    "environmentVariables": [
      {
        "name": "DATABASE_URL",
        "value": "daadaar/prod/database-url:DATABASE_URL",
        "type": "SECRETS_MANAGER"
      }
    ]
  },
  "serviceRole": "daadaar-codebuild-migrations-role",
  "vpcConfig": {
    "vpcId": "vpc-0e9cd2c204069ca54",
    "subnets": [
      "subnet-058489269eab00608",
      "subnet-0a836887b9508ed97"
    ],
    "securityGroupIds": [
      "sg-0b55ecfafd3522b27"
    ]
  }
}
```

---

## Usage

### 1. Run Database Migrations

```bash
aws codebuild start-build \
  --project-name daadaar-migrations \
  --region us-east-1 \
  --buildspec-override file://infrastructure/aws/codebuild-migrations.buildspec.yml \
  --environment-variables-override name=RUN_MIGRATIONS,value=true,type=PLAINTEXT
```

### 2. Clean Up Test Users

```bash
# Using Python script (recommended)
python3 run-cleanup-codebuild.py

# Or manually
aws codebuild start-build \
  --project-name daadaar-migrations \
  --region us-east-1 \
  --buildspec-override file://infrastructure/aws/cleanup-users-buildspec.yml
```

### 3. Seed Database (Optional)

```bash
aws codebuild start-build \
  --project-name daadaar-migrations \
  --region us-east-1 \
  --buildspec-override file://infrastructure/aws/codebuild-migrations.buildspec.yml \
  --environment-variables-override \
    name=RUN_MIGRATIONS,value=true,type=PLAINTEXT \
    name=RUN_SEED,value=true,type=PLAINTEXT
```

### 4. Backfill Latest Individual Role

This assigns the default **Member** role to the latest individual who has no role occupancy.

```bash
aws codebuild start-build \
  --project-name daadaar-migrations \
  --region us-east-1 \
  --buildspec-override file://infrastructure/aws/backfill-latest-individual-member-role.buildspec.yml \
  --environment-variables-override \
    name=ORGANIZATION_ID,value=123,type=PLAINTEXT
```

Optional overrides:
- `ORGANIZATION_NAME` (exact match on name or nameEn)
- `INDIVIDUAL_ID` (target a specific individual instead of latest)

---

## Buildspec Files

### Migration Buildspec
**File:** `infrastructure/aws/codebuild-migrations.buildspec.yml`

```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo "Pulling Docker image..."
      - aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
      - docker pull $IMAGE_URI

  build:
    commands:
      - |
        if [ "$RUN_MIGRATIONS" = "true" ]; then
          echo "Running database migrations..."
          docker run --rm \
            -e DATABASE_URL=$DATABASE_URL \
            $IMAGE_URI \
            bun /usr/src/app/backend/drizzle/migrate.ts
        fi
      - |
        if [ "$RUN_SEED" = "true" ]; then
          echo "Running database seed..."
          docker run --rm \
            -e DATABASE_URL=$DATABASE_URL \
            $IMAGE_URI \
            bun /usr/src/app/backend/drizzle/seed.ts
        fi
```

### Cleanup Buildspec
**File:** `infrastructure/aws/cleanup-users-buildspec.yml`

See file for full implementation - installs Python deps and runs cleanup script.

---

## Troubleshooting

### Issue: Timeouts connecting to Secrets Manager

**Symptom:**
```
dial tcp 18.214.158.206:443: i/o timeout
```

**Cause:** VPC endpoint for Secrets Manager not available or misconfigured

**Solution:**
1. Check endpoint status:
   ```bash
   aws ec2 describe-vpc-endpoints \
     --filters "Name=service-name,Values=com.amazonaws.us-east-1.secretsmanager" \
     --query 'VpcEndpoints[*].{ID:VpcEndpointId,State:State}' \
     --region us-east-1
   ```

2. Ensure endpoint is `available`
3. Check security group allows 443 from CodeBuild SG
4. Verify subnets match CodeBuild subnets

### Issue: AccessDeniedException for Secrets Manager

**Symptom:**
```
User: arn:aws:sts::XXX:assumed-role/daadaar-codebuild-migrations-role/XXX 
is not authorized to perform: secretsmanager:GetSecretValue
```

**Solution:**
Update IAM policy to include the secret ARN:
```bash
python3 update-codebuild-iam.py
```

### Issue: Can't connect to RDS

**Symptom:**
```
connection to server at "daadaar-prod.xxx.rds.amazonaws.com" failed: timeout
```

**Solution:**
1. Verify RDS security group allows inbound 5432 from CodeBuild SG
2. Check CodeBuild is in same VPC as RDS
3. Ensure subnets have route to RDS (usually same VPC is enough)

---

## Monitoring

### View Build Status

```bash
# List recent builds
aws codebuild list-builds-for-project \
  --project-name daadaar-migrations \
  --region us-east-1

# Get build details
aws codebuild batch-get-builds \
  --ids BUILD_ID \
  --region us-east-1
```

### View Logs

```bash
# Tail logs
aws logs tail /aws/codebuild/daadaar-migrations \
  --follow \
  --region us-east-1

# View specific time range
aws logs tail /aws/codebuild/daadaar-migrations \
  --since 30m \
  --region us-east-1
```

---

## Scripts

### update-codebuild-iam.py
Updates IAM role policy to include Secrets Manager permissions.

### run-cleanup-codebuild.py
Starts CodeBuild job to clean up test users and monitors progress.

### cleanup-users.py
Local script to clean up users (requires VPC access or bastion).

---

## Security Considerations

1. **No Public Access:** RDS is not publicly accessible
2. **VPC Endpoints:** All AWS service communication stays within AWS network
3. **Secrets Manager:** Credentials never exposed in logs or code
4. **IAM Least Privilege:** CodeBuild role has minimal required permissions
5. **Network Isolation:** CodeBuild runs in private subnets

---

## Cost Optimization

- **Build Time:** Most operations complete in < 2 minutes
- **Compute:** Using `BUILD_GENERAL1_SMALL` (cheapest option)
- **Free Tier:** First 100 build minutes/month are free
- **Estimated Cost:** ~$0.01 per build after free tier

---

## Next Steps

1. ✅ VPC endpoints created and available
2. ✅ Secrets stored in Secrets Manager
3. ✅ IAM role configured with proper permissions
4. ✅ CodeBuild project created and tested
5. ⏭️ Set up automated migration on deployment
6. ⏭️ Add database backup verification before migrations

---

**Last Successful Build:** 2026-01-05 (cleanup-users)  
**Status:** ✅ Operational
