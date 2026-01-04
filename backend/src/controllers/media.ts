import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { db, schema } from '../db';
import {
  generatePresignedUploadUrl,
  generateS3Key,
  validateMediaFile,
  deleteS3Object,
  uploadS3Object,
} from '../lib/s3-client';

/**
 * Generate a presigned URL for media upload (non-images)
 * POST /api/media/presigned-url
 */
export async function generatePresignedUrl(req: Request, res: Response) {
  // ... existing code ...
  try {
    const { filename, contentType, fileSize } = req.body as {
      filename?: string;
      contentType?: string;
      fileSize?: number;
    };

    // Validate required fields
    if (!filename || !contentType || !fileSize) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Missing required fields: filename, contentType, fileSize',
        },
      });
    }

    // Validate file type and size
    const validation = validateMediaFile(contentType, fileSize);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE',
          message: validation.error,
        },
      });
    }

    // Get user/session info
    const userId = req.currentUser?.type === 'registered' ? req.currentUser.id : null;
    const sessionId = req.currentUser?.type === 'anonymous' ? req.currentUser.sessionId : null;

    // Generate S3 key
    const s3Key = generateS3Key(filename, userId, sessionId);

    // Generate presigned URL
    const presignedUrl = await generatePresignedUploadUrl(s3Key, contentType);

    // Create media record in database
    const [media] = await db
      .insert(schema.media)
      .values({
        reportId: null as any,
        s3Key,
        s3Bucket: process.env.AWS_S3_BUCKET || 'daadaar-media-frkia',
        originalFilename: filename,
        mimeType: contentType,
        mediaType: validation.mediaType as 'image' | 'video' | 'document' | 'audio',
        fileSizeBytes: fileSize,
        uploadedByUserId: userId,
        uploadedBySessionId: sessionId,
        isProcessed: false,
        isDeleted: false,
      })
      .returning();

    return res.status(200).json({
      success: true,
      data: {
        mediaId: media.id,
        uploadUrl: presignedUrl,
        s3Key,
        expiresIn: 300,
      },
    });
  } catch (error) {
    console.error('Generate presigned URL error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate upload URL',
      },
    });
  }
}

/**
 * Upload and convert image to AVIF
 * POST /api/media/upload
 */
export async function uploadImage(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      });
    }

    // Validate image type
    const validation = validateMediaFile(file.mimetype, file.size);
    if (!validation.valid || validation.mediaType !== 'image') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IMAGE',
          message: validation.error || 'Only images can be uploaded here',
        },
      });
    }

    // Get user/session info
    const userId = req.currentUser?.type === 'registered' ? req.currentUser.id : null;
    const sessionId = req.currentUser?.type === 'anonymous' ? req.currentUser.sessionId : null;

    // Process image with Sharp: convert to AVIF
    const avifBuffer = await sharp(file.buffer)
      .resize({ width: 2048, withoutEnlargement: true }) // Limit size for performance
      .avif({ quality: 60, effort: 4 }) // Good balance of size and quality
      .toBuffer();

    // Generate S3 key (force .avif extension)
    const originalName = file.originalname;
    const avifFilename = `${originalName.substring(0, originalName.lastIndexOf('.')) || originalName}.avif`;
    const s3Key = generateS3Key(avifFilename, userId, sessionId);

    // Upload AVIF buffer to S3
    await uploadS3Object(s3Key, avifBuffer, 'image/avif');

    // Create media record in database
    const [media] = await db
      .insert(schema.media)
      .values({
        reportId: null as any,
        s3Key,
        s3Bucket: process.env.AWS_S3_BUCKET || 'daadaar-media-frkia',
        originalFilename: avifFilename,
        mimeType: 'image/avif',
        mediaType: 'image',
        fileSizeBytes: avifBuffer.length,
        uploadedByUserId: userId,
        uploadedBySessionId: sessionId,
        isProcessed: true,
        isDeleted: false,
      })
      .returning();

    return res.status(200).json({
      success: true,
      data: {
        mediaId: media.id,
        s3Key,
        mimeType: 'image/avif',
      },
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: 'Failed to process and upload image' },
    });
  }
}

/**
 * Delete a media file
 * DELETE /api/media/:id
 */
export async function deleteMedia(req: Request, res: Response) {
  // ... existing delete code ...
  try {
    const mediaId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(mediaId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid media ID',
        },
      });
    }

    // Fetch media record
    const media = await db.query.media.findFirst({
      where: eq(schema.media.id, mediaId),
    });

    if (!media) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Media not found',
        },
      });
    }

    // Check ownership
    const userId = req.currentUser?.type === 'registered' ? req.currentUser.id : null;
    const sessionId = req.currentUser?.type === 'anonymous' ? req.currentUser.sessionId : null;

    const isOwner =
      (userId && media.uploadedByUserId === userId) ||
      (sessionId && media.uploadedBySessionId === sessionId);

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this media',
        },
      });
    }

    // Soft delete
    await db
      .update(schema.media)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(eq(schema.media.id, mediaId));

    return res.status(200).json({
      success: true,
      message: 'Media deleted successfully',
    });
  } catch (error) {
    console.error('Delete media error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete media',
      },
    });
  }
}
