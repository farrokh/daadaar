import { Router } from 'express';
import * as reportsController from '../../controllers/admin/reports';
import { adminMiddleware, authMiddleware } from '../../middleware/auth';

const router: Router = Router();

// All admin report routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', reportsController.listReports);
router.post('/:id/verify', reportsController.triggerAiVerification);

export default router;
