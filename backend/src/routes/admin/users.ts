import { Router } from 'express';
import { deleteUser, listUsers, updateUser } from '../../controllers/users';
import { csrfProtection } from '../../lib/csrf-protection';
import { adminMiddleware, authMiddleware } from '../../middleware/auth';

const router: Router = Router();

// Require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/users
 */
router.get('/', listUsers);

/**
 * PATCH /api/admin/users/:id
 */
router.patch('/:id', csrfProtection, updateUser);

/**
 * DELETE /api/admin/users/:id
 */
router.delete('/:id', csrfProtection, deleteUser);

export default router;
