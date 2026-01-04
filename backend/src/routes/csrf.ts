import { Router } from 'express';
import type { Router as RouterType } from 'express';
import { getCsrfToken } from '../lib/csrf-protection';
import { authMiddleware } from '../middleware/auth';

const router: RouterType = Router();

// Get CSRF token
// Requires authentication (anonymous or registered) to generate token for the session
router.get('/csrf-token', authMiddleware, getCsrfToken);

export default router;
