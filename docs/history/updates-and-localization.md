# History: Project Updates & Localization

**Date**: 2026-01-09
**Focus**: Automated Changelog, AI Translation, and Minimap Refinement

## Summary
We implemented a comprehensive system for the "Project Updates" page (`/updates`). This system automates the process of keeping users informed by reading directly from the git log, filtering for relevant content, and using AI to provide high-quality translations for Persian users.

## Changes

### 1. Automated Data Pipeline
*   **Script**: Created `scripts/generate-updates.ts`.
*   **Logic**:
    *   Extracts git history.
    *   Filters "Public" updates based on conventional commit prefixes (`feat`, `fix`).
    *   **AI Integration**: Added OpenAI (`gpt-4o-mini`) integration to translate public messages.
    *   **Smart Caching**: Implemented a JSON-based local cache to store translations, ensuring we only pay/wait for *new* commits.

### 2. Frontend Improvements
*   **Updates Page**: Refined `UpdatesFeed` component.
    *   **Minimap**: Redesigned for better usability (larger hit targets, horizontal dash expansion on hover).
    *   **Smooth Animations**: Removed jarring scale effects on exit, improved hover transitions.
    *   **Localization Support**: Updated component to accept and render dual-language message objects (`{ en, fa }`).
*   **Performance**: Optimized animations with `framer-motion`.

### 3. Workflow & Documentation
*   **Workflow**: Added `.agent/workflows/automated-updates.md` to describe the process.
*   **Rules**: Updated `.agent/rules.md` to mandate `updates.json` commitment (translation memory).
*   **Documentation**: Created `docs/features/project-updates.md`.

## Key Files
*   `frontend/app/[locale]/updates/page.tsx`
*   `frontend/components/updates/updates-feed.tsx`
*   `scripts/generate-updates.ts`
*   `frontend/data/updates.json`
