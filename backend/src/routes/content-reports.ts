import { Router } from 'express';
import { createContentReport } from '../controllers/content-reports';
import { csrfProtection } from '../lib/csrf-protection';
import { authMiddleware } from '../middleware/auth';

const router: Router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/content-reports
 * Create a new content report
 */
router.post('/', csrfProtection, createContentReport);

export default router;

