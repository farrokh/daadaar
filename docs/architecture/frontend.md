# Frontend Architecture

The Daadaar frontend is a high-performance, localized web application built with a focus on interactive visualization and premium user experience.

## Tech Stack
- **Framework**: Next.js 16+ (App Router)
- **Library**: React 19+
- **Styling**: Tailwind CSS 4 (Custom Design System)
- **Visualization**: React Flow
- **State Management**: Zustand
- **Internationalization**: next-intl

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

---

## 🛠️ State Management

- **URL State**: Used for filters, search queries, and graph coordinates.
- **Zustand**: Global state for user sessions, navigation, and theme preferences.
- **React Context**: Used for localized, component-level state (e.g., Form contexts).

---
*Back to [README](README.md)*
