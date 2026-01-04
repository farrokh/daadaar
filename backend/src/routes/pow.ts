import { Router } from 'express';
import { generateChallenge } from '../controllers/pow';
import { csrfProtection } from '../lib/csrf-protection';
import { authMiddleware } from '../middleware/auth';

const router: Router = Router();

// Apply auth middleware to all routes (supports both anonymous and registered users)
router.use(authMiddleware);

// Apply CSRF protection to state-changing operations (POST, PUT, DELETE)
router.use(csrfProtection);

/**
 * POST /api/pow/challenge
 * Generate a new proof-of-work challenge
 */
router.post('/challenge', generateChallenge);

export default router;
