---
description: Create a Pull Request based on the repository's template
---

Follow these steps to create a Pull Request (PR) that adheres to the project's standards:

1.  **Locate PR Template**:
    *   Search for a PR template in `.github/PULL_REQUEST_TEMPLATE.md`, `docs/PULL_REQUEST_TEMPLATE.md`, or root `PULL_REQUEST_TEMPLATE.md`.
    *   If found, read the content to understand the structure (e.g., Description, Type of Change, Checklist).

2.  **Analyze Changes**:
    *   Run `git status` and `git diff --stat` (or `git log` if commits are already made) to understand the scope of changes.
    *   Determine the **Type of Change** (Bug fix, Feature, Refactoring, etc.) based on the modified files and logic.
    *   Determine the **Area of Change** (Frontend, Backend, Database, Config, etc.).
    *   Draft a concise but comprehensive **Description** summarizing *what* changed and *why*.

3.  **Prepare PR Body**:
    *   Fill out the template sections with your analysis.
    *   Check off the relevant boxes (e.g., `[x]`) for "Type of Change" and "Area of Change".
    *   Ensure the "Checklist" is reviewed. If you have verified linting/tests in previous steps, mark those as checked.

4.  **Validate Code**:
    *   Before pushing, ensure the code adheres to project standards by running linting and type checking:
      ```bash
      bun run lint && bun run type-check
      ```
    *   If any errors occur, fix them before proceeding.

5.  **Push Changes**:
    *   Ensure the current branch is pushed to the remote:
      ```bash
      git push origin <current-branch-name>
      ```

6.  **Create PR**:
    *   Use the GitHub CLI to create the PR with the generated title and body.
    *   Generate a semantic title (e.g., `feat: ...`, `fix: ...`).
      ```bash
      gh pr create --title "<generated-title>" --body "<generated-body>"
      ```
    *   If the command fails because the branch isn't pushed, push it and retry.

7.  **Verify**:
    *   Output the URL of the created PR.
