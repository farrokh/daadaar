// Roles routes
import type { RequestHandler } from 'express';
import { Router } from 'express';
import * as rolesController from '../controllers/roles';
import { authMiddleware, requireAuth } from '../middleware/auth';

const router: ReturnType<typeof Router> = Router();

// Apply authentication middleware to all role routes
// authMiddleware sets req.currentUser, requireAuth validates and maps to req.user
router.use(authMiddleware);
router.use(requireAuth);

// GET /api/roles - List all roles (optionally filter by organizationId query param)
router.get('/', rolesController.listRoles as RequestHandler);

// POST /api/roles - Create new role
router.post('/', rolesController.createRole as RequestHandler);

// GET /api/roles/:id - Get single role
router.get('/:id', rolesController.getRole as RequestHandler);

// PUT /api/roles/:id - Update role
router.put('/:id', rolesController.updateRole as RequestHandler);

// DELETE /api/roles/:id - Delete role
router.delete('/:id', rolesController.deleteRole as RequestHandler);

export default router;
