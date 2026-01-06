# 📚 Daadaar Documentation Index

**Last Updated:** 2026-01-05

---

## 🎯 Quick Start Guides

| Document | Purpose | Audience |
|----------|---------|----------|
| [SIGNUP_QUICK_FIX.md](./SIGNUP_QUICK_FIX.md) | Quick reference for signup email issue | Ops/DevOps |
| [CODEBUILD_DATABASE_OPS.md](./CODEBUILD_DATABASE_OPS.md) | Database operations via CodeBuild | DevOps/Backend |

---

## 🏗️ Architecture

### Core Architecture
| Document | Description |
|----------|-------------|
| [architecture/README.md](./architecture/README.md) | Architecture overview |
| [architecture/backend.md](./architecture/backend.md) | Backend API architecture |
| [architecture/frontend.md](./architecture/frontend.md) | Frontend application architecture |
| [architecture/data.md](./architecture/data.md) | Data model and relationships |
| [architecture/infrastructure.md](./architecture/infrastructure.md) | AWS infrastructure and deployment |
| [architecture/security.md](./architecture/security.md) | Security practices and policies |
| [architecture/roadmap.md](./architecture/roadmap.md) | Future plans and features |

---

## 🔧 Implementation Guides

### Features
| Document | Feature | Status |
|----------|---------|--------|
| [SIGNUP_IMPLEMENTATION.md](./SIGNUP_IMPLEMENTATION.md) | User registration/signup | ✅ Complete |
| [VOTING_IMPLEMENTATION.md](./VOTING_IMPLEMENTATION.md) | Voting mechanics | ✅ Complete |
| [CONTENT_REPORTING_PLAN.md](./CONTENT_REPORTING_PLAN.md) | Content reporting system | ✅ Complete |
| [END_DATE_IMPLEMENTATION.md](./END_DATE_IMPLEMENTATION.md) | Role end dates | ✅ Complete |
| [IMAGE_UPLOAD_FORMAT.md](./IMAGE_UPLOAD_FORMAT.md) | AVIF image handling | ✅ Complete |

### Infrastructure
| Document | Component | Status |
|----------|-----------|--------|
| [CDN_CONFIGURATION.md](./CDN_CONFIGURATION.md) | Cloudflare CDN setup | ✅ Complete |
| [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) | Frontend deployment | ✅ Complete |
| [CODEBUILD_DATABASE_OPS.md](./CODEBUILD_DATABASE_OPS.md) | Database operations | ✅ Complete |
| [SES_SETUP_GUIDE.md](./SES_SETUP_GUIDE.md) | Amazon SES Configuration | ✅ Complete |

---

## 🐛 Issue Resolutions

### Recent Fixes
| Document | Issue | Resolution Date | Status |
|----------|-------|-----------------|--------|
| [SIGNUP_FIX_COMPLETE.md](./SIGNUP_FIX_COMPLETE.md) | Initial Email/Slack fix | 2026-01-05 | ✅ Fixed |
| [SMTP_TIMEOUT_ISSUE.md](./SMTP_TIMEOUT_ISSUE.md) | SMTP Connection Timeouts | 2026-01-05 | ✅ Fixed (Migrated to SES) |
| [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) | Sensitive data exposure check | 2026-01-05 | ✅ Clean |


---

## 📝 Development Guidelines

### Contributing
| Document | Purpose |
|----------|---------|
| [CONTRIBUTING_BACKEND.md](./CONTRIBUTING_BACKEND.md) | Backend development guide |
| [CONTRIBUTING_FRONTEND.md](./CONTRIBUTING_FRONTEND.md) | Frontend development guide |
| [TRANSLATION_KEYS.md](./TRANSLATION_KEYS.md) | Translation key documentation |

### Testing
| Document | Purpose |
|----------|---------|
| [CONTENT_REPORTING_TESTING.md](./CONTENT_REPORTING_TESTING.md) | Content reporting test guide |

---

## 🚀 Operational Guides

### Deployment
| Task | Documentation | Script/Command |
|------|---------------|----------------|
| Deploy Backend | [architecture/infrastructure.md](./architecture/infrastructure.md) | `update-app-runner.py` |
| Deploy Frontend | [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) | Vercel auto-deploy |
| Run Migrations | [CODEBUILD_DATABASE_OPS.md](./CODEBUILD_DATABASE_OPS.md) | CodeBuild |
| Update Env Vars | [SIGNUP_FIX_COMPLETE.md](./SIGNUP_FIX_COMPLETE.md) | `update-app-runner.py` |

### Maintenance
| Task | Documentation | Script/Command |
|------|---------------|----------------|
| Clean Up Users | [CODEBUILD_DATABASE_OPS.md](./CODEBUILD_DATABASE_OPS.md) | `run-cleanup-codebuild.py` |
| Monitor Logs | [architecture/infrastructure.md](./architecture/infrastructure.md) | AWS CloudWatch |
| Health Checks | [architecture/infrastructure.md](./architecture/infrastructure.md) | `/health`, `/api/health` |

---

## 🔐 Security

### Security Documentation
| Document | Purpose | Last Review |
|----------|---------|-------------|
| [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) | Security audit results | 2026-01-05 |
| [architecture/security.md](./architecture/security.md) | Security architecture | 2026-01-04 |

### Secrets Management
| Secret | Location | Purpose |
|--------|----------|---------|
| Database credentials | `.aws/.prod_db_creds` | RDS access |
| JWT/Session secrets | `.aws/.prod_env_secrets` | Auth tokens |
| SMTP credentials | `.aws/.smtp_credentials` | Email sending |
| All production secrets | AWS Secrets Manager | Secure storage |

**⚠️ All secret files are gitignored**

---

## 📊 Session Summaries

| Date | Summary | Link |
|------|---------|------|
| 2026-01-05 | Signup fix + CodeBuild setup | [SESSION_SUMMARY.md](./SESSION_SUMMARY.md) |
| 2026-01-04 | Content reporting & logos | [session-summaries/2026-01-04-content-reporting-and-logos.md](./session-summaries/2026-01-04-content-reporting-and-logos.md) |

---

## 🎨 Design & UX

### Current Implementation
- **Design System**: Glassmorphism with liquid glass effects
- **Colors**: HSL-based custom palette
- **Typography**: Modern sans-serif fonts
- **Responsive**: Mobile-first design
- **i18n**: English and Persian (Farsi) support

---

## 🔗 External Resources

### Services
| Service | Purpose | Dashboard |
|---------|---------|-----------|
| Brevo | Email sending (SMTP) | https://app.brevo.com |
| AWS | Infrastructure | https://console.aws.amazon.com |
| Vercel | Frontend hosting | https://vercel.com/dashboard |
| Cloudflare | CDN & DNS | https://dash.cloudflare.com |

### Tools
| Tool | Purpose |
|------|---------|
| Drizzle ORM | Database schema & migrations |
| Nodemailer | Email transport |
| BullMQ | Background job queue |
| PostHog | Analytics |
| Sentry | Error tracking |

---

## 📍 File Locations

### Root Scripts
```
/update-app-runner.py           - Update App Runner env vars
/monitor-deployment.sh          - Monitor deployment status  
/run-cleanup-codebuild.py       - Run database cleanup
/cleanup-users.py               - Local cleanup script
/cleanup-users.sql              - SQL cleanup script
/update-codebuild-iam.py        - Update CodeBuild IAM
```

### Infrastructure
```
/infrastructure/aws/
  ├── codebuild-migrations.buildspec.yml
  ├── cleanup-users-buildspec.yml
  └── (other AWS configs)
```

### Backend
```
/backend/src/
  ├── lib/email.ts              - Email service
  ├── lib/slack.ts              - Slack notifications
  ├── lib/redis.ts              - Redis client
  ├── lib/pow-validator.ts      - Proof of work
  ├── controllers/              - API controllers
  └── middleware/               - Express middleware
```

### Frontend
```
/frontend/
  ├── app/[locale]/             - Next.js pages
  ├── components/               - React components
  ├── lib/                      - Utilities
  └── messages/                 - i18n translations
```

---

## 🆘 Troubleshooting

### Common Issues
| Issue | Documentation | Quick Fix |
|-------|---------------|-----------|
| No emails sending | [SIGNUP_FIX_COMPLETE.md](./SIGNUP_FIX_COMPLETE.md) | Check SMTP env vars |
| CodeBuild timeout | [CODEBUILD_DATABASE_OPS.md](./CODEBUILD_DATABASE_OPS.md) | Check VPC endpoints |
| RDS connection fails | [architecture/infrastructure.md](./architecture/infrastructure.md) | Check security groups |
| Signup slow | [SIGNUP_ISSUE_RESOLUTION.md](./SIGNUP_ISSUE_RESOLUTION.md) | SMTP configuration |

---

## 📈 Current Status

### Production Services
- ✅ Backend API: https://api.daadaar.com
- ✅ Frontend: https://www.daadaar.com
- ✅ Media CDN: https://media.daadaar.com
- ✅ Database: RDS PostgreSQL (private)
- ✅ Cache: ElastiCache Redis (private)

### Recent Updates (2026-01-05)
- ✅ Email service configured (Brevo SMTP)
- ✅ Slack notifications enabled
- ✅ CodeBuild database operations working
- ✅ Security audit passed
- ✅ Documentation updated

---

## 🔄 Next Steps

1. Test complete signup flow end-to-end
2. Run database migrations via CodeBuild
3. Clean up test users
4. Set up monitoring alerts
5. Configure domain authentication (SPF/DKIM)

---

**For questions or issues, see the relevant documentation above or check the troubleshooting section.**
