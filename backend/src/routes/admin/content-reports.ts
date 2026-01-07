import { Router } from 'express';
import {
  getContentReport,
  getContentReportStats,
  listContentReports,
  updateContentReportStatus,
} from '../../controllers/content-reports';
import { csrfProtection } from '../../lib/csrf-protection';
import { authMiddleware, moderatorMiddleware } from '../../middleware/auth';

const router: Router = Router();

// Apply auth and moderator middleware to all admin routes
// Note: We use moderatorMiddleware for general viewing,
// though some actions might require adminMiddleware in the future.
router.use(authMiddleware);
router.use(moderatorMiddleware);

/**
 * GET /api/admin/content-reports
 */
router.get('/', listContentReports);

/**
 * GET /api/admin/content-reports/stats
 */
router.get('/stats', getContentReportStats);

/**
 * GET /api/admin/content-reports/:id
 */
router.get('/:id', getContentReport);

/**
 * PATCH /api/admin/content-reports/:id/status
 */
router.patch('/:id/status', csrfProtection, updateContentReportStatus);

export default router;
