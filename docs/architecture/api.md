# API Architecture & Endpoints

## Overview

The Daadaar API is built with Express.js and follows RESTful principles. It serves as the bridge between the frontend application, the PostgreSQL database, and AWS services (S3, App Runner).

## Public vs. Private APIs

- **Public APIs**: Accessible without authentication. Used for viewing reports, graphs, and shared content.
- **Protected APIs**: Require session authentication via Passport.js (Google/Discord). Used for submissions, voting, and admin actions.

## Shareable Links (UUIDs)

To enhance security and prevent resource enumeration, we use **UUIDs** for all public-facing URLs.

### Endpoints

| Endpoint | Method | Description | Params |
| :--- | :--- | :--- | :--- |
| `/api/share/org/:uuid` | GET | Fetch organization details by UUID | `uuid`: v4 UUID |
| `/api/share/individual/:uuid` | GET | Fetch individual details by UUID | `uuid`: v4 UUID |
| `/api/share/report/:uuid` | GET | Fetch report details by UUID | `uuid`: v4 UUID |
| `/api/share/user/:uuid` | GET | Fetch public user profile by UUID | `uuid`: v4 UUID |
| `/api/content-reports` | POST | Submit a content report | Body: `targetId`, `targetType`, `reason` |

### Security Features
- **Validation**: all UUIDs are validated against v4 format regex.
- **Scoping**:
  - Reports: Must be `isPublished=true` and `isDeleted=false`.
  - Users: Only returns public fields (`displayName`, `username`, `profileImageUrl`, etc.).
- **Rate Limiting**: Applied via Redis to prevent abuse.

## Graph API

The Graph API visualization endpoints power the interactive canvas.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/graph/organizations` | GET | Full hierarchy tree of organizations |
| `/api/graph/organization/:id/people` | GET | People/Roles within a specific organization |
| `/api/graph/individual/:id/reports` | GET | Reports linked to a specific individual |

*Note: Graph APIs currently use internal Integer IDs for performance, but the frontend resolves public UUIDs to these IDs before request.*

## Media Handling

- **Uploads**: Authenticated users get a Presigned POST URL to upload directly to S3.
- **Downloads**: Private content is served via Presigned GET URLs (expires in 1h).
- **Public**: Public assets are served via Cloudflare CDN (`media.daadaar.com`).

---

## Error Handling

- **Validation Errors (400)**: Specific validation failures (like hierarchy cycles) return standard 400 responses with `code: 'VALIDATION_ERROR'` and a descriptive message.
- **Internal Errors (500)**: Uncaught exceptions are logged and return a generic 500 status.

