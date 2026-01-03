// Individuals routes
import { Router, type Router as RouterType } from 'express';
import * as individualsController from '../controllers/individuals';

const router: RouterType = Router();

// GET /api/individuals - List all individuals
router.get('/', individualsController.listIndividuals);

// POST /api/individuals - Create new individual
router.post('/', individualsController.createIndividual);

// GET /api/individuals/:id - Get single individual
router.get('/:id', individualsController.getIndividual);

// PUT /api/individuals/:id - Update individual
router.put('/:id', individualsController.updateIndividual);

export default router;

