# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 🔒 Private Disclosure

**Do NOT open a public issue for security vulnerabilities.**

Instead, please report security issues privately:

1. **GitHub Security Advisories** (Preferred):
   - Go to the [Security tab](https://github.com/farrokh/daadaar/security/advisories)
   - Click "Report a vulnerability"
   - Fill out the form with details

2. **Email**:
   - Contact the maintainers directly (email TBD)
   - Use the subject line: `[SECURITY] Brief description`

### What to Include

Please include the following in your report:

- **Type of vulnerability** (e.g., XSS, SQL injection, authentication bypass)
- **Affected component** (frontend, backend, database, etc.)
- **Steps to reproduce** the vulnerability
- **Potential impact** of the vulnerability
- **Suggested fix** (if you have one)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2-4 weeks
  - Low: Next release

### Scope

The following are in scope:

- ✅ Authentication/authorization bypasses
- ✅ Data exposure or leakage
- ✅ SQL/NoSQL injection
- ✅ Cross-site scripting (XSS)
- ✅ Cross-site request forgery (CSRF)
- ✅ Server-side request forgery (SSRF)
- ✅ Remote code execution
- ✅ Denial of service (application-level)
- ✅ Session management issues
- ✅ Cryptographic weaknesses

The following are out of scope:

- ❌ Social engineering attacks
- ❌ Physical attacks
- ❌ Attacks requiring physical access
- ❌ Denial of service (network-level)
- ❌ Issues in third-party dependencies (report to them directly)
- ❌ Vulnerabilities in outdated versions

## Security Best Practices

### For Contributors

- Never commit secrets, API keys, or credentials
- Use environment variables for sensitive configuration
- Follow secure coding practices
- Review code for security implications before submitting PRs

### For Users

- Keep your installation up to date
- Use strong, unique passwords
- Enable two-factor authentication where available
- Report suspicious activity

## Security Features

Daadaar implements several security measures:

- **Anonymous Sessions**: No personal data collection by default
- **VPN-Friendly**: Session-based rate limiting (not IP-based)
- **Proof-of-Work**: Prevents automated abuse
- **Encryption**: AES-256 for sensitive data at rest
- **HTTPS/TLS**: All communications encrypted
- **CSP Headers**: Content Security Policy protection
- **Input Validation**: All inputs sanitized and validated
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM

## Acknowledgments

We appreciate security researchers who help keep Daadaar safe. Contributors who report valid security issues will be acknowledged (with permission) in our security hall of fame.

---

Thank you for helping keep Daadaar and its users safe! 🛡️

