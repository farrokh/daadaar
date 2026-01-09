---
description: Automated Changelog & Translation Workflow
---

# Automated Changelog Generation & Translation

This workflow describes the system for automatically generating, filtering, and translating project updates from the git commit history. This ensures the `/updates` page is always current and localized without manual intervention.

## 1. Overview

The `scripts/generate-updates.ts` script is the core engine. It runs before every build (`bun run build` in frontend).

**Key Features:**
- **Git Integration**: Parses `git log` to fetch recent commits.
- **Filtering**: Segregates "Public" (user-facing) updates from "Technical" (raw) logs.
- **AI Translation**: Uses OpenAI (`gpt-4o-mini`) to translate public updates into Persian (Farsi).
- **Smart Caching**: Recycles existing translations from `frontend/data/updates.json` to minimize API costs and build time.
- **Resilience**: Falls back to English if the API key is missing or calls fail.

## 2. Prerequisites

- **Environment Variable**: `OPENAI_API_KEY` must be set in the build environment (CI/CD or local `.env`).
- **Dependencies**: `openai` package installed in the frontend.

## 3. Workflow Steps

1.  **Read History**: The script fetches the last 500 commits via `git log`.
2.  **Filter & Clean**:
    - Commits starting with `feat`, `fix`, `perf`, `ui` are candidate for "Public" updates.
    - Message prefixes (e.g., `feat(auth):`) are stripped for a cleaner look.
3.  **Load Cache**: The script reads the *previous* `updates.json` to load a dictionary of `{ English: Persian }` translations.
4.  **Identify New Content**: It compares the fresh commit messages against the cache.
    - **Found**: Uses the cached Persian translation.
    - **Missing**: Adds the message to a "to-translate" queue.
5.  **Batch Translation**:
    - If `OPENAI_API_KEY` is present, it sends the "to-translate" queue to OpenAI in chunks of 50.
    - If the key is missing (e.g., local dev without secrets), it skips translation.
6.  **Generate Output**:
    - Merges new translations with cached ones.
    - Writes the final structured data to `frontend/data/updates.json`.
    - Commits are grouped by date.

## 4. Usage

**Local Development:**
To test translations locally, run with your key:
```bash
OPENAI_API_KEY=sk-... bun scripts/generate-updates.ts
```

**Production:**
Ensure `OPENAI_API_KEY` is added to your deployment secrets (e.g., AWS App Runner, Vercel). The script runs automatically during the build step defined in `package.json`.

## 5. Updates Feed Component

The frontend component (`updates-feed.tsx`) consumes this JSON:
- **Locale Handling**: Automatically toggles between `message.en` and `message.fa` based on the active locale.
- **Minimap**: Displays an interactive timeline generated from the date groups.
