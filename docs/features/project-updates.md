# Project Updates & Changelog Feature

## Overview

The Project Updates feature provides a dynamic, automated, and localized changelog for the Daadaar platform. It serves both public users (with simplified, translated updates) and technical users (with detailed git commit logs). The system is built to be zero-maintenance for developers, leveraging the existing git workflow to generate content.

## Key Capabilities

1.  **Automated Generation**: A build-time script generates the content directly from `git log`.
2.  **Dual Views**:
    *   **Public View**: Filtered, clean, and translated updates (features, fixes, UI improvements).
    *   **Technical View**: Raw commit history for transparency and technical tracking.
3.  **AI Localization**: Automatically translates English technical updates into Persian using OpenAI.
4.  **Interactive Minimap**: A timeline navigation tool with smooth animations (using Framer Motion) for quick access to history.
5.  **Responsive Design**: Fully responsive layout with mobile optimizations and RTL support.

## Implementation Details

### 1. Data Generation (`scripts/generate-updates.ts`)

This script runs before the Next.js build:
*   **Git Parsing**: Fetches the last 500 commits using `git log`.
*   **Classification**:
    *   Parses Conventional Commits (`feat`, `fix`, `docs`, etc.).
    *   Categories `feat` and `fix` are marked for the Public view.
    *   All commits are kept for the Technical view.
*   **Translation**:
    *   Checks for `OPENAI_API_KEY`.
    *   Compares new messages against a local cache (`frontend/data/updates.json`) to avoid re-translating.
    *   Uses OpenAI `gpt-4o-mini` to translate new public messages to Persian.
    *   Updates the JSON cache.

### 2. Frontend Component (`ContentsFeed`)

Located at `frontend/components/updates/updates-feed.tsx`.

*   **Minimap**:
    *   Vertical/Side positioning (fixed).
    *   Animates on hover (simple dash becomes a wider timeline marker).
    *   Shows date tooltips.
    *   Hides on mobile.
*   **Localization**:
    *   Uses `next-intl` for UI strings.
    *   Dynamically picks English or Persian content from the JSON payload (`{ en: "...", fa: "..." }`).
*   **Design**:
    *   Uses a split layout: Timeline center (or side for mobile), interactive cards.
    *   Color-coded indicators for update types (Feature: Green, Fix: Red, etc.).

## Security & Performance

*   **Secrets**: The translation script uses `OPENAI_API_KEY` from the environment. It is failsafe; if the key is missing, it skips translation without breaking the build.
*   **Caching**: The translation memory is stored in the git repo (`frontend/data/updates.json`), costing $0 for re-builds.
*   **Sanitization**: The script specifically sanitizes commit messages to remove technical jargon prefixes like `feat(auth):` for the public view.

## Usage

### Generating Updates Manually
```bash
bun run generate-updates
# OR with translation
OPENAI_API_KEY=sk-... bun run generate-updates
```

### Adding New Updates
Simply commit your code using Conventional Commits.
*   `feat: add new search` -> Becomes a Public Update.
*   `fix: resolve login bug` -> Becomes a Public Update.
*   `chore: cleanup` -> Stays in Technical View only.
