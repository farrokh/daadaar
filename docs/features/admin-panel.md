# Admin Panel Documentation

## Overview

The Daadaar admin panel is a comprehensive platform management interface that provides administrators with full control over users, content, and the knowledge graph. It combines a powerful backend API with an intuitive frontend dashboard.

**Access:** `/admin` (requires admin role)

---

## Architecture

### Backend

**Location:** `backend/src/routes/admin/` and `backend/src/controllers/`

All admin routes are protected by two middleware layers:
1. `authMiddleware` - Ensures user is authenticated
2. `adminMiddleware` - Verifies user has admin role

**CSRF Protection:** All mutating operations (POST, PATCH, DELETE) require a valid CSRF token.

### Frontend

**Location:** `frontend/components/admin/` and `frontend/app/[locale]/admin/`

The admin dashboard uses a tabbed interface with the following components:
- `AdminDashboard` - Main container with tab navigation
- `UserManagementPanel` - User administration
- `IndividualManagementPanel` - Individual (people) management
- `OrganizationManagementPanel` - Organization management
- `RoleManagementPanel` - Role management
- `ContentReportsList` - Content moderation

---

## Features

### 1. User Management

**Purpose:** Manage platform users, assign roles, handle bans, and verify accounts.

**API Endpoints:**
```
GET    /api/admin/users              # List users
PATCH  /api/admin/users/:id          # Update user
DELETE /api/admin/users/:id          # Delete user
```

**Capabilities:**
- Search users by username, email, or display name
- Filter by role (user, moderator, admin)
- Filter by ban status (active, banned)
- Change user roles (user ↔ moderator ↔ admin)
- Ban/unban users with optional expiry date and reason
- Verify/unverify email addresses
- Delete user accounts (cascade deletes all user data)

**UI Features:**
- Inline role selection dropdown
- Status badges (verified, banned)
- Hover-reveal action buttons
- Ban reason tooltips with dynamic reason prompts
- Pagination with page controls
- Error surfacing for failed updates
- Stable data fetching with loading skeletons and inline spinners

---

### 2. Individual Management

**Purpose:** Manage individuals (people) in the knowledge graph and their organizational affiliations.

**API Endpoints:**
```
GET    /api/admin/individuals         # List individuals
PATCH  /api/admin/individuals/:id     # Update individual
DELETE /api/admin/individuals/:id     # Delete individual
```

**Capabilities:**
- Create new individuals with full details
- Assign individuals to organizations
- Assign roles within organizations
- Set role start dates
- Update biographies and personal information
- Delete individuals (cascade deletes role occupancies)

**Smart Features:**
- Auto-creates "Member" role if organization assigned without specific role
- Role dropdown dynamically filters based on selected organization
- Displays current organization and role in list view
- Biography preview with truncation

**UI Features:**
- Collapsible create/edit form
- Organization and role dropdowns
- Date picker for role start date
- Auto-scroll to form on edit
- Search by name
- Success and error feedback messages on submission
- Loading states during creation and updates

---

### 3. Organization Management

**Purpose:** Manage organizations with support for hierarchical relationships.

**API Endpoints:**
```
GET    /api/admin/organizations       # List organizations
PATCH  /api/admin/organizations/:id   # Update organization
DELETE /api/admin/organizations/:id   # Delete organization
```

**Capabilities:**
- Create new organizations
- Establish parent-child relationships (hierarchy)
- Update organization details (name, description, logo)
- Delete organizations (cascade deletes roles and hierarchy)
- Bilingual support (Farsi and English)

**Hierarchy Features:**
- Parent organization selection
- Prevents circular references (can't select self as parent)
- Visual hierarchy indicators in list view
- Cascade delete of child relationships

**UI Features:**
- Parent organization dropdown (excludes self when editing)
- Description textarea
- Logo URL input
- Search by organization name

---

### 4. Role Management

**Purpose:** Manage roles within organizations and their assignments.

**API Endpoints:**
```
GET    /api/admin/roles               # List roles
PATCH  /api/admin/roles/:id           # Update role
DELETE /api/admin/roles/:id           # Delete role
```

**Capabilities:**
- Create roles within organizations
- Update role titles and descriptions
- Filter roles by organization
- Delete roles (cascade deletes role occupancies)
- Bilingual support (title/titleEn, description/descriptionEn)

**Features:**
- Organization-scoped role management
- Full-text search on role titles
- Member count display (individuals with this role)
- Organization context in list view

**UI Features:**
- Organization filter dropdown
- Search by role title
- Create/edit form with bilingual fields
- Member count badge

---

### 5. Content Report Moderation

**Purpose:** Review and moderate user-submitted content reports for policy violations.

**API Endpoints:**
```
GET    /api/admin/content-reports              # List reports
GET    /api/admin/content-reports/:id          # Get report details
PATCH  /api/admin/content-reports/:id/status   # Update status
GET    /api/admin/content-reports/stats        # Get statistics
```

**Report Types:**
- Reports (incident reports)
- Organizations
- Individuals
- Users
- Media

**Report Reasons:**
- Spam
- Misinformation
- Harassment
- Inappropriate content
- Duplicate
- Other

**Report Statuses:**
- Pending (new reports)
- Reviewing (under investigation)
- Resolved (action taken)
- Dismissed (no action needed)

**Capabilities:**
- Filter by status, content type, and reason
- View reporter and content details
- Update report status with admin notes
- Track reviewer and review timestamp
- View moderation statistics

**UI Features:**
- Multi-filter interface (status, type, reason)
- Content preview inline (organization names, user info, etc.)
- Status badges with color coding
- Admin notes textarea
- Statistics dashboard with overview cards
- Reporter and reviewer information display

---

## Security

### Authentication & Authorization

1. **Route Protection:**
   ```typescript
   router.use(authMiddleware);    // Verify user is logged in
   router.use(adminMiddleware);   // Verify user has admin role
   ```

2. **CSRF Protection:**
   All mutating operations require a valid CSRF token:
   ```typescript
   router.patch('/:id', csrfProtection, updateHandler);
   router.delete('/:id', csrfProtection, deleteHandler);
   ```

3. **Role Verification:**
   Admin middleware checks `req.currentUser.role === 'admin'`

### Data Validation

- Input sanitization on all endpoints
- Type validation via TypeScript
- Length limits on text fields
- Required field validation
- Circular reference prevention (organization hierarchy)

### Audit Trail

- All admin actions include:
  - `updatedAt` timestamp
  - `reviewedByUserId` (for content reports)
  - `reviewedAt` timestamp (for content reports)
  - Ban reason tracking
  - Admin notes for moderation decisions

---

## API Response Format

All admin endpoints follow the standard API response format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

### Paginated Responses

```typescript
interface PaginatedResponse<T> {
  success: true;
  data: {
    items: T[];  // users, individuals, organizations, roles, or reports
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}
```

---

## Common Query Parameters

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

### Search
- `q` - Search query (full-text search)

### Filtering
- `role` - Filter by user role (user management)
- `isBanned` - Filter by ban status (user management)
- `organizationId` - Filter by organization (role management)
- `status` - Filter by status (content reports)
- `contentType` - Filter by content type (content reports)
- `reason` - Filter by reason (content reports)

---

## Frontend State Management

### Data Fetching
- Uses `fetchApi` utility for type-safe API calls
- Automatic CSRF token handling
- Error handling with user-friendly messages

### Loading States
- Skeleton screens during initial load
- Inline loading indicators for actions
- Disabled states during updates

### Optimistic Updates
- Immediate UI feedback for user actions
- Automatic refresh after mutations
- Error rollback on failure

### Search Debouncing
- 300ms debounce on search inputs
- Reduces API calls and improves performance
- Resets pagination on search

### UX Stability
- **Stable References**: Critical fetch functions are wrapped in `useCallback` to prevent unnecessary effect re-executions.
- **Form Feedback**: Every management panel includes explicit success (`showSuccess`) and error (`submitError`) states to inform the admin of operation results.
- **Button States**: Submit buttons are disabled during async operations and show "Saving..." or "Deleting..." indicators.
- **Input Prompts**: Destructive or critical actions (like banning a user) prompt for additional context (e.g., ban reason) before execution.

---

## Design System

### Color Coding
- **Green** - Active, verified, resolved
- **Red** - Banned, dismissed, delete actions
- **Blue** - Verified, informational
- **Yellow** - Warning, pending review
- **Gray** - Neutral, inactive

### Typography
- **Headers** - Medium weight, tracking-tight
- **Body** - Regular weight, readable line height
- **Labels** - Uppercase, small, tracking-wider
- **Monospace** - IDs, technical data

### Spacing
- Consistent padding (px-6 py-3 for table cells)
- Gap utilities for flex/grid layouts
- Responsive spacing adjustments

### Animations
- Fade-in for forms (300ms)
- Slide-in from top for create forms
- Opacity transitions for hover states
- Smooth page transitions

---

## Best Practices

### For Administrators

1. **User Management:**
   - Always provide a ban reason when banning users
   - Set appropriate ban expiry dates
   - Verify email addresses only after manual verification
   - Use role changes judiciously

2. **Content Moderation:**
   - Review reports promptly (check pending regularly)
   - Add detailed admin notes for future reference
   - Use "reviewing" status for complex cases
   - Dismiss false reports to keep queue clean

3. **Data Management:**
   - Verify data before deletion (cascade deletes)
   - Use search to find specific items
   - Check relationships before deleting organizations
   - Maintain data integrity in hierarchy

### For Developers

1. **API Development:**
   - Always protect admin routes with both middlewares
   - Include CSRF protection on mutations
   - Validate all inputs thoroughly
   - Return consistent error messages

2. **Frontend Development:**
   - Debounce search inputs
   - Show loading states for all async operations
   - Handle errors gracefully with user feedback
   - Use optimistic updates where appropriate
   - Maintain accessibility standards

3. **Testing:**
   - Test all filter combinations
   - Verify pagination edge cases
   - Test cascade deletes thoroughly
   - Validate CSRF token handling
   - Check role-based access control

---

## Future Enhancements

### Planned Features
- Bulk operations (bulk delete, bulk role change)
- Export functionality (CSV/JSON export)
- Advanced search with multiple criteria
- Audit log viewer for all admin actions
- More granular permissions (e.g., moderator-specific actions)
- Activity timeline for users and content
- Automated moderation rules
- Report assignment to specific moderators

### Performance Optimizations
- Virtual scrolling for large lists
- Infinite scroll option
- Client-side caching
- WebSocket updates for real-time changes
- Background data refresh

---

## Troubleshooting

### Common Issues

**"Unauthorized" error:**
- Ensure user is logged in
- Verify user has admin role
- Check JWT token validity

**CSRF token errors:**
- Ensure CSRF token is fetched before mutations
- Check cookie settings
- Verify CORS configuration

**Pagination not working:**
- Check query parameter format
- Verify page number is within range
- Ensure limit is a positive integer

**Search returns no results:**
- Verify search query format
- Check for typos
- Try broader search terms
- Ensure data exists in database

**Cascade delete failures:**
- Check for foreign key constraints
- Verify database permissions
- Review error logs for specific constraint violations

---

## Related Documentation

- [Backend Architecture](backend.md)
- [Frontend Architecture](frontend.md)
- [Security Guide](security.md)
- [API Types](../../shared/types/index.ts)
- [Database Schema](../data.md)

---

*Last Updated: 2026-01-06*
