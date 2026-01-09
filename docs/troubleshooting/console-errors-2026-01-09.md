# Console Errors - Fixes Applied

## Date: 2026-01-09

### Issues Identified and Fixed

#### 1. PostHog 404 Errors (FIXED)
**Problem:** PostHog was trying to use `/ingest` endpoint which conflicted with Next.js locale routing (`/fa/ingest`), causing 404 errors.

**Solution:** Changed `api_host` from `/ingest` to `https://us.i.posthog.com` to use PostHog's cloud endpoint directly, avoiding routing conflicts.

**File Changed:** `frontend/instrumentation-client.ts`

---

#### 2. React Flow Edge Type Not Found (FIXED)
**Problem:** React Flow was showing errors: `Edge type "hierarchy" not found. Using fallback type "default"`

**Solution:** Explicitly defined edge types in the config file:
- `hierarchy` 
- `occupies`
- `occupies_former`

These use the default bezier edge component but need to be explicitly defined to avoid React Flow warnings.

**File Changed:** `frontend/components/graph/config.ts`

---

#### 3. React Flow nodeTypes/edgeTypes Recreation Warning (ALREADY FIXED)
**Problem:** React Flow warned about creating new nodeTypes/edgeTypes objects on each render.

**Status:** Already properly handled with `useMemo()` in `graph-canvas.tsx` (lines 72-74).

---

### Remaining Issues to Monitor

#### 1. Request Header Fields Too Large (431 Error)
**Status:** This appears to be coming from PostHog's exception autocapture script. Now that we're using the cloud endpoint, this should be resolved.

**Location:** `ingest/static/exception-autocapture.js?v=1.316.0`

#### 2. Image Loading Optimization
**Warning:** Next.js suggests adding `loading="eager"` to `/logo_navbar_en.svg` for LCP optimization.

**File to Update:** Check navbar component for logo usage.

**Status:** Low priority - performance optimization, not a breaking error.

#### 3. Preload Resources Not Used
**Warning:** Multiple resources preloaded but not used within a few seconds.

**Status:** Low priority - these are framework-level warnings from Next.js hot module replacement in development mode.

---

### Testing Recommendations

1. **Refresh the browser** to clear the old PostHog configuration
2. **Check console** for:
   - No more 404 errors from PostHog endpoints
   - No more "Edge type not found" warnings from React Flow
3. **Verify PostHog functionality** by checking if analytics events are being sent (look for successful requests to `us.i.posthog.com`)

---

### Next Steps (Optional Optimizations)

1. Add `loading="eager"` to the navbar logo for LCP optimization
2. Consider reducing PostHog debug logging in development
3. Review and potentially disable PostHog exception autocapture if it continues causing issues
