# Agent Rules

## Git Workflow
- Always `git pull origin main` after a merge is completed.
- Ensure the local workspace is fully updated with the merged changes before deleting any local branches.
- Never delete a branch (local or remote) until confirmation of a successful merge into the base branch.

## JSON Processing
- Do not process complex JSON output directly in the terminal.
- Always create a temporary Python script to process JSON data if it requires extraction or transformation.
- Delete the temporary Python script immediately after execution.

## Documentation Organization
- Always organize documentation within the `docs/` directory using the following structure:
  - `docs/features/`: Feature specifications, implementation summaries, and logic details.
  - `docs/operations/`: Operational guides, deployment processes, and infrastructure setup (AWS, S3, etc.).
  - `docs/architecture/`: High-level system design and architecture overviews.
  - `docs/guides/`: Developer walkthroughs and utility guides.
- New documentation files must be placed in the most relevant subdirectory.
- Maintain relative links between documentation files to ensure navigability regardless of the viewer's context.

## Security & Sensitive Information
- **Never hardcode AWS identifiers** (Account IDs, Service ARNs, or Bucket Names) in scripts, code, or documentation.
- Always use dynamic fetching via AWS CLI (e.g., `aws sts get-caller-identity`) or environment variables to determine these values at runtime.
- Use placeholders like `<AWS_ACCOUNT_ID>` or `<BUCKET_NAME>` in documentation and examples.
- Never commit actual credentials, secrets, or passwords to the repository.
