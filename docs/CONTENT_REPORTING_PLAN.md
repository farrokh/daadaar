# Content Reporting Implementation Plan

## Overview
The Content Reporting System allows users (both registered and anonymous) to report inappropriate content across the platform. This includes reports, organizations, individuals, and media items.

## 1. Database Schema
**Table**: `content_reports`
- `id`: Serial Primary Key
- `content_type`: Enum ('report', 'organization', 'individual', 'user', 'media')
- `content_id`: Integer (ID of the reported entity)
- `reason`: Enum ('spam', 'misinformation', 'harassment', 'inappropriate', 'duplicate', 'other')
- `description`: Text (Optional details)
- `status`: Enum ('pending', 'reviewing', 'resolved', 'dismissed')
- `reporter_user_id`: Integer (FK to users, nullable)
- `reporter_session_id`: String (FK to sessions, nullable)
- `reviewed_by_user_id`: Integer (FK to users, nullable)
- `admin_notes`: Text
- `created_at`: Timestamp
- `updated_at`: Timestamp

## 2. API Endpoints

### Public Routes
- `POST /api/content-reports`: Submit a new report
  - Requires CSRF token
  - Rate limited (standard + strict for anonymous) [TODO]

### Admin Routes (Protected)
- `GET /api/admin/content-reports`: List reports (w/ pagination, filters)
- `GET /api/admin/content-reports/stats`: Aggregate statistics
- `GET /api/admin/content-reports/:id`: Get detailed report view
- `PATCH /api/admin/content-reports/:id`: Update status/notes

## 3. Frontend Components

### Submission UI
- `ReportContentButton`: Reusable component that handles the reporting flow.
  - Props: `contentType`, `contentId`, `icon?`, `label?`
  - Opens a modal with reason selection and description field
  - Handles submission and success/error states

### Admin Dashboard (Planned)
- `AdminSidebar`: Navigation for admin area
- `ReportList`: Data table with status badges and filters
- `ReportDetail`: Detailed view of the report and the reported content

## 4. Implementation Status
- [x] Database Schema & Migrations
- [x] Backend Controller (`createContentReport`)
- [x] Backend Routes (Rate limiting pending)
- [x] Frontend `ReportContentButton`
- [x] Integration on Report Detail Page
- [x] Integration on Media Items
- [x] Integration on Organization/Individual Pages
- [ ] Admin Dashboard UI
- [ ] Email Notifications

## 5. Testing
See `docs/CONTENT_REPORTING_TESTING.md` for manual testing steps.
