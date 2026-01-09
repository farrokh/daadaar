-- Fix ALL corrupted individuals profile images (remove expired presigned URLs)
UPDATE individuals
SET profile_image_url = substring(profile_image_url from 'users/[^?]+')
WHERE profile_image_url LIKE '%amazonaws.com/users/%';

-- Fix corrupted organization logos
UPDATE organizations
SET logo_url = substring(logo_url from 'orgs/[^?]+')
WHERE logo_url LIKE '%amazonaws.com/orgs/%';

-- Fix corrupted report images
UPDATE reports
SET image_url = substring(image_url from 'reports/[^?]+')
WHERE image_url LIKE '%amazonaws.com/reports/%';
