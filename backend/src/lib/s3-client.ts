import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'daadaar-media-v1-317430950654';

// CDN Configuration
const CDN_URL = process.env.CDN_URL || 'https://media.daadaar.com';
const USE_CDN = process.env.USE_CDN === 'true';

// Determine if we should use real S3 or mock
// In production, we always assume S3 (using IAM roles if env vars are missing)
// In development, we use S3 only if credentials are explicitly provided
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const HAS_CREDS = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
const USE_S3 = IS_PRODUCTION || HAS_CREDS;

/**
 * Generate a presigned URL for uploading a file to S3
 * @param key - S3 object key (file path)
 * @param contentType - MIME type of the file
 * @param expiresIn - URL expiration time in seconds (default: 5 minutes)
 * @returns Presigned URL
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  if (!USE_S3) {
    // Development mode: return a mock URL
    console.warn('AWS credentials not configured, returning mock presigned URL');
    return `http://localhost:4000/api/media/mock-upload/${key}`;
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return presignedUrl;
}

/**
 * Generate a presigned URL for reading a file from S3
 * Note: For CDN-enabled deployments, returns CDN URL for public access
 * @param key - S3 object key
 * @param bucket - S3 bucket name
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Presigned URL or CDN URL
 */
export async function generatePresignedGetUrl(
  key: string,
  bucket?: string,
  expiresIn = 3600
): Promise<string> {
  // For CDN-enabled deployments, return CDN URL for public access
  if (USE_CDN) {
    return getS3PublicUrl(key);
  }

  if (!USE_S3) {
    return `http://localhost:4000/api/media/mock/${key}`;
  }

  const command = new GetObjectCommand({
    Bucket: bucket || BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Upload a buffer directly to S3
 * @param key - S3 object key (file path)
 * @param body - File content buffer
 * @param contentType - MIME type of the file
 */
export async function uploadS3Object(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  if (!USE_S3) {
    console.warn('AWS credentials not configured, skipping S3 upload');
    return;
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);
}

/**
 * Get an object from S3 as a buffer
 * @param key - S3 object key
 * @returns Object content as buffer
 */
export async function getS3ObjectBuffer(key: string): Promise<Buffer | null> {
  if (!USE_S3) {
    console.warn('AWS credentials not configured, skipping S3 download');
    return null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    if (!response.Body) return null;

    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  } catch (error) {
    console.error(`Failed to download S3 object ${key}:`, error);
    return null;
  }
}

/**
 * Delete a file from S3
 * @param key - S3 object key (file path)
 */
export async function deleteS3Object(key: string): Promise<void> {
  if (!USE_S3) {
    console.warn('AWS credentials not configured, skipping S3 deletion');
    return;
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generate a unique S3 key for a file
 * @param filename - Original filename
 * @param userId - User ID (if registered)
 * @param sessionId - Session ID (if anonymous)
 * @returns S3 key
 */
export function generateS3Key(
  filename: string,
  userId: number | null,
  sessionId: string | null
): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const prefix = userId ? `users/${userId}` : `sessions/${sessionId}`;

  return `${prefix}/${timestamp}-${randomString}-${sanitizedFilename}`;
}

/**
 * Validate file type and size
 * @param contentType - MIME type
 * @param fileSize - File size in bytes
 * @returns Validation result
 */
export function validateMediaFile(
  contentType: string,
  fileSize: number
): { valid: boolean; error?: string; mediaType?: string } {
  // Define allowed types and size limits
  const allowedTypes: Record<string, { maxSize: number; mediaType: string }> = {
    // Images
    'image/jpeg': { maxSize: 50 * 1024 * 1024, mediaType: 'image' }, // 50MB
    'image/png': { maxSize: 50 * 1024 * 1024, mediaType: 'image' },
    'image/webp': { maxSize: 50 * 1024 * 1024, mediaType: 'image' },
    'image/gif': { maxSize: 50 * 1024 * 1024, mediaType: 'image' },
    // Videos
    'video/mp4': { maxSize: 200 * 1024 * 1024, mediaType: 'video' }, // 200MB
    'video/webm': { maxSize: 200 * 1024 * 1024, mediaType: 'video' },
    'video/quicktime': { maxSize: 200 * 1024 * 1024, mediaType: 'video' },
    // Documents
    'application/pdf': { maxSize: 10 * 1024 * 1024, mediaType: 'document' }, // 10MB
    // Audio
    'audio/mpeg': { maxSize: 20 * 1024 * 1024, mediaType: 'audio' }, // 20MB
    'audio/wav': { maxSize: 20 * 1024 * 1024, mediaType: 'audio' },
    'audio/ogg': { maxSize: 20 * 1024 * 1024, mediaType: 'audio' },
  };

  const typeConfig = allowedTypes[contentType];

  if (!typeConfig) {
    return {
      valid: false,
      error: `File type ${contentType} is not allowed. Allowed types: ${Object.keys(allowedTypes).join(', ')}`,
    };
  }

  if (fileSize > typeConfig.maxSize) {
    const maxSizeMB = typeConfig.maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File size ${(fileSize / (1024 * 1024)).toFixed(2)}MB exceeds maximum ${maxSizeMB}MB for ${contentType}`,
    };
  }

  return {
    valid: true,
    mediaType: typeConfig.mediaType,
  };
}

/**
 * Get public URL for an S3 object (via CDN if enabled)
 * @param key - S3 object key
 * @returns Public URL (CDN or S3 direct)
 */
export function getS3PublicUrl(key: string): string {
  if (!USE_S3) {
    return `http://localhost:4000/api/media/mock/${key}`;
  }

  // Use CDN URL if configured
  if (USE_CDN) {
    return `${CDN_URL}/${key}`;
  }

  // Fallback to direct S3 URL
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
}

/**
 * Extract S3 key from a potentially full URL (presigned or CDN)
 * @param url - Full URL or key
 * @returns S3 key (clean)
 */
export function extractS3KeyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // If it's already a clean key (not a URL), return it
  if (!url.startsWith('http')) return url;

  try {
    const parsed = new URL(url);
    // Remove leading slash from pathname
    let key = parsed.pathname.substring(1);

    // Handle mock URLs
    if (key.startsWith('api/media/mock/')) {
      key = key.replace('api/media/mock/', '');
    }

    return decodeURIComponent(key);
  } catch (_e) {
    return url; // fallback
  }
}
