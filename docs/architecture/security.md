# Security & Privacy Architecture

Security at Daadaar is multi-layered, designed to protect both the platform's integrity and the user's anonymity.

## 🛡️ Defensive Layers

### 1. Proof-of-Work (PoW)
To prevent automated abuse and "sybil attacks" without blocking VPN users via IP-based rate limiting, we implement a cryptographic challenge-response system.
- **Mechanism**: SHA-256 partial hash inversion.
- **Difficulty**: Dynamic based on activity (e.g., 5 leading zeros for reports, 2 for voting).
- **Validation**: The backend recomputes the hash using the provided solution and challenge nonce to ensure legitimacy.

### 2. Session-Based Rate Limiting
Limits are tied to session IDs (anonymous) or User IDs (registered), not IP addresses.
- **Storage**: Tracked in Redis with leaking bucket algorithms.
- **Benefit**: Supports users behind shared VPN IPs while effectively curbing individual abuse.

### 3. CSRF Protection
Custom implementation (`lib/csrf-protection.ts`) using 32-byte tokens with 24-hour expiration.
- **Middleware**: Validates state-changing operations (POST, PUT, DELETE).
- **Automation**: Automatic cleanup of expired tokens via background process.

---

## 👤 Privacy & Anonymity

- **Zero IP Logging**: We explicitly do not log or store user IP addresses. Cloudflare logs are anonymized at the edge.
- **Anonymous Sessions**: Users can fully participate without ever providing an email or name.
- **Session Migration**: Secure one-time migration allows anonymous users to move their identity between devices without registration.

---

## ⚖️ Moderation & Banning System

We maintain platform quality through a tiered moderation system.

### Content Reporting
A universal "Report" button allows the community to flag:
- Incorrect information
- Harassment or spam
- Duplicate entities

### Admin Roles
1. **User**: Standard permissions.
2. **Moderator**: Can review content reports and issue temporary bans.
3. **Admin**: Full system management and permanent banning capabilities.

### Banning Mechanism
- **Registered Users**: ID-based persistent ban.
- **Anonymous Users**: Session ID invalidation. Banned sessions cannot submit reports or vote but can still browse public content.
- **Ban History**: All actions are logged for accountability in the `ban_history` table.

---

## 🔒 API & Infrastructure Security

- **HTTPS/TLS**: Encrypted transit for all data.
- **S3 Server-Side Encryption**: Assets encrypted at rest.
- **Parameterized Queries**: Drizzle ORM prevents SQL injection.
- **Sanitization**: All user-generated content (e.g., Markdown) is sanitized via XSS filters before rendering.

---
*Back to [README](README.md)*
