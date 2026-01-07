# Amazon SES Setup - Step by Step

**Status:** ✅ Complete  
**Purpose:** Operational reference for Amazon SES SMTP in production

---

## ✅ Completed Steps

1. **Created SES Email Identity** ✅
   - Domain: daadaar.com
   - DKIM tokens generated

2. **Created SMTP Credentials** ✅
   - IAM user: ses-smtp-user-daadaar
   - SMTP password generated
   - Saved to: `.aws/.ses_smtp_credentials`

---

## 📋 Verification (Completed)

### Step 1: DNS Records (Completed)

**Go to:** https://dash.cloudflare.com → daadaar.com → DNS

**Add these 3 CNAME records:**

```
Record 1:
  Type: CNAME
  Name: fght6ammm3f4eiufbnztcevhx564o3eb._domainkey
  Target: fght6ammm3f4eiufbnztcevhx564o3eb.dkim.amazonses.com
  Proxy: DNS only (gray cloud)
  TTL: Auto

Record 2:
  Type: CNAME
  Name: tmzsu7qoarfq4nwg6cxweiovw5ch4zph._domainkey
  Target: tmzsu7qoarfq4nwg6cxweiovw5ch4zph.dkim.amazonses.com
  Proxy: DNS only (gray cloud)
  TTL: Auto

Record 3:
  Type: CNAME
  Name: gc7x53ie2un3l5ujfjx5qqcispamw7cp._domainkey
  Target: gc7x53ie2un3l5ujfjx5qqcispamw7cp.dkim.amazonses.com
  Proxy: DNS only (gray cloud)
  TTL: Auto
```

**⚠️ Important:** Set proxy to "DNS only" (gray cloud icon), NOT proxied (orange cloud)

---

### Step 2: Wait for Verification (5-10 minutes)

After adding the DNS records, wait 5-10 minutes, then verify in the SES console:
- SES → Verified identities → `daadaar.com` should be **Verified**

---

### Step 3: Update App Runner (if credentials rotate)

Use `.aws/update-app-runner.py` to update SMTP env vars when credentials change.

---

 ### Step 4: Private Network Configuration (VPC Endpoint)

Since our VPC has no public internet access (no NAT Gateway), we use a **VPC Interface Endpoint** to talk to Amazon SES privately.

- **Service Name**: `com.amazonaws.us-east-1.email-smtp`
- **Security Group**: `sg-0b55ecfafd3522b27`
- **Port Allowed**: `587` (SMTP STARTTLS)
- **Status**: ✅ Active and Tested

**Why?**
Without this endpoint, App Runner would timeout trying to reach `email-smtp.us-east-1.amazonaws.com` because it cannot reach the public internet from our private subnets.

---

## 🎯 Important: Slack Notifications

Slack notifications require public internet. Since we don't have a NAT Gateway yet, we have implemented a **2-second "Fast-Fail"** in the backend. 
- The backend will try to ping Slack for 2 seconds.
- If it fails (expected), it will log a warning and **immediately proceed** with the signup.
- **Result**: No more "forever" hangs for the user! 🚀

**Benefits:**
- ✅ No NAT Gateway needed (saves $32/month)
- ✅ More free emails (62,000/month vs 300/day)
- ✅ Better AWS integration
- ✅ Emails sent privately within AWS network

---

## 📊 SES Credentials (Saved)

**Location:** `.aws/.ses_smtp_credentials` (Gitignored)

```
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=REDACTED_CHECK_LOCAL_SECRET_FILE
SMTP_PASS=REDACTED_CHECK_LOCAL_SECRET_FILE
```


---

## 🧪 Testing

After deployment completes (3-5 minutes):

1. **Test signup:**
   ```
   https://www.daadaar.com/en/signup
   ```

2. **Check logs:**
   ```bash
   aws logs tail /aws/apprunner/daadaar-backend/0b296bcf4db24ce5a37e2c2cb202577e/application \
     --since 2m --region us-east-1 | grep -i email
   ```

3. **Should see:**
   ```
   Email sent: <message-id>
   ```
   **NOT:** `Connection timeout`

---

## 🔧 Helper Scripts

| Script | Purpose |
|--------|---------|
| `.aws/update-app-runner.py` | Update App Runner env vars (SMTP, Slack, core config) |

---

## ⏱️ Timeline

- ✅ **Setup SES:** Done (2 minutes)
- ⏳ **Add DNS records:** You (3 minutes)
- ⏳ **DNS propagation:** Automatic (5-10 minutes)
- ⏳ **Deploy to App Runner:** Automatic (3-5 minutes)
- **Total:** ~15-20 minutes

---

## 🆘 Troubleshooting

**If verification fails:**
```bash
# Check DNS records
dig fght6ammm3f4eiufbnztcevhx564o3eb._domainkey.daadaar.com CNAME

# Should show:
fght6ammm3f4eiufbnztcevhx564o3eb.dkim.amazonses.com
```

**If still timeout after SES:**
- Check App Runner logs for different error
- Verify SES credentials are correct
- Ensure domain is verified

---

**Current Status:** ✅ **Verified and active**

**Next Action:** Only revisit if SMTP credentials rotate or SES identity changes.
