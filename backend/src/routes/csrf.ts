import { Router } from 'express';
import type { Router as RouterType } from 'express';
import { getCsrfToken } from '../lib/csrf-protection';

const router: RouterType = Router();

// Get CSRF token
router.get('/csrf-token', getCsrfToken);

export default router;
