# Isolated Organization People View

This document summarizes the recent changes to the **isolated organization people view** (the `?view=people&organizationUuid=...` use case) that were staged in this round of work.

## Goals

1. Always render the isolated organization node with its immediate members, even if it has no people, while showing sub-organization nodes on the left column.
2. Allow revealing deeper hierarchy (sub-organization of a sub-organization) via the toggle button in the isolated view.
3. Adjust layout, member counts, and toggle placement so the isolated experience mirrors the intended storytelling (current org center + sub-orgs left + members right).

## Backend changes

- `GET /api/graph/organization/:id/people` now:
  - Loads every child organization and their grandchildren before building nodes/edges so the isolated graph can expand one level deeper without additional refetches.
  - Uses `getBatchRecursiveMemberCounts` for each child/grandchild when constructing node data so badges on the left column show sum counts from their entire subtree.
  - Keeps the center organization’s `memberCount` as the count of individuals directly assigned to it (no recursive sum), matching the isolated view badge expectation.
  - Returns `parentOrgId` metadata for sub-organizations (for layout/toggling) and wires up additional hierarchy edges toward grandchildren so the frontend can flatten the left column.

## Frontend changes

- `frontend/lib/organization-people-layout.ts` now:
  - Groups child nodes by depth relative to the main organization and spaces them on progressively negative X offsets.
  - Continues to place individuals on the right side, preserving the people-column pattern.

- `GraphCanvas` (`frontend/components/graph/graph-canvas.tsx`):
  - Tracks which sub-organizations have been expanded inside the isolated people view and filters nodes accordingly so grandchildren only render after their parent’s toggle is pressed.
  - Injects `toggleOnLeft` into each organization node while in people mode, enabling the toggle button to shift from the right edge to the left edge for the entire isolated graph.

- `BaseNodeCard` and `OrganizationNode` now accept `toggleOnLeft` to reposition the toggle button when rendering the isolated hierarchy. The button still keeps the same icon, count, and label but renders before (left side) or after (right side) the card based on the flag.

## Testing notes

- Manual inspection via the people URLs (`?view=people&organizationUuid=...`) should show:
  1. The main node centered with its `memberCount`.
  2. Child organizations in the left column; clicking their toggle reveals grandchildren instead of navigating away.
  3. The toggle button sitting on the left side for every card rendered in the isolated people view.

Consider adding an API test that asserts the people endpoint returns sub-organization and grandchild nodes even when the root has no roles.
