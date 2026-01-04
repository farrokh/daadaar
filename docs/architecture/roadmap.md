# Roadmap & Strategic Phases

The development of Daadaar is organized into three strategic phases, moving from a core MVP to an advanced, AI-powered insights platform.

---

## 📊 Implementation Status Overview

### ✅ Completed Features

#### Core Infrastructure
- [x] **Monorepo Setup**: Next.js 16, Express.js, TypeScript, Tailwind CSS 4
- [x] **i18n Framework**: next-intl with Persian primary language and RTL support
- [x] **Database Schema**: PostgreSQL with Drizzle ORM (15 tables implemented)
- [x] **Redis Integration**: Upstash for sessions and rate limiting
- [x] **S3 Media Storage**: AWS S3 with AVIF optimization and presigned URLs

#### Authentication & Security
- [x] **Unified Authentication**: Anonymous sessions + Email/Password + OAuth (Google)
- [x] **Proof-of-Work System**: Client-side SHA-256 solver with backend hash verification
- [x] **CSRF Protection**: Custom token-based library with automatic cleanup
- [x] **Session-Based Rate Limiting**: VPN-friendly rate limiting tied to sessions
- [x] **Database Indexes**: 40+ performance indexes across all tables

#### Graph & Visualization
- [x] **Interactive Graph Visualization**: React Flow with organizations, roles, and individuals
- [x] **Timeline Filtering**: Dual-handle range slider for temporal filtering
- [x] **Organization CRUD**: Create, read, update operations with hierarchy management
- [x] **Individual CRUD**: Person management with inline role creation
- [x] **Role Management**: Role creation and assignment to organizations
- [x] **Graph Toolbar**: Context-aware management tools with add organization/person modals

#### Report System
- [x] **Report Submission Form**: Multi-step form with validation and media upload
- [x] **PoW Integration**: Report submission requires PoW challenge solving
- [x] **Media Upload**: Direct upload with AVIF conversion and S3 storage
- [x] **Report Linking**: Link reports to individuals and roles

#### Developer Experience
- [x] **Shared API Types**: Type-safe request/response interfaces
- [x] **Modular Architecture**: Separated concerns with custom hooks and utilities
- [x] **Documentation Suite**: Comprehensive architecture documentation

---

## 🚧 In Progress (Phase 1 - MVP Completion)

### High Priority
- [ ] **Voting Mechanism**: Upvote/downvote with PoW for anonymous users, session-based duplicate prevention, and atomic vote count updates
- [ ] **AI Verification (Basic)**: OpenAI GPT-4 API integration for report analysis and confidence scoring with background job queue (BullMQ)
- [ ] **Full-Text Search**: PostgreSQL tsvector/tsquery implementation for searching reports by organization, role, individual, date range, and AI confidence

### Medium Priority
- [ ] **User Trust Score System**: Calculation and tracking system for organization creation permissions
- [ ] **Content Reporting System**: Universal reporting for incorrect/inappropriate content across all entities (reports, organizations, individuals, users, media)
- [ ] **Admin Roles & Banning**: User/moderator/admin roles with banning system for registered users and anonymous sessions, plus ban history tracking

---

## 📋 Phase 2: Enhanced Features

### Moderation & Administration
- [ ] **Admin Dashboard**: Full suite for reviewing content reports, managing bans, and moderation actions
- [ ] **Ban Management UI**: Interface for temporary/permanent bans with reason tracking
- [ ] **Content Moderation Workflow**: Review, resolve, dismiss, and escalate reported content

### Organization Management
- [ ] **Trust-Based Creation**: Phase 1 (open creation) → Phase 2 (trusted users only)
- [ ] **Organization Hierarchy Tools**: Advanced visualization and management of parent-child relationships
- [ ] **Trust Score Dashboard**: Analytics for user reputation and contribution quality

### Session & Account Management
- [ ] **Secure Session Transfer**: One-time migration system with singular session guarantee (old session invalidation)
- [ ] **Account Claiming**: Allow anonymous users to claim their session by creating an account

### Infrastructure & Deployment
- [ ] **Cloudflare Configuration**: DDoS protection, rate limiting, encryption, security headers, and input validation
- [ ] **AWS Infrastructure**: S3 bucket, ECS cluster, RDS PostgreSQL, ALB setup
- [ ] **Production Deployment**: Frontend to AWS Amplify/EC2, backend to AWS ECS, environment variables, and monitoring (Sentry, PostHog, CloudWatch)

---

## 🔭 Phase 3: Advanced Intelligence

### Analytics & Insights
- [ ] **Graph Analytics**: Social network analysis to identify key nodes and influence clusters
- [ ] **AI-Powered Relationship Discovery**: Automated detection of connections between entities
- [ ] **Trust Score Analytics Dashboard**: Comprehensive reputation tracking and visualization

### Extended Functionality
- [ ] **Export Functionality**: Reports and graph data export in multiple formats
- [ ] **Third-Party API**: Developer portal for data research and integration
- [ ] **Advanced Search with AI**: AI-assisted search suggestions and semantic queries

### Mobile & Beyond
- [ ] **Mobile Application**: React Native iOS/Android app
- [ ] **Push Notifications**: Real-time alerts for report updates and moderation actions
- [ ] **Offline Support**: PWA capabilities for high-censorship environments

---

## ✅ Recent Improvements (January 2026)

### Security Enhancements
- **Complete PoW Hash Verification**: Backend now recomputes `hash(nonce + solutionNonce)` to prevent hash spoofing
- **CSRF Protection Library**: Token generation, validation middleware, and automatic cleanup
- **S3 Upload Error Handling**: Automatic database cleanup on failed uploads to prevent orphaned records

### Performance Optimizations
- **Database Indexes**: 
  - Reports: 3 new indexes (incident_date, user_id, session_id)
  - Media: 3 new indexes (user_id, session_id, is_deleted)
  - PoW Challenges: 1 new index (is_used)
  - Votes: Check constraint (user_id OR session_id required)
- **AVIF Image Pipeline**: Sharp library for 70-80% file size reduction
- **CDN Configuration**: Cloudflare CDN documentation for `media.daadaar.com` (78% cost reduction, 50-80% latency improvement)

### Developer Experience
- **Shared API Types**: `shared/api-types.ts` with compile-time type safety
- **Translation Keys**: Added missing keys for report submission, PoW solving, and media upload
- **Architecture Refactor**: Modular documentation suite replacing monolithic summary

---

## 🎯 Next Immediate Steps

### Critical Path (Next 2 Weeks)
1. **Voting System**: Complete voting endpoints with PoW validation for anonymous users
2. **AI Verification**: Implement BullMQ job queue and OpenAI integration
3. **Search Implementation**: Add full-text search with PostgreSQL tsvector

### Short-Term (Next Month)
4. **Trust Score System**: Implement calculation logic and database tracking
5. **Content Reporting**: Build universal reporting system with admin review workflow
6. **Admin Dashboard**: Create moderation interface for content review and ban management

### Medium-Term (Next Quarter)
7. **AWS Deployment**: Complete infrastructure setup and production deployment
8. **Session Transfer**: Implement secure migration with singular session enforcement
9. **Cloudflare Integration**: Configure CDN, WAF, and DDoS protection

---

*Last Updated: January 4, 2026*  
*Back to [Architecture Overview](README.md)*
