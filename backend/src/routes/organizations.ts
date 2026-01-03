// Organizations routes
import { Router, type Router as RouterType } from 'express';
import * as organizationsController from '../controllers/organizations';

const router: RouterType = Router();

// GET /api/organizations - List all organizations
router.get('/', organizationsController.listOrganizations);

// POST /api/organizations - Create new organization
router.post('/', organizationsController.createOrganization);

// GET /api/organizations/:id - Get single organization
router.get('/:id', organizationsController.getOrganization);

// PUT /api/organizations/:id - Update organization
router.put('/:id', organizationsController.updateOrganization);

// GET /api/organizations/:id/roles - Get roles for an organization
router.get('/:id/roles', organizationsController.getOrganizationRoles);

export default router;
