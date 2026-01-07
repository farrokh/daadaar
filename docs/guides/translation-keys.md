# Translation Keys to Add

## English (frontend/messages/en.json)

Add these keys to the `"report"` section (before the closing brace):

```json
    "solving_pow": "Solving security challenge...",
    "uploading_media": "Uploading media...",
    "submit_success": "Report submitted successfully",
    "submit_error": "Failed to submit report",
    "title_required": "Title is required",
    "content_required": "Content is required",
    "media_upload_error": "Failed to upload media",
    "media_delete_error": "Failed to delete media"
```

## Persian (frontend/messages/fa.json)

Add these keys to the `"report"` section (before the closing brace):

```json
    "solving_pow": "در حال حل چالش امنیتی...",
    "uploading_media": "در حال بارگذاری رسانه...",
    "submit_success": "گزارش با موفقیت ارسال شد",
    "submit_error": "ارسال گزارش ناموفق بود",
    "title_required": "عنوان الزامی است",
    "content_required": "محتوا الزامی است",
    "media_upload_error": "بارگذاری رسانه ناموفق بود",
    "media_delete_error": "حذف رسانه ناموفق بود"
```

## How to Add

1. Open `frontend/messages/en.json`
2. Find the `"report"` section (around line 136)
3. Add the new keys before the closing `}`
4. Ensure proper JSON formatting (commas between entries)
5. Repeat for `frontend/messages/fa.json`

## Example

**Before**:
```json
  "report": {
    "title": "Report",
    "error_not_found": "Report not found"
  }
}
```

**After**:
```json
  "report": {
    "title": "Report",
    "error_not_found": "Report not found",
    "solving_pow": "Solving security challenge...",
    "uploading_media": "Uploading media..."
  }
}
```
