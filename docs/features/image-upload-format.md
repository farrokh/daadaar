# Image Upload Format Comparison

## Current State

### ✅ YES - All image uploads use AVIF format consistently

All image uploads across the platform (individuals, organizations, and reports) use the **same AVIF conversion process**.

## Upload Flow Comparison

### 1. **Individual & Organization Photos** (via `ImageUploader` component)
**Component:** `frontend/components/ui/image-uploader.tsx`
**Endpoint:** `POST /api/media/upload`

**Process:**
1. User selects an image file
2. Frontend sends image to backend via FormData
3. Backend processes with Sharp:
   - Resizes to max 2048px width
   - Converts to AVIF format (quality: 60, effort: 4)
   - Uploads to S3 as `.avif`
4. Database stores as `image/avif` mime type

### 2. **Report Media** (via `MediaUploader` component)
**Component:** `frontend/components/reports/media-uploader.tsx`
**Endpoint:** `POST /api/media/upload` (for images)

**Process:**
1. User uploads media (images, videos, PDFs, audio)
2. **For images:** Same as above - uses `/api/media/upload`
   - Converts to AVIF via Sharp
   - Same quality settings (60, effort: 4)
3. **For non-images:** Uses presigned URL flow
   - Gets presigned URL from backend
   - Uploads directly to S3 (no conversion)

## Backend Implementation

**File:** `backend/src/controllers/media.ts`
**Function:** `uploadImage()`

```typescript
// Lines 142-145
const avifBuffer = await sharp(file.path)
  .resize({ width: 2048, withoutEnlargement: true })
  .avif({ quality: 60, effort: 4 })
  .toBuffer();
```

**Shared Settings:**
- Max width: 2048px
- AVIF quality: 60
- AVIF effort: 4 (balance of size and quality)
- All images stored with `.avif` extension
- All images stored with `image/avif` mime type

## Summary

✅ **Consistent:** All image uploads (individual photos, organization logos, and report images) use the exact same AVIF conversion process.

✅ **Optimized:** AVIF format provides excellent compression while maintaining quality.

✅ **Unified:** Single endpoint (`/api/media/upload`) handles all image uploads.

## Non-Image Media

For completeness, non-image media (videos, PDFs, audio) in reports:
- Use presigned URL flow
- Upload directly to S3 without conversion
- Maintain original format
- This is appropriate as these formats don't benefit from AVIF conversion
