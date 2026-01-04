import { Router } from 'express';
import { createReport, getReportById, getReports } from '../controllers/reports';
import { authMiddleware } from '../middleware/auth';

const router: Router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/reports
 * Create a new report
 */
router.post('/', createReport);

/**
 * GET /api/reports
 * Get all reports with pagination and filtering
 */
router.get('/', getReports);

/**
 * GET /api/reports/:id
 * Get a single report by ID
 */
router.get('/:id', getReportById);

export default router;
