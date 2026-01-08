import sharp from 'sharp';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { uploadS3Object, getS3ObjectBuffer } from './s3-client';

/**
 * Generate SEO-optimized Open Graph images for entities
 * These images are uploaded to a public S3 folder for permanent access
 */

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const SEO_FOLDER_PREFIX = 'seo';

const LOGO_PATH = path.join(__dirname, '../assets/logo.svg');

const FALLBACK_LOGO_SVG = `
<svg width="252" height="54" viewBox="0 0 252 54" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="40" font-family="sans-serif" font-size="40" font-weight="bold" fill="#0b1d44">daadaar</text>
</svg>
`;

/**
 * Helper to fetch an image as a buffer
 */
async function fetchImageBuffer(urlOrKey: string): Promise<Buffer | null> {
  try {
    let key = urlOrKey;
    
    // If it's a full URL, try to extract the S3 key
    if (urlOrKey.startsWith('http')) {
      const bucket = process.env.AWS_S3_BUCKET || 'daadaar-media-v1-317430950654';
      if (urlOrKey.includes(bucket)) {
        // Extract key: everything between bucket.s3...com/ and the "?" or end of string
        const match = urlOrKey.match(new RegExp(`${bucket}\\.s3\\.[^/]+/([^?#]+)`));
        if (match) {
          key = decodeURIComponent(match[1]);
          console.log(`Extracted S3 key from URL: ${key}`);
        }
      }
    }

    // If it doesn't look like an HTTP URL now, fetch from S3
    if (!key.startsWith('http')) {
      const buffer = await getS3ObjectBuffer(key);
      if (buffer) return buffer;
      console.warn(`Failed to get buffer from S3 for key: ${key}`);
    }
    
    // Fallback to axios if it's still a remote URL (and not in our S3)
    if (urlOrKey.startsWith('http')) {
      const response = await axios.get(urlOrKey, { 
        responseType: 'arraybuffer', 
        timeout: 8000,
        headers: { 'User-Agent': 'Daadaar-SEO-Generator/1.0' }
      });
      return Buffer.from(response.data);
    }
    
    return null;
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
    if (fs.existsSync(LOGO_PATH)) {
      logoBuffer = fs.readFileSync(LOGO_PATH);
    } else {
      console.warn('Logo path not found:', LOGO_PATH);
      logoBuffer = Buffer.from(FALLBACK_LOGO_SVG);
    }
  } catch (e) {
    console.error('Failed to read logo svg:', e);
    logoBuffer = Buffer.from(FALLBACK_LOGO_SVG);
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
      
      ${options.subtext ? renderMultiLineText(options.subtext, OG_IMAGE_WIDTH - margin, margin + nameFontSize + subtextFontSize + 20, subtextFontSize) : ''}
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
  try {
    const resizedLogo = await sharp(logoBuffer)
      .resize({ height: 80 })
      .toBuffer();
    
    composites.push({
      input: resizedLogo,
      top: OG_IMAGE_HEIGHT - 80 - margin,
      left: margin,
    });
  } catch (e) {
    console.error('Failed to composite logo:', e);
  }

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
  profileImageUrl?: string | null,
  biography?: string | null
): Promise<string> {
  let subtext = 'Public Servant Profile';
  
  if (biography && biography.trim().length > 0) {
    // Truncate bio to ~150 chars for display
    subtext = truncateText(biography, 150);
  }

  return generateMinimalSeoImage(`${SEO_FOLDER_PREFIX}/individual/${uuid}.jpg`, name, {
    entityType: 'individual',
    subtext: subtext,
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
 * Helper function to truncate text at word boundary
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  // Cut to length
  let truncated = text.substring(0, maxLength);
  
  // Find last space
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) { // Only cut at space if it's not too far back
    truncated = truncated.substring(0, lastSpace);
  }
  
  return truncated.trim() + '...';
}

/**
 * Render multi-line text for SVG
 */
function renderMultiLineText(text: string, x: number, y: number, fontSize: number): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    // Rough estimation of line length (assuming ~15 chars per word avg for simple logic, 
    // or just char count. Since we don't have font metrics, we estimate ~35 chars per line for this font size)
    if (currentLine.length + words[i].length < 45) {
      currentLine += ' ' + words[i];
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);

  // Take max 3 lines to avoid overflow
  const displayLines = lines.slice(0, 3);
  
  return displayLines.map((line, index) => `
    <text
      x="${x}"
      y="${y + (index * (fontSize * 1.4))}"
      text-anchor="end"
      font-family="'Noto Sans Arabic', 'Noto Sans', 'DejaVu Sans', sans-serif"
      font-size="${fontSize}"
      font-weight="400"
      fill="#86868B"
    >${escapeXml(line)}</text>
  `).join('');
}
