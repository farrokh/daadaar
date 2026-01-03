// Graph visualization routes
import { Router, type Router as RouterType } from 'express';
import * as graphController from '../controllers/graph';

const router: RouterType = Router();

// GET /api/graph/organizations - Get all organizations with hierarchy
router.get('/organizations', graphController.getOrganizationsGraph);

// GET /api/graph/organization/:id/people - Get people in an organization
router.get('/organization/:id/people', graphController.getOrganizationPeople);

// GET /api/graph/individual/:id/reports - Get reports for an individual
router.get('/individual/:id/reports', graphController.getIndividualReports);

export default router;
