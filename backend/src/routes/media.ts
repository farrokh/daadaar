import { Router } from 'express';
import multer from 'multer';
import { tmpdir } from 'os';
import { deleteMedia, generatePresignedUrl, uploadImage } from '../controllers/media';
import { authMiddleware } from '../middleware/auth';

const router: Router = Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, tmpdir());
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for images
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
