import { Router } from 'express';
import { deleteIndividual, listIndividuals, updateIndividual } from '../../controllers/individuals';
import { csrfProtection } from '../../lib/csrf-protection';
import { adminMiddleware, authMiddleware } from '../../middleware/auth';

const router: Router = Router();

// Require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/individuals
 */
router.get('/', listIndividuals);

/**
 * PATCH /api/admin/individuals/:id
 */
router.patch('/:id', csrfProtection, updateIndividual);

/**
 * DELETE /api/admin/individuals/:id
 */
router.delete('/:id', csrfProtection, deleteIndividual);

export default router;
