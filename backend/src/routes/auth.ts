import { Router, type Router as RouterType } from 'express';
import passport from 'passport';
import * as authController from '../controllers/auth';
import { authMiddleware } from '../middleware/auth';
import '../config/passport'; // Initialize Passport strategies

const router: RouterType = Router();

// ============================================================================
// Public Routes (No authentication required)
// ============================================================================

// Email/Password Authentication
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// ============================================================================
// OAuth Routes (Passport.js)
// Per ARCHITECTURE_SUMMARY.md lines 1229-1236
// ============================================================================

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login?error=google_failed',
  }),
  authController.oauthCallback
);

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get(
  '/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: '/login?error=github_failed',
  }),
  authController.oauthCallback
);

// ============================================================================
// Anonymous Session Routes
// Per ARCHITECTURE_SUMMARY.md lines 1217-1220
// ============================================================================

// POST /api/auth/session - Create anonymous session
router.post('/session', authMiddleware, authController.createSession);

// GET /api/auth/session - Validate session
router.get('/session', authMiddleware, authController.validateSession);

// DELETE /api/auth/session - Invalidate session
router.delete('/session', authMiddleware, authController.invalidateSession);

// ============================================================================
// Protected Routes (Require valid session/token)
// ============================================================================

// GET /api/auth/me - Get current user info
router.get('/me', authMiddleware, authController.getMe);

// GET /api/auth/ban-status - Check if current user/session is banned
router.get('/ban-status', authMiddleware, authController.getBanStatus);

export default router;
