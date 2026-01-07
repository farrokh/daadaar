# SMTP Timeout Issue (Resolved)

**Date:** 2026-01-05  
**Status:** RESOLVED

---

## Summary

App Runner runs inside a VPC to reach private RDS/Redis. Without a NAT gateway, it cannot reach public SMTP endpoints, which caused `ETIMEDOUT` on signup email sends.

**Resolution:** Switched to Amazon SES SMTP via a VPC interface endpoint (`email-smtp`), so email delivery stays inside the AWS network with no NAT cost.

---

## Current Configuration

**SMTP (SES):**
- `SMTP_HOST=email-smtp.us-east-1.amazonaws.com`
- `SMTP_PORT=587`
- `SMTP_USER=<SES SMTP access key>`
- `SMTP_PASS=<SES SMTP password>`
- Credentials stored in `.aws/.ses_smtp_credentials` (gitignored)

**VPC Endpoint:**
- `com.amazonaws.us-east-1.email-smtp` (interface endpoint)

**App Runner:**
- Egress uses the VPC connector to reach SES, RDS, and Redis privately.

**Slack Notifications:**
- Sent via Lambda (`daadaar-slack-notifier`) to avoid NAT for outbound webhooks.

---

## Verification

```bash
# Health check
curl -sS https://api.daadaar.com/health

# App health (DB/Redis)
curl -sS https://api.daadaar.com/api/health

# Tail App Runner logs for email send results
aws logs tail /aws/apprunner/daadaar-backend/0b296bcf4db24ce5a37e2c2cb202577e/application \
  --since 5m --region us-east-1 | rg -i "email|smtp"
```

---

## Notes

- If SES is in sandbox, only verified recipients can receive emails.
- If SMTP credentials are rotated, update App Runner env vars and `.aws/.ses_smtp_credentials`, then redeploy.
