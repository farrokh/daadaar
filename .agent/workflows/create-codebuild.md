---
description: How to create a new CodeBuild project for running authorized tasks (like database migrations) in a VPC
---

# Creating a CodeBuild Project for VPC Tasks

Use this workflow when you need to run one-off or scheduled tasks (like DB migrations, seeds, or scripts) that require access to private VPC resources (RDS, Redis, etc.).

## 1. Create IAM Role

Create a service role that allows CodeBuild to act on your behalf.
Save this trust policy to `trust-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "codebuild.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Run:
```bash
aws iam create-role --role-name daadaar-codebuild-migrations-role --assume-role-policy-document file://trust-policy.json
```

Attach policies for logging, VPC access, ECR, and Secrets Manager:
```bash
# Basic permissions
aws iam attach-role-policy --role-name daadaar-codebuild-migrations-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSCodeBuildAdminAccess

# VPC Access (Create ENI)
aws iam attach-role-policy --role-name daadaar-codebuild-migrations-role --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

# Custom policy for Secrets Manager (if needed)
# Create a policy allowing secretsmanager:GetSecretValue for your secrets
```

## 2. Identify Network Configuration

You need:
1. **VPC ID**: The VPC where your target resource (e.g., RDS) lives.
2. **Subnets**: Private subnets with NAT Gateway (so CodeBuild can pull images from ECR) OR specific VPC endpoints.
3. **Security Group**: A security group that is allowed ingress in your RDS security group.

Example retrieval:
```bash
# Get VPC ID
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=daadaar-prod-vpc"

# Get Private Subnets
aws ec2 describe-subnets --filters "Name=vpc-id,Values=<VPC_ID>" "Name=tag:Name,Values=*private*"

# Get Security Group
aws ec2 create-security-group --group-name daadaar-codebuild-sg --description "SG for CodeBuild" --vpc-id <VPC_ID>
```

## 3. Create CodeBuild Project

Use the `create-project` command. Replace placeholders with your actual values.

```bash
aws codebuild create-project \
  --name daadaar-migrations \
  --description "Runs database migrations for Daadaar" \
  --source "type=NO_SOURCE,buildspec=$(cat infrastructure/aws/codebuild-migrations.buildspec.yml)" \
  --artifacts "type=NO_ARTIFACTS" \
  --environment "type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_SMALL,privilegedMode=true,environmentVariables=[{name=DATABASE_URL,value=daadaar/prod/database-url:DATABASE_URL,type=SECRETS_MANAGER},{name=IMAGE_URI,value=<ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/daadaar-backend:latest}]" \
  --service-role arn:aws:iam::<ACCOUNT_ID>:role/daadaar-codebuild-migrations-role \
  --vpc-config "vpcId=<VPC_ID>,subnets=[<SUBNET_1>,<SUBNET_2>],securityGroupIds=[<SG_ID>]" \
  --region us-east-1
```

## 4. Maintenance

### Updating Buildspec
To update the build commands without recreating the project:
1. Update `infrastructure/aws/codebuild-migrations.buildspec.yml`.
2. Convert to JSON string (be careful with escaping).
3. Run:
   ```bash
   aws codebuild update-project --name daadaar-migrations --source type=NO_SOURCE,buildspec="$(cat infrastructure/aws/codebuild-migrations.buildspec.yml)"
   ```

### Troubleshooting
- **Phase PULL_IMAGE Failed**: Check `privilegedMode=true` (needed for Docker-in-Docker) or NAT Gateway implementation.
- **Connection Timeout**: Check Security Groups. The CodeBuild SG must be allowed in the RDS SG.
