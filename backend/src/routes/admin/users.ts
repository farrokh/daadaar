import { Router } from 'express';
import { listUsers, updateUser } from '../../controllers/admin/users';
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

export default router;
