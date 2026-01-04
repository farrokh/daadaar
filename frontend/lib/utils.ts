/**
 * Get S3 public URL for a given key and bucket
 */
export function getS3PublicUrl(key: string, bucket?: string): string {
  const bucketName = bucket || process.env.NEXT_PUBLIC_AWS_S3_BUCKET;

  if (!bucketName) {
    const errorMessage =
      'S3 bucket configuration is missing. Please provide a bucket argument or set NEXT_PUBLIC_AWS_S3_BUCKET environment variable.';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  const region = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';

  // Only use mock URL if explicitly in mock mode or bucket is 'mock'
  if (bucketName === 'mock' || process.env.NEXT_PUBLIC_MOCK_MEDIA_SERVER === 'true') {
    return `http://localhost:4000/api/media/mock/${key}`;
  }

  // Standard S3 URL format: https://bucket.s3.region.amazonaws.com/key
  // For us-east-1, bucket.s3.amazonaws.com also works and is often preferred.
  if (region === 'us-east-1') {
    return `https://${bucketName}.s3.amazonaws.com/${key}`;
  }

  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Format a date string to a localized date
 */
export function formatDate(dateString: string, locale: string): string {
  const d = new Date(dateString);

  if (Number.isNaN(d.getTime())) {
    // Return empty string for invalid dates
    return '';
  }

  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
