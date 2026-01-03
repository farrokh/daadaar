// Roles routes
import { Router, type Router as RouterType } from 'express';
import * as rolesController from '../controllers/roles';

const router: RouterType = Router();

// GET /api/roles - List all roles (optionally filter by organizationId query param)
router.get('/', rolesController.listRoles);

// POST /api/roles - Create new role
router.post('/', rolesController.createRole);

// GET /api/roles/:id - Get single role
router.get('/:id', rolesController.getRole);

// PUT /api/roles/:id - Update role
router.put('/:id', rolesController.updateRole);

// DELETE /api/roles/:id - Delete role
router.delete('/:id', rolesController.deleteRole);

export default router;
