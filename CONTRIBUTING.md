# Contributing to Daadaar

First off, thank you for considering contributing to Daadaar! 🙏

This is a community-driven, open-source platform for exposing government injustices in Iran. Your contributions help make this platform more effective and accessible.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Area-Specific Guides](#area-specific-guides)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Getting Help](#getting-help)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- **Bun 1.0+** - [Install Bun](https://bun.sh)
- **Git** - For version control
- **PostgreSQL 15+** - For database (optional for basic frontend work)
- **Redis** - For session management (optional for basic frontend work)

### Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/daadaar.git
   cd daadaar
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/farrokh/daadaar.git
   ```
4. **Install dependencies**:
   ```bash
   bun install
   ```
5. **Start development servers**:
   ```bash
   bun run dev
   ```

## Development Setup

### Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your local configuration. See `.env.example` for all available options.

### Running the Project

```bash
# Run both frontend and backend
bun run dev

# Run only frontend (http://localhost:3000)
bun run dev:frontend

# Run only backend (http://localhost:4000)
bun run dev:backend
```

### Code Quality

```bash
# Check linting and formatting
bun run lint

# Auto-fix linting issues
bun run lint:fix

# Format code
bun run format

# Type checking
bun run type-check
```

## Area-Specific Guides

Use these guides when working on a specific part of the stack:
- [Frontend Contributors](docs/guides/contributing-frontend.md)
- [Backend Contributors](docs/guides/contributing-backend.md)

## Project Structure

```
daadaar/
├── frontend/           # Next.js 16 application
│   ├── app/           # App Router pages
│   │   ├── [locale]/  # Locale-aware routes
│   │   └── ...
│   ├── components/    # React components
│   ├── i18n/          # Internationalization config
│   ├── messages/      # Translation files (fa.json, en.json)
│   └── ...
├── backend/           # Express.js API server
│   ├── src/
│   │   ├── routes/    # API route handlers
│   │   ├── services/  # Business logic
│   │   ├── middleware/# Express middleware
│   │   └── ...
│   └── ...
├── shared/            # Shared code between frontend & backend
│   ├── types/         # TypeScript types
│   └── constants/     # Shared constants
├── scripts/           # Development scripts
└── ...
```

### Key Areas

| Area | Description | Technologies |
|------|-------------|--------------|
| Frontend | User interface, graph visualization | Next.js 16, React 19, Tailwind CSS |
| Backend | API server, business logic | Express.js, Drizzle ORM |
| Shared | Types and constants | TypeScript |
| i18n | Translations | next-intl |

## Making Changes

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Creating a Branch

```bash
# Sync with upstream
git fetch upstream
git checkout develop
git merge upstream/develop

# Create a new branch
git checkout -b feature/your-feature-name
```

### Branch Naming

- `feature/add-search-functionality`
- `fix/voting-count-bug`
- `docs/update-api-documentation`
- `refactor/improve-graph-performance`

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, whitespace) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system or dependencies |
| `ci` | CI configuration |
| `chore` | Other changes (maintenance) |
| `revert` | Reverts a previous commit |

### Scopes

- `frontend` - Frontend changes
- `backend` - Backend changes
- `shared` - Shared code changes
- `i18n` - Internationalization
- `db` - Database related
- `auth` - Authentication
- `graph` - Graph visualization
- `reports` - Reporting system
- `voting` - Voting system

### Examples

```bash
feat(frontend): add report submission form validation
fix(backend): resolve race condition in voting endpoint
docs: update README with new setup instructions
refactor(shared): simplify type definitions
```

## Pull Request Process

1. **Update your branch** with the latest changes:
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

2. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Open a Pull Request** on GitHub
   - Use a clear, descriptive title following conventional commits
   - Fill out the PR template completely
   - Link any related issues

4. **Address review feedback**
   - Make requested changes
   - Push additional commits
   - Re-request review when ready

5. **Merge** (maintainers will merge after approval)

### PR Requirements

- [ ] Passes all CI checks (lint, type-check, build)
- [ ] Has a clear description
- [ ] Follows coding standards
- [ ] Includes tests (when applicable)
- [ ] Updates documentation (when applicable)
- [ ] Has been self-reviewed

## Coding Standards

### TypeScript

- Use strict TypeScript (`strict: true`)
- Prefer `type` over `interface` for consistency
- Use explicit return types for public functions
- Avoid `any` - use `unknown` if type is truly unknown

### React/Next.js

- Use functional components with hooks
- Keep components small and focused
- Use server components where possible (Next.js 16)
- Follow the app router conventions

### Styling

- Use Tailwind CSS for styling
- Follow mobile-first responsive design
- Support RTL (right-to-left) for Persian

### API Design

- Use RESTful conventions
- Consistent response format (see `ARCHITECTURE_SUMMARY.md`)
- Validate all inputs
- Handle errors gracefully

### Internationalization

- All user-facing strings must be in translation files
- Persian (`fa`) is the primary language
- Support RTL layout for Persian/Arabic

## Testing

```bash
# Run all tests
bun run test

# Run frontend tests
bun --cwd frontend run test

# Run backend tests
bun --cwd backend run test

# Run with coverage
bun run test:coverage
```

### Writing Tests

- Write tests for new features
- Update tests when modifying existing code
- Aim for meaningful test coverage
- Test edge cases and error scenarios

## Documentation

### When to Update Documentation

- Adding new features
- Changing existing behavior
- Updating configuration
- Modifying API endpoints

### Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview and quick start |
| `ARCHITECTURE_SUMMARY.md` | Technical architecture details |
| `CONTRIBUTING.md` | Contribution guidelines (this file) |
| `docs/` | Additional documentation |

### Code Comments

- Comment complex logic
- Use JSDoc for public APIs
- Keep comments up-to-date

## Getting Help

- **Questions**: Open a [Discussion](https://github.com/farrokh/daadaar/discussions)
- **Bug Reports**: Open an [Issue](https://github.com/farrokh/daadaar/issues/new?template=bug_report.yml)
- **Feature Requests**: Open an [Issue](https://github.com/farrokh/daadaar/issues/new?template=feature_request.yml)

### First-Time Contributors

Look for issues labeled [`good first issue`](https://github.com/farrokh/daadaar/labels/good%20first%20issue) - these are great starting points!

---

Thank you for contributing to Daadaar! Your efforts help expose injustice and support those seeking accountability. 🙏
