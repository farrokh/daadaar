// Individuals routes
import type { RequestHandler } from 'express';
import { Router } from 'express';
import * as individualsController from '../controllers/individuals';
import { authMiddleware, requireAuth } from '../middleware/auth';

const router: ReturnType<typeof Router> = Router();

// Apply authentication middleware to all individual routes
router.use(authMiddleware);
router.use(requireAuth);

// GET /api/individuals - List all individuals
router.get('/', individualsController.listIndividuals as RequestHandler);

// POST /api/individuals - Create new individual
router.post('/', individualsController.createIndividual as RequestHandler);

// GET /api/individuals/:id - Get single individual
router.get('/:id', individualsController.getIndividual as RequestHandler);

// PUT /api/individuals/:id - Update individual
router.put('/:id', individualsController.updateIndividual as RequestHandler);

export default router;
