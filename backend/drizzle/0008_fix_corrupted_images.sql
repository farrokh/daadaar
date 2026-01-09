-- SAFE MODE: Fix only ONE corrupted individual (Masoud Pezeshkian) for verification
UPDATE individuals
SET profile_image_url = substring(profile_image_url from 'users/[^?]+')
WHERE profile_image_url LIKE '%amazonaws.com/users/%Masoud_Pezeshkian%';
