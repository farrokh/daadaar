# S3 CORS Configuration for Media Uploads

## Issue
Video uploads were failing with CORS errors while image uploads worked fine.

## Root Cause
The S3 bucket CORS configuration only allowed `GET` and `HEAD` methods, but not `PUT`.

- **Images**: Upload directly to the backend (`/media/upload` endpoint), which then uploads to S3 server-side. No CORS issue because the browser doesn't directly interact with S3.
- **Videos/Audio/Documents**: Use presigned URLs to upload directly from the browser to S3. This requires `PUT` method to be allowed in CORS.

## Solution
Updated S3 bucket CORS configuration to include `PUT` method:

```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD", "PUT"],
      "AllowedOrigins": [
        "https://www.daadaar.com",
        "https://daadaar.com",
        "http://localhost:3000"
      ],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

## How to Apply

### Using AWS CLI
```bash
# Apply the CORS configuration
aws s3api put-bucket-cors \
  --bucket daadaar-media-v1-317430950654 \
  --cors-configuration file://infrastructure/aws/s3-cors-config.json

# Verify the configuration
aws s3api get-bucket-cors --bucket daadaar-media-v1-317430950654
```

### Using AWS Console
1. Go to S3 Console
2. Select bucket: `daadaar-media-v1-317430950654`
3. Go to **Permissions** tab
4. Scroll to **Cross-origin resource sharing (CORS)**
5. Click **Edit**
6. Paste the JSON configuration above
7. Click **Save changes**

## Testing
After applying the CORS configuration, test video upload:

1. Go to the report submission page
2. Try uploading a video file
3. The upload should now succeed without CORS errors

## Related Files
- `/infrastructure/aws/s3-cors-config.json` - CORS configuration file
- `/docs/CDN_CONFIGURATION.md` - CDN and S3 configuration documentation
- `/backend/src/controllers/media.ts` - Media upload controller
- `/frontend/components/reports/media-uploader.tsx` - Frontend upload component
