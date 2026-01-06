# 🚨 CRITICAL: SMTP Timeout Issue

**Date:** 2026-01-05  
**Status:** ❌ **BLOCKING SIGNUP**

---

## Problem

Signup is hanging/slow because SMTP connection times out:

```
Error sending email: Connection timeout
command: "CONN"
code: "ETIMEDOUT"
```

**Impact:** Users cannot complete registration (waiting minutes, no email received)

---

## Root Cause

App Runner uses **VPC egress** to access RDS/Redis, but this VPC has **no NAT Gateway**, so it cannot reach the internet for SMTP (smtp-relay.brevo.com:587).

```
App Runner → VPC Connector → Private Subnet → ❌ No route to internet
```

---

## Solutions (Pick One)

### Option 1: Add NAT Gateway (Recommended for Production) 💰 ~$32/month

**Pros:**
- ✅ Keeps RDS/Redis private (secure)
- ✅ App Runner can access internet
- ✅ No security group changes needed

**Cons:**
- ❌ Costs $32/month + data transfer
- ⏱️ Takes 15 minutes to set up

**Steps:**
1. Create NAT Gateway in public subnet
2. Update private subnet route table to route 0.0.0.0/0 → NAT Gateway
3. Redeploy App Runner (automatic)

---

### Option 2: Use Amazon SES (Best Long-term) ✅ RECOMMENDED

**Pros:**
- ✅ FREE (62,000 emails/month from App Runner)
- ✅ No NAT Gateway needed (uses VPC endpoint)
- ✅ Better AWS integration
- ✅ Higher deliverability

**Cons:**
- ⏱️ Requires domain verification
- ⏱️ 15-30 min setup

**Steps:**
1. Create SES VPC endpoint in your VPC
2. Verify daadaar.com domain in SES
3. Update SMTP settings:
   ```bash
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=<SES-SMTP-username>
   SMTP_PASS=<SES-SMTP-password>
   ```
4. Redeploy App Runner

**Cost:** $0.10 per 1,000 emails after free tier

---

### Option 3: Remove VPC Connector (Quick BUT risky) ⚠️

**Pros:**
- ✅ Immediate fix for SMTP
- ✅ No cost

**Cons:**
- ❌ RDS/Redis must allow public access OR
- ❌ Must update security groups to allow App Runner IPs
- ⚠️ Less secure

**NOT RECOMMENDED** - RDS is currently private

---

### Option 4: Quick Workaround - Use Async Email Queue

**Pros:**
- ✅ Signup completes instantly
- ✅ Emails sent in background

**Cons:**
- ⏱️ Requires code changes
- ⏱️ Requires BullMQ setup

---

## Immediate Action Required

**Best path forward:**

### STEP 1: Switch to Amazon SES (30 minutes)

```bash
# 1. Create SES SMTP credentials
aws sesv2 create-email-identity \
  --email-identity daadaar.com \
  --region us-east-1

# 2. Verify domain (add DNS records)
# Follow AWS console instructions

# 3. Create SMTP credentials
# AWS Console → SES → SMTP Settings → Create SMTP Credentials

# 4. Create VPC endpoint for SES
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-0e9cd2c204069ca54 \
  --service-name com.amazonaws.us-east-1.email-smtp \
  --vpc-endpoint-type Interface \
  --subnet-ids subnet-058489269eab00608 subnet-0a836887b9508ed97 \
  --security-group-ids <VPC-ENDPOINT-SG> \
  --region us-east-1

# 5. Update App Runner env vars
python3 update-app-runner.py
# (Use SES SMTP credentials)
```

### STEP 2: OR Add NAT Gateway (if you prefer Brevo)

```bash
# 1. Create NAT Gateway
aws ec2 create-nat-gateway \
  --subnet-id <PUBLIC-SUBNET-ID> \
  --allocation-id <ELASTIC-IP-ALLOCATION-ID>

# 2. Update route table for private subnets
aws ec2 create-route \
  --route-table-id <PRIVATE-ROUTE-TABLE-ID> \
  --destination-cidr-block 0.0.0.0/0 \
  --nat-gateway-id <NAT-GATEWAY-ID>

# 3. Wait 5 minutes, then test
```

---

## Testing

After implementing solution:

```bash
# Test signup
curl -X POST https://api.daadaar.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "testpass123"
  }'

# Check logs (should see "Email sent:" not "Connection timeout")
aws logs tail /aws/apprunner/daadaar-backend/0b296bcf4db24ce5a37e2c2cb202577e/application \
  --since 2m --region us-east-1 | grep -i email
```

---

## Why This Happened

1. ✅ SMTP env vars configured correctly
2. ✅ Brevo credentials valid
3. ❌ **VPC has no internet access** (no NAT Gateway)
4. ❌ App Runner trying to reach internet through VPC → timeout

**Network Path:**
```
App Runner → VPC Connector → Private Subnet → 
No NAT → No Route to Internet → TIMEOUT
```

---

## Decision Matrix

| Solution | Cost | Time | Security | Recommendation |
|----------|------|------|----------|----------------|
| **Amazon SES** | Free/Cheap | 30 min | ⭐⭐⭐⭐⭐ | ✅ **BEST** |
| **NAT Gateway** | $32/mo | 15 min | ⭐⭐⭐⭐⭐ | ✅ Good |
| **Remove VPC** | Free | 5 min | ⭐⭐ | ❌ Not recommended |
| **Async Queue** | Free | 2 hours | ⭐⭐⭐⭐ | ⚠️ Temporary fix |

---

## Next Steps

**Choose one:**

**A. Amazon SES (Recommended)**
1. Run: `./setup-ses.sh` (I'll create this script)
2. Update App Runner with SES credentials
3. Test signup

**B. NAT Gateway**
1. Create NAT Gateway in AWS Console
2. Update route table
3. Test signup

**C. Tell me your preference** and I'll implement it

---

## Files Created

- `fix-apprunner-network.py` - Remove VPC connector (NOT recommended)
- `SMTP_TIMEOUT_ISSUE.md` - This file

---

**Status:** ⏸️ **WAITING FOR DECISION**  
**Blocking:** User signup  
**Recommended:** Switch to Amazon SES
