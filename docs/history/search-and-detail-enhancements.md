# History: Search and Detail Page Enhancements

Date: January 8, 2026
Branch: `feat/search-and-detail-enhancements`

## Objective
To improve the discoverability of content within the graph view and provide richer information on entity detail pages while fixing navigation and data display bugs.

## Summary of Changes

### 1. Graph Search System
- **Real-time Search**: Implemented a `GraphSearchPanel` component that queries Organizations, People, and Reports simultaneously.
- **Accessibility**: Implemented the WAI-ARIA Combobox pattern, ensuring full keyboard navigation and screen reader support.
- **Locale Awareness**: The search system dynamically adjusts which fields it prioritizes (e.g., `nameEn` vs `name`) based on the active UI language.
- **Partial Failure Handling**: Added logic to detect and notify users if one of the search providers (e.g., Reports API) fails while others succeed.

### 2. Organization Detail Improvements
- **Hierarchy Visualization**: Added links to the parent organization and a list of sub-organizations.
- **API Extension**: Updated the backend `getOrganizationByUuid` controller to fetch and link these hierarchical relationships.

### 3. Individual Career History Fix
- **Data Gap**: Resolved an issue where career history was missing on public individual pages. 
- **Backend Fix**: Updated the shareable individual fetcher to include `roleOccupancy` records linked with their respective organization names and UUIDs.
- **Safety**: Introduced `MAX_CAREER_HISTORY` limit to ensure performance stability.

### 4. Navigation UX
- **Browser History Support**: Updated the graph navigation logic to use `router.push` instead of `router.replace`. This enables the native browser back/forward buttons to navigate between previously visited states in the interactive graph.

## Technical Implementation Details

### Frontend Components
- `GraphSearchPanel`: Core search logic and UI.
- `GraphDock`: Adjusted layout to accommodate the search dropdown.
- `OrganizationDetail`: Updated to render sub-organization cards.

### Backend Controllers
- `src/controllers/share.ts`: 
    - Extended with parent/child fetching logic.
    - Added role history fetching for individuals.
    - Implemented result limits for database queries.

### Shared Logic
- `shared/types/index.ts`: Updated `Organization` interface to support nested parent/child objects.
- `messages/`: Added missing i18n keys for graph search and hierarchical terminology.
