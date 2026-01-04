import { Router } from 'express';
import { createReport, getReportById, getReports } from '../controllers/reports';
import { csrfProtection } from '../lib/csrf-protection';
import { authMiddleware } from '../middleware/auth';

const router: Router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Apply CSRF protection to state-changing operations (POST, PUT, DELETE)
router.use(csrfProtection);

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
