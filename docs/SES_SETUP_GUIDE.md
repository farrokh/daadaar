# Amazon SES Setup - Step by Step

**Status:** 🔄 In Progress  
**Purpose:** Fix SMTP timeout issue by switching from Brevo to Amazon SES

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

## 📋 Next Steps (You Need to Do)

### Step 1: Add DNS Records to Cloudflare ⏳

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

After adding the DNS records, wait 5-10 minutes, then check:

```bash
python3 check-ses-verification.py
```

**Expected output when ready:**
```
✅ Domain is VERIFIED and ready to send emails!
```

---

### Step 3: Update App Runner

Once verified, run:

```bash
python3 update-apprunner-ses.py
```

This will:
- Switch SMTP from Brevo to Amazon SES
- Deploy new configuration
- Fix the timeout issue

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
| `show-ses-dns-records.py` | Display DNS records to add |
| `check-ses-verification.py` | Check if domain is verified |
| `generate-ses-smtp-credentials.py` | Show SMTP credentials |
| `update-apprunner-ses.py` | Deploy SES to App Runner |

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

**Current Status:** ⏳ **Waiting for you to add DNS records to Cloudflare**

**Next Action:** Add the 3 CNAME records shown above to Cloudflare DNS
