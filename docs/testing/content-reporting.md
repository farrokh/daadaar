# Testing the Content Reporting System

## Prerequisites
- Backend server running on `http://localhost:4000`
- Frontend server running on `http://localhost:3000`
- At least one report in the database

## Test Steps

### 1. **Visual Test - Report Button Appears**
1. Navigate to `http://localhost:3000` (or `http://localhost:3000/fa` for Persian)
2. Click on any report to view its details
3. **Expected**: You should see a "Report" button in the top-right corner next to the back button

### 2. **Test Opening the Report Modal**
1. Click the "Report" button
2. **Expected**: A modal should appear with:
   - Title: "Report Content"
   - A dropdown for selecting a reason
   - An optional text area for additional details
   - Cancel and Submit buttons

### 3. **Test Reason Selection**
1. Click the reason dropdown
2. **Expected**: You should see 6 options:
   - Spam or advertising
   - False or misleading information
   - Harassment or abuse
   - Inappropriate content
   - Duplicate entry
   - Other

### 4. **Test Submitting a Report**
1. Select a reason (e.g., "Spam or advertising")
2. Optionally add a description in the text area
3. Click "Submit Report"
4. **Expected**: 
   - Button shows "Submitting..." while processing
   - Success checkmark appears
   - Modal closes after 2 seconds

### 5. **Test Database Persistence**
After submitting a report, verify it was saved:

```bash
# Connect to your database and run:
SELECT * FROM content_reports ORDER BY created_at DESC LIMIT 1;
```

**Expected columns:**
- `content_type`: 'report'
- `content_id`: The ID of the report you reported
- `reason`: The reason you selected
- `description`: Your optional description
- `status`: 'pending'
- `reporter_user_id` or `reporter_session_id`: Your user/session ID

### 6. **Test Error Handling**
1. Stop the backend server
2. Try to submit a report
3. **Expected**: Error message appears: "Failed to submit report"

### 7. **Test Different Content Types**
The `ReportContentButton` component supports all content types:
- `contentType="report"` - For reports (already added)
- `contentType="organization"` - For organizations
- `contentType="individual"` - For individuals
- `contentType="user"` - For user profiles
- `contentType="media"` - For media files

You can add the button to other pages by importing and using:
```tsx
import { ReportContentButton } from '@/components/ui/report-content-button';

<ReportContentButton contentType="organization" contentId={orgId} />
```

### 8. **Test Translations**
1. Switch language to Persian: `http://localhost:3000/fa/reports/[id]`
2. Click the report button
3. **Expected**: All text should be in Persian (Farsi)

## API Testing with cURL

You can also test the API directly:

```bash
# Get CSRF token first
curl -c cookies.txt http://localhost:4000/api/csrf-token

# Extract CSRF token from cookies
CSRF_TOKEN=$(grep csrf-token cookies.txt | awk '{print $7}')

# Submit a content report
curl -X POST http://localhost:4000/api/content-reports \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b cookies.txt \
  -d '{
    "contentType": "report",
    "contentId": 1,
    "reason": "spam",
    "description": "This is a test report"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "contentReportId": 1
  }
}
```

## Troubleshooting

### Issue: "Cannot find module '@/components/ui/report-content-button'"
- Make sure the file exists at: `frontend/components/ui/report-content-button.tsx`
- Restart the frontend dev server

### Issue: "CSRF token is required"
- The frontend automatically handles CSRF tokens via the `fetchApi` utility
- Make sure you're using `fetchApi` from `@/lib/api`

### Issue: Modal doesn't close
- Check browser console for errors
- Try clicking the X button or clicking outside the modal

### Issue: Translations missing
- Check that `contentReport` section exists in both:
  - `frontend/messages/en.json`
  - `frontend/messages/fa.json`

## Next Steps

After testing, you can:
1. Add the report button to other pages (organizations, individuals, etc.)
2. Build an admin dashboard to review submitted reports
3. Add email notifications for new reports
4. Implement report resolution workflow
