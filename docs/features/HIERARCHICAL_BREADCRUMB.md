# Hierarchical Breadcrumb Navigation

## Overview

This feature implements intelligent breadcrumb navigation that displays the full organizational hierarchy path when viewing organizations, people, or reports. When the path is very long, it automatically truncates to show the most relevant organizations.

## Features

### Full Path Display
The breadcrumb shows the complete path from the root organization down to the current context:

**Organizations View:**
```
Organizations
```

**People View (with hierarchy):**
```
Organizations / Iranian Government / Ministry of Intelligence / محسن رضایی
                     ↑                      ↑                        ↑
                  Root Org            Middle Org            Current Org (showing people)
```

**Reports View (with hierarchy):**
```
Organizations / Iranian Government / Ministry of Intelligence / محسن رضایی / علی رضا حکیمی‌پور
                     ↑                      ↑                        ↑              ↑
                  Root Org            Middle Org              Organization    Individual (showing reports)
```

### Smart Truncation

When the organizational path exceeds 4 levels, the breadcrumb intelligently truncates to show:
- **First 2 organizations** (root and next level)
- **Ellipsis (...)** to indicate skipped organizations
- **Last organization** (direct parent of current context)

**Example with 7-level hierarchy:**
```
Organizations / Root Org / Second Org / ... / Sixth Org / Current Person
```

This ensures the breadcrumb remains readable while still showing the organizational context.

## Implementation

### Backend Changes

#### New Helper Module (`backend/src/lib/organization-hierarchy.ts`)

Created utility functions to traverse organizational hierarchies:

```typescript
// Get full path from child to root
async function getOrganizationPath(organizationId: number): Promise<OrganizationPathItem[]>

// Get organizational path for an individual
async function getIndividualOrganizationPath(individualId: number): Promise<OrganizationPathItem[]>
```

**Features:**
- Circular reference detection
- Maximum depth protection (50 levels)
- Returns path in root-to-child order
- Handles missing organizations gracefully

#### Updated Graph API Endpoints

**`GET /api/graph/organization/:id/people`**
Now returns:
```json
{
  "organization": { ... },
  "organizationPath": [
    { "id": 1, "name": "Root Org", "nameEn": "Root Org" },
    { "id": 5, "name": "Child Org", "nameEn": "Child Org" },
    { "id": 10, "name": "Current Org", "nameEn": "Current Org" }
  ],
  "nodes": [...],
  "edges": [...]
}
```

**`GET /api/graph/individual/:id/reports`**
Now returns:
```json
{
  "individual": { ... },
  "organizationPath": [
    { "id": 1, "name": "Root Org", "nameEn": "Root Org" },
    ...
  ],
  "nodes": [...],
  "edges": [...]
}
```

### Frontend Changes

#### Updated Hook (`frontend/hooks/use-graph-data.ts`)

**New State:**
```typescript
const [organizationPath, setOrganizationPath] = useState<OrganizationPathItem[]>([]);
```

**Behavior:**
- Clears path when viewing all organizations
- Stores path when drilling into people or reports
- Exports path for use in breadcrumb

#### Enhanced Breadcrumb (`frontend/components/graph/graph-canvas.tsx`)

**Truncation Logic:**
```typescript
const displayPath: Array<typeof path[0] | 'ellipsis'> = [];

if (path.length > 4) {
  displayPath.push(path[0], path[1], 'ellipsis', path[path.length - 1]);
} else {
  displayPath.push(...path);
}
```

**Interactive Elements:**
- Each organization in the path is clickable
- Clicking navigates to that organization's people view
- Respects current locale (shows English or Farsi name)
- Ellipsis is non-interactive (visual only)

## User Experience

### Navigation Flow

1. **Start at Organizations View**
   ```
   Organizations
   ```

2. **Click on an Organization** (e.g., "Iranian Government")
   ```
   Organizations / Iranian Government
   ```
   
3. **From there, click another child organization** (e.g., "Ministry of Intelligence")
   ```
   Organizations / Iranian Government / Ministry of Intelligence
   ```

4. **Click on a person** (e.g., "محسن رضایی")
   ```
   Organizations / Iranian Government / Ministry of Intelligence / محسن رضایی
   ```

5. **Click any organization in the breadcrumb** to jump back to that level
   - Clicking "Iranian Government" shows all people in that organization
   - No need to use browser back button

### Localization

The breadcrumb respects the current locale:
- **English**: Shows `nameEn` if available, falls back to `name`
- **Farsi**: Shows `name` (primary Farsi name)

### Long Hierarchies

For deeply nested organizations (e.g., Government → Ministry → Department → Division → Section → Unit → Team):

**Without truncation** (hard to read):
```
Organizations / Government / Ministry / Department / Division / Section / Unit / Team / Person
```

**With truncation** (improved readability):
```
Organizations / Government / Ministry / ... / Unit / Person
```

## Technical Details

### Performance Considerations

**Backend:**
- Each path lookup requires N database queries (where N = depth)
- Cached at component level (doesn't refetch on re-render)
- Maximum depth limit prevents infinite loops

**Frontend:**
- Path stored in React state (minimal re-renders)
- No need to fetch on every breadcrumb click (uses existing data)
- Smart memoization in useCallback hooks

### Edge Cases Handled

1. **Circular References**: Prevents infinite loops with visited set
2. **Missing Organizations**: Gracefully handles deleted parents
3. **No Organization**: Shows individual name only
4. **Single Organization**: No truncation needed
5. **Exact 4 Organizations**: Shows all (no ellipsis)

### Type Safety

Full TypeScript types ensure consistency:

```typescript
export interface OrganizationPathItem {
  id: number;
  name: string;
  nameEn?: string | null;
}
```

## Testing Recommendations

### Manual Testing

1. **Simple Path**: Organization → Person
   - Verify full path shows

2. **Medium Path**: Org1 → Org2 → Org3 → Person
   - Verify all organizations show

3. **Long Path**: 6+ levels deep
   - Verify truncation works (first 2, ..., last 1)
   - Click each clickable org to verify navigation

4. **Locale Switching**: Change between English and Farsi
   - Verify names update correctly

5. **Edge Cases**:
   - Individual with no organization
   - Organization with missing parent
   - Very long organization names

### Automated Testing

Suggested test cases:

```typescript
describe('OrganizationHierarchy', () => {
  it('should get full path for organization', async () => {
    const path = await getOrganizationPath(childOrgId);
    expect(path).toHaveLength(3);
    expect(path[0].id).toBe(rootOrgId);
    expect(path[2].id).toBe(childOrgId);
  });

  it('should handle circular references', async () => {
    // Create circular ref: A → B → C → A
    const path = await getOrganizationPath(orgA);
    expect(path.length).toBeLessThan(50); // Should not infinite loop
  });

  it('should truncate path when > 4 items', () => {
    const longPath = [org1, org2, org3, org4, org5, org6];
    const displayed = truncatePath(longPath);
    expect(displayed).toEqual([org1, org2, 'ellipsis', org6]);
  });
});
```

## Future Enhancements

Potential improvements:

1. **Tooltip on Ellipsis**: Show hidden organizations in dropdown/tooltip
2. **Breadcrumb Scroll**: Horizontal scroll for very long paths (alternative to truncation)
3. **Path Caching**: Cache organization paths in localStorage or context
4. **Keyboard Navigation**: Arrow keys to navigate breadcrumb
5. **Performance**: Batch fetch all ancestors in single query (CTE/recursive query)
6. **Visual Hierarchy**: Indentation or icons to show depth
7. **Collapsed Mode**: Click to collapse/expand middle sections

## Related Files

**Backend:**
- `backend/src/lib/organization-hierarchy.ts` - Path traversal logic
- `backend/src/controllers/graph.ts` - Updated endpoints

**Frontend:**
- `frontend/hooks/use-graph-data.ts` - Path state management
- `frontend/components/graph/graph-canvas.tsx` - Breadcrumb UI

**Types:**
- `frontend/hooks/use-graph-data.ts` - `OrganizationPathItem` interface

## Migration Notes

- No database schema changes required
- Backward compatible (path is optional in responses)
- Existing bookmarks/URLs continue to work
- No breaking changes to API contracts
