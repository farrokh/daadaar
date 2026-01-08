/**
 * SEO Image Generation Routes
 */

import express, { type Router } from 'express';
import * as seoController from '../controllers/seo-images';
import { optionalAuthMiddleware } from '../middleware/auth';

const router: Router = express.Router();

// Get SEO image URL (no generation, just returns the URL pattern)
router.get('/image-url/:entityType/:uuid', seoController.getSeoImage);

// Generate SEO images (requires authentication)
router.post('/generate-org-image/:uuid', optionalAuthMiddleware, seoController.generateOrgImage);

router.post(
  '/generate-individual-image/:uuid',
  optionalAuthMiddleware,
  seoController.generateIndividualImage
);

router.post(
  '/generate-report-image/:uuid',
  optionalAuthMiddleware,
  seoController.generateReportImage
);

// Batch generation (admin only)
router.post('/batch-generate', optionalAuthMiddleware, seoController.batchGenerateImages);

export default router;
