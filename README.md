# Daadaar Platform

[![CI](https://github.com/farrokh/daadaar/actions/workflows/ci.yml/badge.svg)](https://github.com/farrokh/daadaar/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A decentralized, anonymous platform for exposing government injustices in Iran. Features graph-based visualization, community-driven reporting, voting, and AI-powered verification.

## 🌟 Features

- **Anonymous by Default** - No registration required, VPN-friendly
- **Graph Visualization** - Interactive visualization of organizations, roles, and individuals
- **Community Voting** - Upvote/downvote reports with proof-of-work protection
- **AI Verification** - GPT-4 powered confidence scoring
- **Multi-language** - Persian (RTL) primary, English secondary
- **Privacy-First** - No IP logging, session-based rate limiting

## 🏗️ Architecture

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16 (React 19) with App Router on Vercel |
| Backend | Express.js API server (Bun runtime) on AWS App Runner |
| Database | PostgreSQL with Drizzle ORM (AWS RDS) |
| Cache | Redis (AWS ElastiCache Serverless) |
| Infrastructure | AWS (App Runner, RDS, S3, ElastiCache) + Vercel + Cloudflare |

For detailed architecture, see [ARCHITECTURE_SUMMARY.md](ARCHITECTURE_SUMMARY.md).

## 🚀 Getting Started

### Prerequisites

- **Bun 1.0+** - [Install Bun](https://bun.sh)
- **Docker** - For local PostgreSQL and Redis databases
- **Redis** - Required for production (rate limiting, sessions). Optional for local dev (system will operate without it but rate limiting will be disabled)

### Installation

```bash
# Clone the repository
git clone https://github.com/farrokh/daadaar.git
cd daadaar

# Install dependencies
bun install

# Set up environment variables
bun run setup

# Start PostgreSQL (via Docker)
bun run docker:up

# Push database schema
bun run db:push

# Run development servers
bun run dev
```

### Development URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000

### Available Scripts

```bash
# Development
bun run dev              # Run both frontend and backend
bun run dev:frontend     # Frontend only
bun run dev:backend      # Backend only

# Database
bun run docker:up        # Start PostgreSQL container
bun run docker:down      # Stop PostgreSQL container
bun run docker:reset     # Reset database (deletes all data)
bun run db:push          # Push schema to database (local dev only)
bun run db:generate      # Generate migrations
bun run db:migrate       # Run migrations (use in production, not db:push)
bun run db:studio        # Open Drizzle Studio (DB browser)
bun run db:seed:organizations # Seed Iranian government organization hierarchy

# Code Quality
bun run lint             # Check linting
bun run lint:fix         # Auto-fix linting issues
bun run format           # Format code
bun run type-check       # TypeScript type checking

# Build
bun run build            # Build all packages
```

## 📁 Project Structure

```
daadaar/
├── frontend/           # Next.js 16 application
│   ├── app/           # App Router pages
│   ├── components/    # React components
│   ├── i18n/          # Internationalization config
│   └── messages/      # Translation files
├── backend/           # Express.js API server
│   ├── src/
│   │   ├── db/        # Database connection & utilities
│   │   ├── routes/    # API endpoints
│   │   ├── services/  # Business logic
│   │   └── middleware/# Express middleware
│   └── drizzle/       # Database migrations
├── database/          # Drizzle ORM schema & config
│   └── schema.ts      # Type-safe database schema
├── shared/            # Shared TypeScript types
├── infrastructure/    # Docker & cloud configs
├── scripts/           # Development scripts
└── .github/           # GitHub workflows & templates
```

## 🤝 Contributing

We welcome contributions! This is a community-driven open-source project.

1. Read our [Contributing Guide](CONTRIBUTING.md)
2. Use the area-specific guides:
   - [Frontend Contributors](docs/guides/contributing-frontend.md)
   - [Backend Contributors](docs/guides/contributing-backend.md)
3. Check out [good first issues](https://github.com/farrokh/daadaar/labels/good%20first%20issue)
4. Join the discussion in [GitHub Discussions](https://github.com/farrokh/daadaar/discussions)

### Quick Contribution Steps

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/daadaar.git

# Create a branch
git checkout -b feature/your-feature

# Make changes and commit (use conventional commits)
git commit -m "feat(frontend): add search functionality"

# Push and open a PR
git push origin feature/your-feature
```

## 🔒 Security

- **Anonymous Sessions** - No personal data collection
- **VPN-Friendly** - Session-based rate limiting (not IP-based)
- **Proof-of-Work** - Prevents automated abuse
- **Encrypted** - End-to-end encryption for sensitive data

For security concerns, please see our [Security Policy](SECURITY.md) or contact the maintainers directly.

## 📖 Documentation

- [Documentation Index](docs/README.md) - Canonical docs map
- [Architecture Summary](ARCHITECTURE_SUMMARY.md) - Technical architecture
- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Frontend Contributors](docs/guides/contributing-frontend.md) - Frontend-specific workflow
- [Backend Contributors](docs/guides/contributing-backend.md) - Backend-specific workflow
- API reference (coming soon)

## 📜 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

This means:
- ✅ You can use, modify, and distribute this software
- ✅ You must keep it open source
- ✅ Network use counts as distribution (modifications must be shared)
- ✅ You must include the original license and copyright

See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

This project is built by and for the community. Special thanks to all contributors who help expose injustice and support accountability.

---

**⚠️ Disclaimer**: This platform is for informational purposes. Users are responsible for the accuracy of their submissions. The platform does not verify claims and encourages community-driven fact-checking.
