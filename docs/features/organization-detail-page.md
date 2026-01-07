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

### 2. Context & Hierarchy
- **Description**: Full localized description of the organization.
- **Parent Organization**: Links to the parent entity if applicable (currently displays ID, future update will link via UUID).

### 3. Graph Integration
- **"View on Graph" Button**: detailed deep-link into the interactive graph view, focusing on the specific organization.
- **Graph Nodes**: Updated `OrganizationNode` in the graph view now includes a "View Profile" link that navigates back to this detail page, creating a seamless loop between exploration and detailing.

### 4. Sharing
- **Share Button**: Integrated share functionality copying the secure UUID-based link.

## Implementation Details

### Frontend
- **Page Component**: `frontend/app/[locale]/org/[uuid]/page.tsx` uses `fetchApi` to retrieve organization details via the public `/share/org/:uuid` endpoint.
- **Graph Node**: `OrganizationNode` updated to receive `shareableUuid` and render `BaseNodeCard` with a `shareUrl` prop.
- **BaseNodeCard**: Updated to render an `ExternalLink` icon when `shareUrl` is provided.

### Backend
- **Graph Controllers**: Updated `getOrganizationsGraph` and `getOrganizationPeople` to include `shareableUuid` in their responses, enabling the frontend to construct deep links.

## Future Enhancements
- **Member List**: Display a preview of top members directly on the detail page.
- **Related Reports**: List recent verification reports filed against this organization.
- **Map Integration**: Show HQ location if available.
