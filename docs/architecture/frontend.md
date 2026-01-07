# Frontend Architecture

The Daadaar frontend is a high-performance, localized web application built with a focus on interactive visualization and premium user experience.

## Tech Stack
- **Framework**: Next.js 16+ (App Router)
- **Library**: React 19+
- **Styling**: Tailwind CSS 4 (Custom Design System)
- **Visualization**: React Flow
- **State Management**: Zustand
- **Internationalization**: next-intl
- **Hosting**: Vercel (global edge CDN)

---

## 🌎 Internationalization (i18n)

Persian (fa) is our primary locale, with full Right-to-Left (RTL) support.

### Strategy
- **Localized Routing**: Prefixed URLs (e.g., `/fa/reports`, `/en/reports`).
- **Server Components**: next-intl handles translations in React Server Components for optimal performance.
- **RTL Support**: Automatic layout direction adjustment based on the locale.
- **SEO**: `hreflang` tags, localized metadata, dynamic `sitemap.xml`, and `robots.txt` configuration.

---

## 📊 Graph Visualization

The centerpiece of the platform is the interactive graph showing connections between organizations and individuals.

### Interactive Components
- **GraphCanvas**: The primary rendering area using React Flow.
- **Node Design**: Glassmorphic cards with dynamic gradients.
  - **Standard View**: Compact card with image and name.
  - **Detail View**: Expanded card with full description/biography and larger imagery, used when drilling down into an entity.
- **Layout Engine**: Custom BFS-based grid layout (`graph-layout.ts`) for clean node distribution.
- **Temporal Filtering**: A dual-handle timeline slider allowing users to view the graph at different points in history.

---

## 🎨 Design System & UX

Our design system prioritizes a "Premium, State-of-the-art" feel.

### Key Principles
- **Glassmorphism**: Subtle transparency and background blurs for a modern look.
- **Dynamic Theming**: Native support for system light/dark modes using CSS variables.
- **Micro-animations**: GSAP and CSS transitions for interactive feedback.
- **Responsive Layouts**: Mobile-first design that scales elegantly to ultra-wide displays.

---

## 🏗️ Core Components

1. **Organization Gallery**: Hierarchical view of government bodies.
2. **Individual Profiles**: Detailed timelines of an individual's roles and linked reports.
3. **Authentication System**:
   - **Signup**: Premium glassmorphic registration flow with email verification.
   - **Login**: Secure access with persistent sessions.
4. **Report Submission**: A multi-step, validated form featuring:
   - Proof-of-Work (PoW) client-side solver.
   - Tiptap rich text editor.
   - Secure media uploader with AVIF processing.
5. **Voting Interface**: Optimistic UI for instant feedback.
6. **Legal & Compliance**: Dedicated pages for Terms of Service and Privacy Policy.
7. **Admin Dashboard** (`/admin`): Comprehensive platform management interface (admin-only).

---

## 🔧 Admin Dashboard

The admin dashboard provides a centralized interface for platform management, accessible only to users with admin role.

### Components

#### 1. **User Management Panel** (`UserManagementPanel`)
Manage all platform users with comprehensive controls.

**Features:**
- **Search**: Real-time search by username, email, or display name
- **Filtering**: 
  - Role filter (user, moderator, admin)
  - Status filter (active, banned)
- **Actions**:
  - Change user role (inline dropdown)
  - Ban/unban users with reason tracking
  - Verify/unverify email addresses
  - Delete user accounts
- **Display**: 
  - User badges (verified, banned status)
  - Ban reason tooltips
  - Creation date
  - Hover-reveal action buttons
- **Pagination**: Client-side pagination with page controls

#### 2. **Individual Management Panel** (`IndividualManagementPanel`)
Manage individuals (people) in the knowledge graph.

**Features:**
- **Create/Edit Form**:
  - Full name and biography
  - Organization assignment (dropdown)
  - Role assignment (filtered by selected organization)
  - Start date for role occupancy
  - Collapsible form with smooth animations
- **Search**: Real-time search by name
- **Display**:
  - Current organization and role
  - Biography preview (truncated)
  - Creation date
- **Actions**:
  - Edit individual details
  - Delete individuals
  - Auto-scroll to form on edit
- **Smart Features**:
  - Auto-creates "Member" role if organization selected without specific role
  - Role dropdown dynamically filters based on organization

#### 3. **Organization Management Panel** (`OrganizationManagementPanel`)
Manage organizations with hierarchy support.

**Features:**
- **Create/Edit Form**:
  - Organization name and description
  - Parent organization selection (hierarchy)
  - Prevents circular references (can't select self as parent)
- **Search**: Real-time search by organization name
- **Display**:
  - Parent organization name
  - Description preview
  - Creation date
- **Actions**:
  - Edit organization details
  - Delete organizations
  - Manage hierarchical relationships
- **Hierarchy Support**:
  - Parent-child organization relationships
  - Visual hierarchy indicators

#### 4. **Role Management Panel** (`RoleManagementPanel`)
Manage roles within organizations.

**Features:**
- **Create/Edit Form**:
  - Role title and description
  - Organization assignment (required)
  - Bilingual support (title/titleEn, description/descriptionEn)
- **Filtering**:
  - Filter by organization
  - Search by role title
- **Display**:
  - Organization name for each role
  - Description preview
  - Member count (individuals with this role)
  - Creation date
- **Actions**:
  - Edit role details
  - Delete roles
  - View role occupancies

#### 5. **Content Reports List** (`ContentReportsList`)
Moderate user-submitted content reports.

**Features:**
- **Filtering**:
  - Status (pending, reviewing, resolved, dismissed)
  - Content type (report, organization, individual, user, media)
  - Reason (spam, misinformation, harassment, etc.)
- **Display**:
  - Reporter information
  - Content details (inline preview)
  - Report reason and description
  - Status badges with color coding
  - Admin notes
  - Reviewer information
- **Actions**:
  - Update report status
  - Add admin notes
  - View full content details
- **Statistics Dashboard**:
  - Reports by status (pending, reviewing, resolved, dismissed)
  - Reports by content type
  - Quick overview cards

### Design Patterns

**Consistent UI Elements:**
- Glass-effect cards with subtle borders
- Hover-reveal action buttons for cleaner interface
- Color-coded status badges (green=active, red=banned/dismissed, blue=verified)
- Smooth animations for form show/hide
- Responsive tables with horizontal scroll on mobile
- Debounced search inputs (300ms) to reduce API calls
- Loading states with skeleton screens
- Error handling with user-friendly messages

**Accessibility:**
- Semantic HTML with proper ARIA labels
- Keyboard navigation support
- Focus management for modals and forms
- Screen reader friendly status indicators
- High contrast mode support

---

## 🛠️ State Management

- **URL State**: Used for filters, search queries, and graph coordinates.
- **Zustand**: Global state for user sessions, navigation, and theme preferences.
- **React Context**: Used for localized, component-level state (e.g., Form contexts).

---

## 🚀 Deployment & Environment

### Production URLs
- **Frontend**: https://www.daadaar.com
- **API**: https://api.daadaar.com/api

### Vercel Environment Variables
Required in production:
- `NEXT_PUBLIC_API_URL=https://api.daadaar.com/api`
- `NEXT_PUBLIC_APP_URL=https://www.daadaar.com`
- `NEXT_PUBLIC_AWS_S3_BUCKET=daadaar-media-v1-317430950654`
- `NEXT_PUBLIC_AWS_REGION=us-east-1`
- `NEXT_PUBLIC_MOCK_MEDIA_SERVER=false`

Optional:
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_SENTRY_DSN`

### Canonical Domain
`www.daadaar.com` is the canonical frontend origin used for CORS and app metadata.

---
*Back to [README](README.md)*
