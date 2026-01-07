// Share routes
// Routes for shareable links using UUIDs

import express, { type Router } from 'express';
import {
  getIndividualByUuid,
  getOrganizationByUuid,
  getReportByUuid,
  getUserByUuid,
} from '../controllers/share';

const router: Router = express.Router();

// Public shareable link endpoints (no authentication required)
router.get('/org/:uuid', getOrganizationByUuid);
router.get('/individual/:uuid', getIndividualByUuid);
router.get('/report/:uuid', getReportByUuid);
router.get('/user/:uuid', getUserByUuid);

export default router;
