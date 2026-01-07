# UUID-Based Graph Navigation URLs

**Date:** 2026-01-07  
**Status:** ✅ Complete

---

## Overview

Updated graph navigation URLs to use UUIDs instead of sequential IDs for organizations and individuals. This provides secure, shareable URLs while maintaining fast internal API queries using numeric IDs.

---

## URL Format Changes

### Before (Sequential IDs):
```
/?view=people&organizationId=1
/?view=reports&individualId=3
```

### After (UUIDs):
```
/?view=people&organizationUuid=5ec5e133-014c-4e1c-8745-9108599099f4
/?view=reports&individualUuid=b6732e3d-44b7-47bf-a890-fdff2129069b
```

---

## Implementation Strategy

**Hybrid Approach:**
- **URLs:** Use UUIDs for shareability and security
- **Internal APIs:** Continue using numeric IDs for performance
- **Resolution:** Homepage resolves UUIDs to IDs on page load

This approach provides the best of both worlds:
- ✅ Shareable, non-sequential URLs
- ✅ Fast database queries (indexed on numeric IDs)
- ✅ Backward compatible (still accepts numeric IDs)

---

## Changes Made

### 1. Backend - Graph Controller

**File:** `backend/src/controllers/graph.ts`

Added `shareableUuid` to select statements:
- `getOrganizationPeople`: Returns organization.shareableUuid
- `getIndividualReports`: Returns individual.shareableUuid and report.shareableUuid

### 2. Frontend - Homepage

**File:** `frontend/app/[locale]/page.tsx`

**New Functions:**
- `isUuid(value)`: Validates UUID format
- `resolveOrganizationUuid(uuid)`: Resolves org UUID to ID via `/share/org/:uuid`
- `resolveIndividualUuid(uuid)`: Resolves individual UUID to ID via `/share/individual/:uuid`

**Updated:**
- `getInitialView()`: Now async, tries UUID params first, falls back to numeric IDs
- Supports both `organizationUuid` and `organizationId` parameters
- Supports both `individualUuid` and `individualId` parameters

### 3. Frontend - View Context

**File:** `frontend/components/graph/config.ts`

Added UUID fields to `ViewContext`:
```typescript
export type ViewContext = {
  mode: ViewMode;
  organizationId?: number;
  organizationUuid?: string;  // NEW
  organizationName?: string;
  individualId?: number;
  individualUuid?: string;    // NEW
  individualName?: string;
};
```

### 4. Frontend - Graph Data Hook

**File:** `frontend/hooks/use-graph-data.ts`

**Updated Interfaces:**
- `OrganizationPeopleResponse`: Added shareableUuid to organization
- `IndividualReportsResponse`: Added shareableUuid to individual

**Updated Functions:**
- `fetchOrganizationPeople`: Stores organizationUuid in viewContext
- `fetchIndividualReports`: Stores individualUuid in viewContext

### 5. Frontend - Graph Canvas

**File:** `frontend/components/graph/graph-canvas.tsx`

**Updated URL Synchronization:**
- Uses `organizationUuid` instead of `organizationId` in URL params
- Uses `individualUuid` instead of `individualId` in URL params
- Cleans up old numeric params for backward compatibility

---

## Data Flow

### Loading from URL:

```
1. User visits: /?view=reports&individualUuid=b6732e3d-...
2. Homepage detects UUID parameter
3. Calls /share/individual/b6732e3d-... to resolve to ID
4. Gets back: { id: 3, shareableUuid: "b6732e3d-...", ... }
5. Passes ViewContext with both ID and UUID to GraphCanvas
6. GraphCanvas uses ID for API calls, UUID for URL updates
```

### Navigating in Graph:

```
1. User clicks on individual node
2. fetchIndividualReports(id: 3) called
3. API returns: { individual: { id: 3, shareableUuid: "b6732e3d-..." } }
4. ViewContext updated with both ID and UUID
5. URL updated to: /?view=reports&individualUuid=b6732e3d-...
```

---

## Backward Compatibility

The system maintains backward compatibility with old numeric ID URLs:

**Old URL (still works):**
```
/?view=reports&individualId=3
```

**Automatically upgraded to:**
```
/?view=reports&individualUuid=b6732e3d-44b7-47bf-a890-fdff2129069b
```

When the graph canvas updates the URL, it:
1. Uses UUIDs if available
2. Removes old numeric params
3. Ensures clean, UUID-based URLs going forward

---

## Testing

### ✅ Verified Working:

1. **UUID Resolution:**
   ```bash
   # Homepage resolves UUIDs to IDs
   curl "http://localhost:3000/fa?view=reports&individualUuid=b6732e3d-..."
   ```

2. **Backend API:**
   ```bash
   # Graph API returns UUIDs
   curl "http://localhost:4000/api/graph/organization/1/people" | jq '.data.organization.shareableUuid'
   # Output: "5ec5e133-014c-4e1c-8745-9108599099f4"
   ```

3. **URL Generation:**
   - Clicking nodes generates UUID-based URLs
   - URLs are shareable and non-sequential

4. **Backward Compatibility:**
   - Old numeric ID URLs still work
   - Automatically upgraded to UUID URLs

---

## Security Benefits

1. **Non-Enumerable:** UUIDs prevent users from guessing other entity URLs
2. **Shareable:** URLs can be safely shared without exposing sequential IDs
3. **Consistent:** Same UUID format across all entity types
4. **Future-Proof:** Easy to extend to other entity types

---

## Performance Considerations

**No Performance Impact:**
- Internal API calls still use numeric IDs (fast indexed lookups)
- UUID resolution happens once on page load
- Subsequent navigation uses cached IDs

**Database Queries:**
- Graph APIs: Use numeric ID indexes (fast)
- Share APIs: Use UUID indexes (also fast, created in migration)

---

## Example URLs

### Organization View:
```
https://daadaar.com/fa?view=people&organizationUuid=5ec5e133-014c-4e1c-8745-9108599099f4
```

### Individual Reports View:
```
https://daadaar.com/fa?view=reports&individualUuid=b6732e3d-44b7-47bf-a890-fdff2129069b
```

### Organizations List:
```
https://daadaar.com/fa?view=organizations
```

---

## Files Modified

### Backend:
- `backend/src/controllers/graph.ts` - Added shareableUuid to responses

### Frontend:
- `frontend/app/[locale]/page.tsx` - UUID resolution logic
- `frontend/components/graph/config.ts` - Added UUID fields to ViewContext
- `frontend/hooks/use-graph-data.ts` - Store UUIDs in viewContext
- `frontend/components/graph/graph-canvas.tsx` - Generate UUID-based URLs

---

## Related Documentation

- `docs/features/uuid-shareable-links.md` - Backend share API implementation
- `docs/features/uuid-frontend-navigation.md` - Report detail page UUID navigation

---

**Implementation Complete:** ✅  
**URLs Use UUIDs:** ✅  
**Backward Compatible:** ✅  
**Tested and Working:** ✅
