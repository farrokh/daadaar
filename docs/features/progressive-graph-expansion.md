# Progressive Graph Expansion Feature

**Date**: 2026-01-08  
**Status**: In Review

## Overview

The progressive graph expansion feature allows users to explore the organization hierarchy layer by layer, preventing information overload by initially showing only two levels of the graph and allowing users to expand nodes to reveal their sub-organizations on demand.

## User Experience

### Initial Load
- The graph displays root organizations and their immediate children (2 layers total)
- Organizations with hidden children show an expansion indicator on the right side of the card
- The expansion indicator displays:
  - A rotated Network icon (90 degrees)
  - The count of hidden sub-organizations
  - A label (e.g., "3 Sub-orgs")

### Interaction
- **Expanding**: Click the expansion indicator to reveal an organization's children
  - New child nodes appear in the graph
  - The indicator changes to show "Collapse"
  - The graph layout updates smoothly
- **Collapsing**: Click the "Collapse" indicator to hide children
  - Child nodes disappear from the graph
  - The indicator returns to showing "Sub-orgs"
  - The graph layout adjusts

### Navigation
- Clicking on organization nodes in the organizations view does NOT navigate to the people view
- Expansion/collapse is controlled exclusively through the expansion indicators
- In people or reports view, clicking organization nodes still navigates as expected

## Technical Implementation

### Backend Changes

**File**: `backend/src/controllers/graph.ts`

Added queries to calculate:
- `memberCount`: Number of unique individuals in each organization
- `childCount`: Number of direct child organizations

```typescript
// Fetch child counts for each organization
const childCounts = await db
  .select({
    parentId: schema.organizationHierarchy.parentId,
    count: sql<number>`count(${schema.organizationHierarchy.childId})`,
  })
  .from(schema.organizationHierarchy)
  .groupBy(schema.organizationHierarchy.parentId);
```

### Frontend Changes

#### Types (`frontend/components/graph/types.ts`)

Added properties to `OrganizationNodeData`:
```typescript
memberCount?: number;
childCount?: number;
onExpand?: () => void;
onToggleChildren?: () => void;
isExpanded?: boolean;
```

#### Graph Data Hook (`frontend/hooks/use-graph-data.ts`)

**State Management**:
- `expandedOrgIds`: Set of organization IDs that are currently expanded
- `allNodesRef`: Stores the complete graph data
- `allEdgesRef`: Stores all edges

**Key Functions**:
- `toggleChildOrgExpansion(orgId)`: Toggles expansion state for an organization
- Visibility computation: Uses BFS to determine which nodes should be visible based on expansion state

**Initial Expansion**:
```typescript
// Auto-expand root nodes to show their immediate children (2 levels)
const rootNodeIds = rawNodes
  .filter(n => !rawEdges.some(e => e.target === n.id && e.type === 'hierarchy'))
  .map(n => (n.data as { id: number }).id);

setExpandedOrgIds(new Set(rootNodeIds));
```

#### UI Components

**`base-node-card.tsx`**: 
- Displays expansion indicator on the right side of the card
- Shows Network icon (rotated 90°), count, and label
- Handles click events to trigger expansion/collapse

**`graph-canvas.tsx`**:
- Injects expansion callbacks into organization nodes
- Prevents navigation when clicking organization nodes in organizations view
- Maps expansion state to node data

## Design Considerations

### Performance
- Only visible nodes are rendered in the graph
- Layout recalculation happens only when expansion state changes
- Full graph data is stored in refs to avoid re-fetching

### User Experience
- Smooth transitions when expanding/collapsing
- Clear visual feedback (badge text changes, icon rotation)
- Prevents accidental navigation by separating expansion from node clicks

### Accessibility
- Buttons have proper `aria-label` attributes
- Planned keyboard navigation support (see Future Enhancements #5 for keyboard shortcuts)
- Visual indicators are clear and distinct

## Future Enhancements

Potential improvements:
1. Add animation for node appearance/disappearance
2. Remember expansion state in URL parameters
3. Add "Expand All" / "Collapse All" controls
4. Show loading state during layout recalculation for large graphs
5. Add keyboard shortcuts for expansion (e.g., Space or Enter on focused node)

## Related Files

- `backend/src/controllers/graph.ts`
- `frontend/hooks/use-graph-data.ts`
- `frontend/components/graph/types.ts`
- `frontend/components/graph/base-node-card.tsx`
- `frontend/components/graph/organization-node.tsx`
- `frontend/components/graph/graph-canvas.tsx`
