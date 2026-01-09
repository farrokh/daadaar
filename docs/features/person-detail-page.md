# Person Detail Page

## Overview
The Person Detail Page provides a dedicated, shareable, and verifying presence for individuals in the Daadaar platform. It connects the individual's biography with their role history (via graph) and associated verification reports.

## URL Structure
- Path: `/[locale]/person/[uuid]`
- Example: `/en/person/69faea6d-ccac-4f2e-88c3-e5bb4306404d`

## Features

### 1. Identity
- **Profile Image**: Large profile image (presigned secure URL).
- **Name**: Full localized name (Farsi/English).
- **Biography**: Detailed biography section.
- **Metadata**: "Added on" date.
- **Error Handling**: Strict 404 (Not Found) if profile is missing.
- **Localization**: URL routing preserves the user's selected language (e.g., `/fa/person/...`).

### 2. Report History
- **Associated Reports**: Displays a chronological list of verified reports linked to this individual.
- **Deep Links**: Each report card links to the full Report Detail page.

### 3. Career History
- **Role Occupancy Timeline**: Chronological sidebar listing roles held, start/end dates, and associated organizations.
- **Organization Linking**: Each entry links back to the organization's public detail page.

### 3. Graph Integration
- **Graph Nodes**: The Person nodes in the interactive graph include a "View Profile" link (visible in isolated view) that navigates to this detail page.

### 4. Sharing & SEO
- **Share Button**: Copies the secure UUID-based link.
- **Social Previews**: Dynamic `generateMetadata` ensures rich social cards (Open Graph, Twitter) with the individual's name, biography snippet, and profile image. Includes **fallback image support** (Daadaar logo) to ensure links always look professional even if the profile image is missing or fails to load.

## Implementation Details

### Frontend
- **Page Component**: `frontend/app/[locale]/person/[uuid]/page.tsx` (Server Component).
  - Fetches data via `/share/individual/:uuid`.
  - Generates SEO metadata with fallback images.
- **UI Component**: `frontend/components/person/person-detail.tsx` (Client Component).
  - Renders the profile header, biography, and "Associated Reports" list.
  - Fully localized.

### Backend
- **Share Controller**: `getIndividualByUuid` in `backend/src/controllers/share.ts` updated to:
  - Fetch basic individual data.
  - Fetch associated published reports (joined via `reportLinks`).
  - Fetch career history (role occupancy) records.
  - Sign profile image URLs if they are S3 keys.
