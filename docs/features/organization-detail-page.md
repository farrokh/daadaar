# Organization Detail Page

## Overview
The Organization Detail Page provides a dedicated, shareable, and verifying presence for organizations in the Daadaar platform. It leverages the hybrid ID system (UUIDs for public access) to ensure security and prevents enumeration.

## URL Structure
- Path: `/[locale]/org/[uuid]`
- Example: `/en/org/550e8400-e29b-41d4-a716-446655440000`

## Features

### 1. Identity & Verification
- **Logo & Name**: Prominently displayed with official styling.
- **Verified Status**: (Planned) Visual indicators for verified entities.
- **Metadata**: Creation date and other public metadata.
- **Error Handling**: Strict 404 (Not Found) response if the UUID is invalid or the organization does not exist, preventing generic empty pages.

### 2. Context & Hierarchy
- **Localization**: Fully locale-aware navigation (preserving language preference across links).
- **Description**: Full localized description of the organization.
- **Parent Organization**: Clickable link to the parent organization's detail page (localized name).
- **Sub-Organizations**: Section displaying a grid of child organizations with logos and descriptions.

### 3. Related Relations
- **Member List**: Displays a list of individuals who are members of the organization, with their roles and profile images. Links directly to their Person Detail pages.

### 4. Graph Integration
- **"View on Graph" Button**: detailed deep-link into the interactive graph view, focusing on the specific organization.
- **Graph Nodes**: Updated `OrganizationNode` in the graph view now includes a "View Profile" link that navigates back to this detail page, creating a seamless loop between exploration and detailing.

### 5. Sharing & SEO
- **Share Button**: Integrated share functionality copying the secure UUID-based link.
- **Social Previews**: Optimized Open Graph and Twitter Card metadata with fallback images (site logo) to ensure robust previews on social platforms.

### 6. Administrative Actions (Authenticated)
- **Add Organization**: Button to create a new sub-organization directly under the current organization.
- **Add Individual**: Button to create a new individual and immediately assign them a role within the current organization.

## Implementation Details

### Frontend
- **Page Component**: `frontend/app/[locale]/org/[uuid]/page.tsx` uses `fetchApi` to retrieve organization details via the public `/share/org/:uuid` endpoint.
- **Components**: 
  - `OrganizationDetail`: UI component rendering header, description, graph link, and member list.
  - `generateMetadata`: Server-side function for dynamic SEO tags with fallback image support.
- **Graph Node**: `OrganizationNode` updated to receive `shareableUuid` and render `BaseNodeCard` with a `shareUrl` prop.

### Backend
- **Share Controller**: `getOrganizationByUuid` updated to fetch and return associated `members` (with signed profile images).
- **Graph Controllers**: Updated `getOrganizationsGraph` and `getOrganizationPeople` to include `shareableUuid`.

## Future Enhancements
- **Related Reports**: List recent verification reports filed against this organization.
- **Map Integration**: Show HQ location if available.
