# UUID-Based Frontend Navigation Implementation

**Date:** 2026-01-07  
**Status:** ✅ Complete

---

## Overview

Updated the frontend to use UUID-based navigation for all reports, matching the backend share API implementation. This provides consistent, secure, non-sequential URLs across the entire application.

---

## Changes Made

### 1. Type Definitions

**File:** `frontend/shared/types/index.ts`

Added `shareableUuid: string` field to:
- `User` interface
- `Organization` interface
- `Individual` interface
- `Report` interface

**File:** `frontend/components/graph/types.ts`

Added `shareableUuid: string` to `ReportNodeData` interface for graph navigation.

### 2. Routing Structure

**Changed:** `/[locale]/reports/[id]` → `/[locale]/reports/[uuid]`

- Renamed directory from `[id]` to `[uuid]`
- Updated route parameter from `params.id` to `params.uuid`

### 3. Report Detail Page

**File:** `frontend/app/[locale]/reports/[uuid]/page.tsx`

**Changes:**
- Updated API endpoint from `/reports/${params.id}` to `/share/report/${params.uuid}`
- Changed useEffect dependency from `params.id` to `params.uuid`
- Updated breadcrumb to display first 8 characters of UUID instead of sequential ID
- Changed from `String(report.id).slice(0, 8)` to `report.shareableUuid.slice(0, 8)`

### 4. Report Card Component

**File:** `frontend/components/reports/report-card.tsx`

**Changes:**
- Updated Link href from `/${locale}/reports/${report.id}` to `/${locale}/reports/${report.shareableUuid}`
- All report cards now navigate using UUIDs

### 5. Graph Canvas

**File:** `frontend/components/graph/graph-canvas.tsx`

**Changes:**
- Updated report node click handler
- Changed from `router.push(\`/reports/${data.id}\`)` to `router.push(\`/reports/${data.shareableUuid}\`)`
- Graph nodes now navigate to UUID-based report URLs

---

## URL Examples

### Before (Sequential IDs):
```
/en/reports/1
/en/reports/2
/en/reports/3
```

### After (UUIDs):
```
/en/reports/12f3491d-da92-415d-ac71-b6f5df855cee
/en/reports/5ec5e133-014c-4e1c-8745-9108599099f4
/en/reports/b6732e3d-44b7-47bf-a890-fdff2129069b
```

---

## Benefits

1. **Security**: Non-sequential UUIDs prevent enumeration attacks
2. **Consistency**: Same UUID format used across:
   - Direct navigation
   - Share links
   - Graph navigation
   - Report cards
3. **Shareable**: URLs are designed for sharing and are non-guessable
4. **Future-proof**: Easy to extend to organizations, individuals, and users

---

## Testing

### ✅ Verified Working:
1. Report detail page loads with UUID
2. Report cards link to UUID-based URLs
3. Graph nodes navigate to UUID-based URLs
4. Share API endpoint returns correct data
5. Breadcrumb displays UUID prefix
6. TypeScript compilation successful

### Test URLs:
```
http://localhost:3000/en/reports/12f3491d-da92-415d-ac71-b6f5df855cee
http://localhost:4000/api/share/report/12f3491d-da92-415d-ac71-b6f5df855cee
```

---

## Next Steps (Optional Enhancements)

### 1. Extend to Other Entities

Apply the same UUID-based navigation to:

**Organizations:**
- Create `/[locale]/org/[uuid]/page.tsx`
- Update organization links to use `shareableUuid`

**Individuals:**
- Create `/[locale]/individual/[uuid]/page.tsx`
- Update individual links to use `shareableUuid`

**Users:**
- Create `/[locale]/user/[uuid]/page.tsx`
- Update user profile links to use `shareableUuid`

### 2. Add Share Buttons

Add copy-to-clipboard share buttons on:
- Report detail pages ✅ (already exists via ShareLinkButton)
- Organization pages
- Individual pages
- User profiles

### 3. SEO Considerations

- Add canonical URLs using UUIDs
- Update sitemap generation to use UUIDs
- Consider adding human-readable slugs alongside UUIDs (optional)
  - Example: `/reports/12f3491d-da92-415d-ac71-b6f5df855cee/crime-in-tehran`

### 4. Analytics

- Update analytics tracking to use UUIDs
- Ensure privacy-preserving analytics don't expose sequential IDs

---

## Migration Notes

### Backward Compatibility

**Old URLs with sequential IDs will break.** If you need backward compatibility:

1. Create a redirect endpoint:
   ```typescript
   // /api/redirect/report/:id
   // Looks up UUID by ID and redirects to new URL
   ```

2. Add a catch-all route:
   ```typescript
   // /[locale]/reports/[idOrUuid]/page.tsx
   // Detects if param is number (old ID) or UUID
   // Redirects old IDs to new UUIDs
   ```

**Recommendation:** Since this is early in development, clean break is acceptable.

---

## Files Modified

### Backend:
- `database/schema.ts` - Added shareableUuid columns
- `backend/drizzle/0007_amused_revanche.sql` - Migration file
- `backend/src/controllers/share.ts` - New share controller
- `backend/src/routes/share.ts` - New share routes
- `backend/src/server.ts` - Registered share routes
- `backend/src/controllers/organizations.ts` - Added shareableUuid to response

### Frontend:
- `frontend/shared/types/index.ts` - Added shareableUuid to types
- `frontend/components/graph/types.ts` - Added shareableUuid to ReportNodeData
- `frontend/app/[locale]/reports/[id]` → `[uuid]` - Renamed directory
- `frontend/app/[locale]/reports/[uuid]/page.tsx` - Updated to use UUID
- `frontend/components/reports/report-card.tsx` - Updated links
- `frontend/components/graph/graph-canvas.tsx` - Updated navigation

---

**Implementation Complete:** ✅  
**All Navigation Uses UUIDs:** ✅  
**Tested and Working:** ✅
