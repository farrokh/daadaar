/**
 * Get SEO-optimized Open Graph image URL for an entity
 * These URLs point to publicly accessible, permanent images in S3
 */

/**
 * Get the public SEO image URL for an entity
 * @param entityType - Type of entity (org, individual, or report)
 * @param uuid - Entity shareableUuid
 * @returns Public S3 URL for the SEO image
 */
export function getSeoImageUrl(
  entityType: 'org' | 'individual' | 'report',
  uuid: string
): string {
  const bucket = process.env.NEXT_PUBLIC_AWS_S3_BUCKET || 'daadaar-media-v1-317430950654';
  const region = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
  const key = `seo/${entityType}/${uuid}.jpg`;

  if (region === 'us-east-1') {
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
