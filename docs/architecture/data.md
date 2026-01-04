# Data Architecture & Persistence

The platform manages complex relational data and high-volume media assets with a focus on integrity, searchability, and performance.

## Storage Layers

1. **PostgreSQL**: Primary relational storage for entities, reports, and relationships.
2. **Redis (Upstash)**: Ephemeral storage for sessions, rate limits, and PoW challenges.
3. **AWS S3**: Object storage for evidence-based media (images/videos).

---

## 🏗️ Core Entities (ERD Summary)

| Entity | Description |
| :--- | :--- |
| **Organizations** | Hierarchical government bodies (Nodes). |
| **Individuals** | People associated with organizations (Nodes). |
| **Roles** | Specific positions within organizations. |
| **Role Occupancy** | Temporal link between Individuals and Roles (Edges). |
| **Reports** | Claims filed against individuals/roles. |
| **Votes** | Community credibility assessments. |
| **Media** | Attachments linked to reports. |
| **Users** | Registered identities (Admin, Moderator, User). |

*Note: All entities (Reports, Organizations, Individuals, Roles) support attribution to either a `userId` or a `sessionId`.*

---

## 🛠️ Performance & Scalability

### Advanced Indexing
We have implemented 40+ indexes across the schema. Key optimizations include:
- **Timeline Performance**: B-tree indexes on `incident_date`, `start_date`, and `end_date`.
- **User Activity**: Indexes on `user_id` and `session_id` for fast contribution retrieval.
- **Search**: PostgreSQL GIN indexes for full-text search capability.

### Graph Queries
To retrieve hierarchical data (organizations) and social graphs (individual connections), we use **Recursive Common Table Expressions (CTEs)**. This allows us to fetch deep trees and related clusters in a single efficient database round-trip.

---

## 📂 Media Management

### Secure Delivery
Media assets are stored in private S3 buckets. Access is granted via **Presigned GET URLs** with a short expiration (1 hour), ensuring files aren't leaked or hotlinked.

### Content Optimization
- **AVIF Conversion**: All uploaded images are converted to AVIF format.
- **Results**: 70-80% reduction in file size compared to JPEG, significantly lowering bandwidth costs and improving load times.
- **CDN**: Cloudflare CDN serves media from `media.daadaar.com` for global edge delivery.

---

## ⚡ Data Integrity

- **Drizzle ORM**: Ensures type safety at the query layer.
- **Atomic Votes**: Database-level constraints and transactions prevent duplicate or orphaned votes.
- **Media Cleanup**: Background jobs remove orphaned S3 objects if database records fail to commit.

---
*Back to [README](README.md)*
