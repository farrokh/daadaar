import { Router } from 'express';
import {
  deleteOrganization,
  listOrganizations,
  updateOrganization,
} from '../../controllers/organizations';
import { csrfProtection } from '../../lib/csrf-protection';
import { adminMiddleware, authMiddleware } from '../../middleware/auth';

const router: Router = Router();

// Require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/organizations
 */
router.get('/', listOrganizations);

/**
 * PATCH /api/admin/organizations/:id
 */
router.patch('/:id', csrfProtection, updateOrganization);

/**
 * DELETE /api/admin/organizations/:id
 */
router.delete('/:id', csrfProtection, deleteOrganization);

export default router;
