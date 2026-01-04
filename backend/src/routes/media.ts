import { Router } from 'express';
import multer from 'multer';
import { deleteMedia, generatePresignedUrl, uploadImage } from '../controllers/media';
import { authMiddleware } from '../middleware/auth';

const router: Router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB (buffer limit)
  },
});

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/media/presigned-url
 * Generate a presigned URL for large files (videos, documents)
 */
router.post('/presigned-url', generatePresignedUrl);

/**
 * POST /api/media/upload
 * Upload and convert images to AVIF
 */
router.post('/upload', upload.single('file'), uploadImage);

/**
 * DELETE /api/media/:id
 * Delete a media file (soft delete)
 */
router.delete('/:id', deleteMedia);

export default router;
