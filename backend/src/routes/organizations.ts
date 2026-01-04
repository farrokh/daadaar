// Organizations routes
import type { RequestHandler } from 'express';
import { Router } from 'express';
import * as organizationsController from '../controllers/organizations';
import { csrfProtection } from '../lib/csrf-protection';
import { authMiddleware, requireAuth } from '../middleware/auth';

const router: ReturnType<typeof Router> = Router();

// Apply authentication middleware to all organization routes
// authMiddleware ensures req.currentUser is set (either 'registered' or 'anonymous')
router.use(authMiddleware);

// Apply CSRF protection to state-changing operations (POST, PUT, DELETE)
router.use(csrfProtection);

// GET /api/organizations - List all organizations
router.get('/', organizationsController.listOrganizations as RequestHandler);

// POST /api/organizations - Create new organization
router.post('/', organizationsController.createOrganization as RequestHandler);

// GET /api/organizations/:id - Get single organization
router.get('/:id', organizationsController.getOrganization as RequestHandler);

// PUT /api/organizations/:id - Update organization
router.put('/:id', organizationsController.updateOrganization as RequestHandler);

// GET /api/organizations/:id/roles - Get roles for an organization
router.get('/:id/roles', organizationsController.getOrganizationRoles as RequestHandler);

export default router;
