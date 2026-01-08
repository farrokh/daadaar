import sharp from 'sharp';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { uploadS3Object, getS3PublicUrl } from './s3-client';

/**
 * Generate SEO-optimized Open Graph images for entities
 * These images are uploaded to a public S3 folder for permanent access
 */

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const SEO_FOLDER_PREFIX = 'seo';

const LOGO_PATH = path.join(process.cwd(), '../frontend/public/logo_navbar_en.svg');

/**
 * Helper to fetch an image as a buffer
 */
async function fetchImageBuffer(urlOrKey: string): Promise<Buffer | null> {
  try {
    const url = urlOrKey.startsWith('http') ? urlOrKey : getS3PublicUrl(urlOrKey);
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Failed to fetch image buffer:', error);
    return null;
  }
}

/**
 * Get the public S3 URL for an SEO image
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
 * Generate a minimal, professional SEO image
 */
async function generateMinimalSeoImage(
  key: string,
  name: string,
  options: {
    entityType: 'org' | 'individual' | 'report';
    subtext?: string;
    imageUrl?: string | null;
    isCircle?: boolean;
  }
): Promise<string> {
  const margin = 60;
  const imageSize = 300;
  const nameFontSize = 72;
  const subtextFontSize = 32;

  // 1. Prepare Logo
  let logoBuffer: Buffer;
  try {
    logoBuffer = fs.readFileSync(LOGO_PATH);
  } catch (e) {
    console.error('Failed to read logo svg:', e);
    // Fallback or empty buffer
    logoBuffer = Buffer.from('<svg></svg>');
  }

  // 2. Prepare Profile/Entity Image
  let entityImageBuffer: Buffer | null = null;
  if (options.imageUrl) {
    const rawBuffer = await fetchImageBuffer(options.imageUrl);
    if (rawBuffer) {
      const sharpEntity = sharp(rawBuffer).resize(imageSize, imageSize, {
        fit: 'cover',
      });

      if (options.isCircle) {
        const circleShape = Buffer.from(
          `<svg><circle cx="${imageSize/2}" cy="${imageSize/2}" r="${imageSize/2}" /></svg>`
        );
        entityImageBuffer = await sharpEntity
          .composite([{ input: circleShape, blend: 'dest-in' }])
          .toBuffer();
      } else {
        entityImageBuffer = await sharpEntity.toBuffer();
      }
    }
  }

  // 3. Create SVG template
  // Name at top right, same margin from top and right
  const truncatedName = truncateText(name, 40);
  const svg = `
    <svg width="${OG_IMAGE_WIDTH}" height="${OG_IMAGE_HEIGHT}" viewBox="0 0 ${OG_IMAGE_WIDTH} ${OG_IMAGE_HEIGHT}">
      <rect width="100%" height="100%" fill="#FFFFFF"/>
      
      <!-- Name at top right -->
      <text
        x="${OG_IMAGE_WIDTH - margin}"
        y="${margin + nameFontSize}"
        text-anchor="end"
        font-family="'Noto Sans Arabic', 'Noto Sans', 'DejaVu Sans', sans-serif"
        font-size="${nameFontSize}"
        font-weight="700"
        fill="#0b1d44"
      >${escapeXml(truncatedName)}</text>
      
      ${options.subtext ? `
      <text
        x="${OG_IMAGE_WIDTH - margin}"
        y="${margin + nameFontSize + subtextFontSize + 10}"
        text-anchor="end"
        font-family="'Noto Sans Arabic', 'Noto Sans', 'DejaVu Sans', sans-serif"
        font-size="${subtextFontSize}"
        font-weight="400"
        fill="#86868B"
      >${escapeXml(options.subtext)}</text>
      ` : ''}
    </svg>
  `;

  // 4. Composite
  let finalSharp = sharp(Buffer.from(svg));
  const composites = [];

  // Add entity image if available
  if (entityImageBuffer) {
    composites.push({
      input: entityImageBuffer,
      top: margin,
      left: margin,
    });
  }

  // Add Daadaar logo at bottom left
  const resizedLogo = await sharp(logoBuffer)
    .resize({ height: 80 })
    .toBuffer();
  
  composites.push({
    input: resizedLogo,
    top: OG_IMAGE_HEIGHT - 80 - margin,
    left: margin,
  });

  if (composites.length > 0) {
    finalSharp = finalSharp.composite(composites);
  }

  const buffer = await finalSharp.jpeg({ quality: 90 }).toBuffer();
  await uploadS3Object(key, buffer, 'image/jpeg');
  return getSeoImageUrl(options.entityType, key.split('/').pop()?.replace('.jpg', '') || '');
}

/**
 * Generate and upload an SEO image for an organization
 */
export async function generateOrgSeoImage(
  uuid: string,
  name: string,
  logoUrl?: string | null
): Promise<string> {
  return generateMinimalSeoImage(`${SEO_FOLDER_PREFIX}/org/${uuid}.jpg`, name, {
    entityType: 'org',
    subtext: 'Organization',
    imageUrl: logoUrl,
    isCircle: false
  });
}

/**
 * Generate and upload an SEO image for an individual
 */
export async function generateIndividualSeoImage(
  uuid: string,
  name: string,
  profileImageUrl?: string | null
): Promise<string> {
  return generateMinimalSeoImage(`${SEO_FOLDER_PREFIX}/individual/${uuid}.jpg`, name, {
    entityType: 'individual',
    subtext: 'Public Servant Profile',
    imageUrl: profileImageUrl,
    isCircle: true
  });
}

/**
 * Generate and upload an SEO image for a report
 */
export async function generateReportSeoImage(
  uuid: string,
  title: string,
  imageUrl?: string | null
): Promise<string> {
  return generateMinimalSeoImage(`${SEO_FOLDER_PREFIX}/report/${uuid}.jpg`, title, {
    entityType: 'report',
    subtext: 'Official Report',
    imageUrl: imageUrl,
    isCircle: false
  });
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
  return text.substring(0, maxLength).trim() + '...';
}
