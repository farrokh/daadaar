# AI Report Verification

Daadaar uses Perplexity AI (Sonar model) to automatically analyze and verify incident reports submitted by users. This system helps identify potential inconsistencies, factual errors, or lack of evidence in reports.

## Overview

When a report is submitted, it can be optionally enqueued for an AI-based fact-check. The AI evaluates the report's content against its internal knowledge base and current search results, providing:
- **Confidence Score (0-100)**: Overall trust level in the report.
- **Credibility Score (0-100)**: Reliability of the claims made.
- **Consistency Score (0-100)**: How well the report aligns with known historical and current facts.
- **Fact-Check Summary**: A detailed breakdown in both **Persian** and **English**.
- **Flags**: Specific issues identified by the AI (e.g., date mismatches, speculative claims), available in both **Persian** and **English**.

## Configuration

The AI verification system is controlled by the following environment variables:

- `PERPLEXITY_API_KEY`: API key for the Perplexity platform.
- `AI_VERIFICATION_ENABLED`: (Boolean) Set to `true` to enable automatic verification on report submission.
- `REDIS_URL`: Required for the job queue (BullMQ) that processes AI jobs in the background.

## Manual Trigger

If the automatic verification is disabled or fails, administrators can manually trigger verification for any report via the Admin Dashboard.

## Transparency & Disclaimer

Every AI analysis is clearly marked with a badge showing the model used (e.g., `SONAR`). A disclaimer is also displayed to inform users that the analysis is purely AI-generated and should not be considered an absolute source of truth.

### Disclaimer Language:
> The analysis above is generated solely by AI (Perplexity Sonar model). This system may produce inaccuracies or misinterpret facts. Please consider this analysis as advisory and use with caution.

## Technical Implementation

- **Service**: `backend/src/services/grok-service.ts` (Handles API communication with Perplexity).
- **Worker**: `backend/src/workers/ai-verification-worker.ts` (Processes background jobs).
- **Queue**: `backend/src/queues/ai-verification-queue.ts` (BullMQ based queue).
- **Frontend Component**: `frontend/components/reports/ai-verification-card.tsx`.
