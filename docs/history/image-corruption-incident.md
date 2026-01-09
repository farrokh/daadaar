# Incident Report: Corrupted Image URLs and Broken Social Cards
**Date:** January 9, 2026
**Severity:** High
**Status:** Resolved

## Summary
Users reported that profile images for individuals (e.g., Masoud Pezeshkian) and organizations were broken on the website. Additionally, Social Cards (Open Graph images) shared on Twitter were not displaying correctly.

## Root Cause Analysis

### 1. Corrupted Image URLs in Database
- **Issue:** The `profile_image_url` (individuals) and `logo_url` (organizations) columns in the database contained **expired presigned S3 URLs** (e.g., `https://bucket.../users/123.jpg?Expires=...`) instead of clean S3 keys (e.g., `users/123.jpg`).
- **Cause:** When admins edited entities, the backend received the full presigned URL from the frontend and saved it directly to the database without sanitization. Over time, these URLs expired, causing images to break.
- **Trigger:** This became critical when we turned off the CDN feature (`USE_CDN=false`), causing the system to rely on generating fresh presigned URLs. The system failed to sign URLs that were already full URLs.

### 2. Broken Social Cards (Twitter)
- **Issue:** Social cards for shared links (e.g., `.../org/UUID`) were failing validation or showing generic logos.
- **Cause:** We previously removed the Bucket Policy to secure user data, making the entire bucket private. This inadvertently blocked access to the `seo/` folder, which contains the Open Graph images generated for social sharing.
- **Impact:** Twitter (and other crawlers) received `403 Forbidden` when trying to fetch the SEO images.

## Resolution

### 1. Database & Code Fix
- **Data Migration:** Created and deployed migration `0009_fix_all_corrupted_images.sql` to clean all `individuals`, `organizations`, and `users` records. It used regex to extract the clean S3 key (`users/...` or `orgs/...`) from the corrupted URLs.
- **Code Patch:** Updated `organizations.ts` and `individuals.ts` controllers to use a new helper `extractS3KeyFromUrl()`. This ensures that any URL submitted during an edit is stripped back to its S3 key before saving.

### 2. Social Card Fix
- **Policy Restoration:** Restored a specific S3 Bucket Policy that allows **public read access** (`s3:GetObject`) ONLY for the `seo/*` path.
- **Configuration:** Verified `BlockPublicPolicy: false` on the bucket to allow this granular permission while keeping other paths (`users/`, `sessions/`) private.

## Verification
- **Website:** Confirmed profiles (e.g., Executive Branch members) now load images correctly using fresh presigned URLs.
- **Social Media:** Verified that the SEO images are publicly accessible (HTTP 200) and Twitter Card validation passes.

## Prevention
- The backend now enforces S3 key sanitization on write.
- The S3 policy strictly enforces public access only for `seo/`, preventing accidental exposure of user data or accidental blocking of public assets.
