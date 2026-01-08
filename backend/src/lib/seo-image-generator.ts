import { uploadS3Object } from './s3-client';
import sharp from 'sharp';

/**
 * Generate SEO-optimized Open Graph images for entities
 * These images are uploaded to a public S3 folder for permanent access
 */

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const SEO_FOLDER_PREFIX = 'seo';

/**
 * Get the public S3 URL for an SEO image
 * These URLs are permanent and publicly accessible
 */
export function getSeoImageUrl(entityType: 'org' | 'individual' | 'report', uuid: string): string {
  const bucket = process.env.AWS_S3_BUCKET || 'daadaar-media-v1-317430950654';
  const region = process.env.AWS_REGION || 'us-east-1';
  const key = `${SEO_FOLDER_PREFIX}/${entityType}/${uuid}.jpg`;
  
  if (region === 'us-east-1') {
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }
  
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Generate and upload an SEO image for an organization
 */
export async function generateOrgSeoImage(
  uuid: string,
  name: string,
  logoUrl?: string | null
): Promise<string> {
  try {
    const key = `${SEO_FOLDER_PREFIX}/org/${uuid}.jpg`;
    
    // Create a simple branded OG image
    // If logoUrl exists, we could fetch and composite it
    // For now, create a text-based image
    const svg = `
      <svg width="${OG_IMAGE_WIDTH}" height="${OG_IMAGE_HEIGHT}">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <text
          x="50%"
          y="45%"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="64"
          font-weight="bold"
          fill="white"
        >${escapeXml(name)}</text>
        <text
          x="50%"
          y="60%"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="32"
          fill="rgba(255,255,255,0.8)"
        >Daadaar</text>
      </svg>
    `;
    
    const buffer = await sharp(Buffer.from(svg))
      .jpeg({ quality: 85 })
      .toBuffer();
    
    await uploadS3Object(key, buffer, 'image/jpeg');
    
    return getSeoImageUrl('org', uuid);
  } catch (error) {
    console.error('Failed to generate SEO image for organization:', error);
    throw error;
  }
}

/**
 * Generate and upload an SEO image for an individual
 */
export async function generateIndividualSeoImage(
  uuid: string,
  name: string,
  profileImageUrl?: string | null
): Promise<string> {
  try {
    const key = `${SEO_FOLDER_PREFIX}/individual/${uuid}.jpg`;
    
    const svg = `
      <svg width="${OG_IMAGE_WIDTH}" height="${OG_IMAGE_HEIGHT}">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#4facfe;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <text
          x="50%"
          y="45%"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="64"
          font-weight="bold"
          fill="white"
        >${escapeXml(name)}</text>
        <text
          x="50%"
          y="60%"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="32"
          fill="rgba(255,255,255,0.8)"
        >Daadaar</text>
      </svg>
    `;
    
    const buffer = await sharp(Buffer.from(svg))
      .jpeg({ quality: 85 })
      .toBuffer();
    
    await uploadS3Object(key, buffer, 'image/jpeg');
    
    return getSeoImageUrl('individual', uuid);
  } catch (error) {
    console.error('Failed to generate SEO image for individual:', error);
    throw error;
  }
}

/**
 * Generate and upload an SEO image for a report
 */
export async function generateReportSeoImage(
  uuid: string,
  title: string,
  imageUrl?: string | null
): Promise<string> {
  try {
    const key = `${SEO_FOLDER_PREFIX}/report/${uuid}.jpg`;
    
    const svg = `
      <svg width="${OG_IMAGE_WIDTH}" height="${OG_IMAGE_HEIGHT}">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#fa709a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#fee140;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <text
          x="50%"
          y="45%"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="56"
          font-weight="bold"
          fill="white"
        >${escapeXml(truncateText(title, 50))}</text>
        <text
          x="50%"
          y="60%"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="32"
          fill="rgba(255,255,255,0.8)"
        >Daadaar Report</text>
      </svg>
    `;
    
    const buffer = await sharp(Buffer.from(svg))
      .jpeg({ quality: 85 })
      .toBuffer();
    
    await uploadS3Object(key, buffer, 'image/jpeg');
    
    return getSeoImageUrl('report', uuid);
  } catch (error) {
    console.error('Failed to generate SEO image for report:', error);
    throw error;
  }
}

/**
 * Helper function to escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Helper function to truncate text
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
