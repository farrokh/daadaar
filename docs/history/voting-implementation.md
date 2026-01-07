# Voting System Implementation

**Status**: ✅ Complete  
**Date**: January 4, 2026  
**Phase**: Phase 1 - MVP Completion

---

## Overview

The voting system allows users (both registered and anonymous) to upvote or downvote reports. Anonymous users must solve a Proof-of-Work (PoW) challenge to prevent spam, while registered users can vote freely (subject to rate limits).

## Features Implemented

### Backend

#### 1. **Voting Controller** (`backend/src/controllers/votes.ts`)
- **Cast Vote** (`POST /api/votes`):
  - Create new vote or change existing vote (upvote ↔ downvote)
  - PoW validation for anonymous users
  - Rate limiting (100 votes/hour per user/session)
  - Atomic vote count updates using SQL expressions
  - Duplicate prevention via unique constraints
  - Returns updated vote counts

- **Remove Vote** (`DELETE /api/votes/:reportId`):
  - Delete existing vote
  - **PoW validation for anonymous users** (same as casting votes)
  - Atomic decrement of vote counts
  - Returns updated vote counts

- **Get My Vote** (`GET /api/votes/:reportId/my-vote`):
  - Fetch current user's vote on a report
  - Returns null if not voted

#### 2. **Voting Routes** (`backend/src/routes/votes.ts`)
- All routes use `authMiddleware` to capture user/session
- State-changing routes (`POST`, `DELETE`) use `csrfProtection`
- Registered in server at `/api/votes`

#### 3. **API Types** (`shared/api-types.ts`)
- `CastVoteRequest`: Request body for casting votes
- `CastVoteResponse`: Response with vote and updated counts
- `RemoveVoteRequest`: Request body for removing votes (includes PoW fields for anonymous users)
- `RemoveVoteResponse`: Response with updated counts
- `GetMyVoteResponse`: Response with user's current vote

### Frontend

#### 1. **Voting API** (`frontend/lib/voting-api.ts`)
- `castVote()`: Cast or change vote with automatic PoW solving for anonymous users
- `removeVote()`: Remove vote with **automatic PoW solving for anonymous users** and CSRF protection
- `getMyVote()`: Fetch current user's vote
- Automatic CSRF token fetching
- Error handling and type safety

#### 2. **Voting Hook** (`frontend/hooks/use-voting.ts`)
- `useVoting()`: React hook for managing voting state
- Features:
  - Automatic vote fetching on mount
  - Optimistic UI updates
  - Server reconciliation on success
  - Error rollback on failure
  - Loading states
  - Vote change support

#### 3. **Voting Buttons Component** (`frontend/components/reports/voting-buttons.tsx`)
- Two display modes:
  - **Compact**: Horizontal layout for cards
  - **Full**: Vertical layout with detailed stats
- Features:
  - Visual feedback for current vote
  - Loading states with PoW progress indicator
  - Error messages
  - Hover effects and animations
  - Accessible button states
  - SSR-safe with hydration handling

#### 4. **Integration**
- **Report Card** (`frontend/components/reports/report-card.tsx`):
  - Compact voting buttons in card footer
  - Shows vote counts alongside report metadata

- **Report Detail Page** (`frontend/app/[locale]/reports/[id]/page.tsx`):
  - Full voting section with detailed stats
  - Prominent placement below content

#### 5. **Translations**
- English (`frontend/messages/en.json`):
  - `voting.upvote`, `voting.downvote`, `voting.removeVote`
  - `voting.voteCast`, `voting.voteRemoved`
  - `voting.voteError`, `voting.removeVoteError`
  - `voting.solvingPow`, `voting.powRequired`

- Persian (`frontend/messages/fa.json`):
  - Full RTL support with Persian translations
  - Culturally appropriate terminology

---

## Technical Details

### Database Schema

The `votes` table (already existed):
```sql
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID,
  vote_type vote_type NOT NULL, -- 'upvote' or 'downvote'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Unique constraints to prevent duplicate votes
  CONSTRAINT votes_user_report_unique UNIQUE (user_id, report_id),
  CONSTRAINT votes_session_report_unique UNIQUE (session_id, report_id),
  
  -- Ensure at least one of user_id or session_id is provided
  CONSTRAINT votes_user_or_session_required CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);
```

### Atomic Vote Count Updates

Vote counts are updated atomically using SQL expressions to prevent race conditions:

```typescript
// Increment upvote count
await tx.update(schema.reports)
  .set({
    upvoteCount: sql`${schema.reports.upvoteCount} + 1`,
    updatedAt: new Date(),
  })
  .where(eq(schema.reports.id, reportId));

// Change vote (upvote → downvote)
await tx.update(schema.reports)
  .set({
    upvoteCount: sql`${schema.reports.upvoteCount} - 1`,
    downvoteCount: sql`${schema.reports.downvoteCount} + 1`,
    updatedAt: new Date(),
  })
  .where(eq(schema.reports.id, reportId));
```

### Security Features

1. **PoW for Anonymous Users**:
   - Anonymous users must solve a PoW challenge before voting
   - Difficulty: 4 leading zeros (configurable)
   - Challenge expires after 5 minutes
   - One-time use per challenge

2. **Rate Limiting**:
   - 100 votes per hour per user/session
   - Uses Redis with in-memory fallback
   - Separate limits for registered users and sessions

3. **CSRF Protection**:
   - All state-changing operations require CSRF token
   - Token-based with 24-hour expiration
   - Automatic cleanup of expired tokens

4. **Duplicate Prevention**:
   - Unique constraints on (user_id, report_id) and (session_id, report_id)
   - Database-level enforcement
   - Check constraint ensures user_id OR session_id is present

### Vote Change Logic

The system supports changing votes (upvote → downvote or vice versa):

1. **Check for existing vote**: Query database for user's current vote
2. **If no vote exists**: Create new vote, increment appropriate count
3. **If same vote type**: Return unchanged (idempotent)
4. **If different vote type**: Update vote, decrement old count, increment new count

All operations are wrapped in a database transaction for consistency.

### Optimistic UI Updates

The frontend implements optimistic updates for better UX:

1. **Immediate UI update**: Vote counts update instantly
2. **API call**: Request sent to backend
3. **On success**: Reconcile with server counts
4. **On error**: Rollback to previous state, show error message

---

## API Endpoints

### POST /api/votes
Cast or change a vote on a report.

**Request Body**:
```typescript
{
  reportId: number;
  voteType: 'upvote' | 'downvote';
  // Required for anonymous users:
  powChallengeId?: string;
  powSolution?: string;
  powSolutionNonce?: number;
}
```

**Response** (201 Created or 200 OK):
```typescript
{
  success: true;
  data: {
    vote: {
      id: number;
      reportId: number;
      userId: number | null;
      sessionId: string | null;
      voteType: 'upvote' | 'downvote';
      createdAt: string;
      updatedAt: string;
    };
    voteAction: 'created' | 'updated' | 'unchanged';
    reportVoteCounts: {
      upvoteCount: number;
      downvoteCount: number;
    };
  };
}
```

**Error Responses**:
- `400`: Missing fields, invalid vote type, invalid PoW
- `404`: Report not found
- `429`: Rate limit exceeded

---

### DELETE /api/votes/:reportId
Remove a vote from a report.

**Request Body** (for anonymous users):
```typescript
{
  // Required for anonymous users:
  powChallengeId?: string;
  powSolution?: string;
  powSolutionNonce?: number;
}
```

**Response** (200 OK):
```typescript
{
  success: true;
  data: {
    reportVoteCounts: {
      upvoteCount: number;
      downvoteCount: number;
    };
  };
}
```

**Error Responses**:
- `400`: Invalid report ID, missing PoW (anonymous users), invalid PoW
- `404`: Vote not found

---

### GET /api/votes/:reportId/my-vote
Get the current user's vote on a report.

**Response** (200 OK):
```typescript
{
  success: true;
  data: {
    vote: {
      id: number;
      reportId: number;
      userId: number | null;
      sessionId: string | null;
      voteType: 'upvote' | 'downvote';
      createdAt: string;
      updatedAt: string;
    } | null;
  };
}
```

---

## Usage Examples

### Frontend - Voting in a Component

```tsx
import { VotingButtons } from '@/components/reports/voting-buttons';
import { useAuth } from '@/lib/auth';

function ReportCard({ report }) {
  const { currentUser } = useAuth();
  
  return (
    <div>
      <h2>{report.title}</h2>
      <p>{report.content}</p>
      
      <VotingButtons
        reportId={report.id}
        initialUpvoteCount={report.upvoteCount}
        initialDownvoteCount={report.downvoteCount}
        isAnonymous={currentUser?.type === 'anonymous'}
        compact
      />
    </div>
  );
}
```

### Frontend - Using the Hook Directly

```tsx
import { useVoting } from '@/hooks/use-voting';

function CustomVotingUI({ reportId, isAnonymous }) {
  const { 
    currentVote, 
    upvoteCount, 
    downvoteCount, 
    isLoading, 
    error, 
    vote, 
    unvote 
  } = useVoting(reportId, 0, 0, isAnonymous);
  
  return (
    <div>
      <button onClick={() => vote('upvote')} disabled={isLoading}>
        👍 {upvoteCount}
      </button>
      <button onClick={() => vote('downvote')} disabled={isLoading}>
        👎 {downvoteCount}
      </button>
      {currentVote && (
        <button onClick={unvote}>Remove Vote</button>
      )}
      {error && <p>{error}</p>}
    </div>
  );
}
```

---

## Testing Checklist

- [x] Backend controller implementation
- [x] Backend routes with middleware
- [x] API type definitions
- [x] Frontend API functions
- [x] Frontend voting hook
- [x] Frontend voting component
- [x] Report card integration
- [x] Report detail page integration
- [x] Translation keys (en/fa)
- [x] PoW validation for anonymous users
- [x] Rate limiting
- [x] CSRF protection
- [x] Atomic vote count updates
- [x] Vote change support
- [x] Optimistic UI updates
- [x] Error handling
- [x] Loading states

---

## Next Steps

The voting mechanism is now **fully implemented**. Recommended next steps from the roadmap:

1. **AI Verification (Basic)**: OpenAI GPT-4 integration for report analysis
2. **Full-Text Search**: PostgreSQL tsvector/tsquery for searching reports
3. **User Trust Score System**: Calculate trust scores based on voting patterns

---

## Files Modified/Created

### Backend
- ✅ `backend/src/controllers/votes.ts` (created)
- ✅ `backend/src/routes/votes.ts` (created)
- ✅ `backend/src/server.ts` (modified - added votes routes)

### Shared
- ✅ `shared/api-types.ts` (modified - added voting types)

### Frontend
- ✅ `frontend/lib/voting-api.ts` (created)
- ✅ `frontend/hooks/use-voting.ts` (created)
- ✅ `frontend/components/reports/voting-buttons.tsx` (created)
- ✅ `frontend/components/reports/report-card.tsx` (modified)
- ✅ `frontend/app/[locale]/reports/[id]/page.tsx` (modified)
- ✅ `frontend/messages/en.json` (modified - added voting keys)
- ✅ `frontend/messages/fa.json` (modified - added voting keys)

### Documentation
- ✅ `docs/architecture/roadmap.md` (modified - marked voting as complete)
- ✅ `docs/history/voting-implementation.md` (created - this file)

---

*Last Updated: January 4, 2026*  
*Implementation Status: Complete ✅*
