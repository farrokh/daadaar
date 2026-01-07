# End Date Implementation for Individual-Organization Relationships

## Summary
Added support for optional end dates on individual-organization relationships through role occupancy. When an end date is not set, it indicates that the individual is still active in that role/organization (ongoing to the present).

## Changes Made

### 1. Frontend - Add Person Modal (`frontend/components/graph/add-person-modal.tsx`)
- Added `endDate` state variable
- Added `endDate` input field to both:
  - New role creation form section
  - Existing role selection section
- Updated form reset to clear `endDate`
- Updated API request to include `endDate` parameter
- Fields are displayed side-by-side with `startDate` for better UX

### 2. Backend - Individuals Controller (`backend/src/controllers/individuals.ts`)
- Added `endDate` field to `CreateIndividualBody` interface
- Updated role occupancy creation to store `endDate` when provided
- If `endDate` is null, the person is considered still active in that role

### 3. Translations
**English (`frontend/messages/en.json`):**
- Added `end_date`: "End Date"
- Added `end_date_helper`: "When did they leave this role? (Leave empty if still active)"

**Persian (`frontend/messages/fa.json`):**
- Added `end_date`: "تاریخ پایان"
- Added `end_date_helper`: "این نقش در چه زمانی پایان یافته؟ (اگر هنوز فعال است خالی بگذارید)"
- Also added missing `profile_image` and `profile_image_helper` translations

## Database Schema
The database schema already supported this feature:
- `role_occupancy` table has an optional `endDate` field (nullable timestamp)
- When `endDate` is `null`, it means the person is currently in that role
- When `endDate` has a value, it marks when the person left that role

## User Experience
1. When adding a person to an organization, users can now specify:
   - **Start Date**: When the person began their role (optional, defaults to current date)
   - **End Date**: When the person left their role (optional, leave empty if still active)

2. The helper text clearly indicates that leaving the end date empty means the person is still in that position

3. Both fields are optional and displayed side-by-side for easy comparison

## Technical Notes
- The `endDate` field is completely optional
- No database migration is needed as the schema already supports this
- The graph visualization already displays date ranges when available
- This change maintains backward compatibility with existing data
