import { Router } from 'express';
import { deleteRole, listRoles, updateRole } from '../../controllers/roles';
import { csrfProtection } from '../../lib/csrf-protection';
import { adminMiddleware, authMiddleware } from '../../middleware/auth';

const router: Router = Router();

// Require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/roles
 */
router.get('/', listRoles);

/**
 * PATCH /api/admin/roles/:id
 */
router.patch('/:id', csrfProtection, updateRole);

/**
 * DELETE /api/admin/roles/:id
 */
router.delete('/:id', csrfProtection, deleteRole);

export default router;
