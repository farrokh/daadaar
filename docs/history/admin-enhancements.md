# Admin Panel Enhancements (Jan 2026)

## Overview
This update focused on improving the robustness, usability, and correctness of the Admin Panel and Graph management features.

## Key Changes

### 1. Organization Management
- **Transactions**: Hierarchy updates (changing parent organization) are now wrapped in database transactions to ensure data integrity.
- **Cycle Detection**: Implemented transitive cycle detection (depth-limited BFS) to prevent the creation of circular organization hierarchies. Cycles now return a specific 400 Validation Error.
- **Image Upload**: Replaced raw URL input with S3-integrated image uploader.

### 2. Individual Management
- **Role Fetching**: Logic refactored to explicitly require Organization ID, preventing stale state issues and improving performance by skipping calls when no organization is selected.
- **Bug Fixes**: Fixed flickering issues in SearchableSelect and clarified code comments.

### 3. Code Quality
- **Environment**: Fixed `dotenv` loading order to ensure AWS credentials are loaded correctly.
- **Cleanup**: Removed dead code, development comments, and unused hooks (`useAuth`).
- **Linting**: Achieved a clean lint/type-check state across frontend and backend.

## Migration Notes
- No database schema changes were required.
- API behavior for `/organizations` (PUT) regarding errors has been improved (returns 400 for logic errors).
