// Individuals routes
import type { RequestHandler } from 'express';
import { Router } from 'express';
import * as individualsController from '../controllers/individuals';
import { csrfProtection } from '../lib/csrf-protection';
import { authMiddleware, requireAuth } from '../middleware/auth';

const router: ReturnType<typeof Router> = Router();

// Apply authentication middleware to all individual routes
// authMiddleware ensures req.currentUser is set (either 'registered' or 'anonymous')
router.use(authMiddleware);

// Apply CSRF protection to state-changing operations (POST, PUT, DELETE)
router.use(csrfProtection);

// GET /api/individuals - List all individuals
router.get('/', individualsController.listIndividuals as RequestHandler);

// POST /api/individuals - Create new individual
router.post('/', individualsController.createIndividual as RequestHandler);

// GET /api/individuals/:id - Get single individual
router.get('/:id', individualsController.getIndividual as RequestHandler);

// GET /api/individuals/:id/roles - Get individual's role occupancies
router.get('/:id/roles', individualsController.getIndividualRoles as RequestHandler);

// PUT /api/individuals/:id - Update individual
router.put('/:id', individualsController.updateIndividual as RequestHandler);

export default router;
