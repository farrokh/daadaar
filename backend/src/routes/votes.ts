import { Router } from 'express';
import { castVote, getMyVote, removeVote } from '../controllers/votes';
import { csrfProtection } from '../lib/csrf-protection';
import { authMiddleware } from '../middleware/auth';

const router: Router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/votes
 * Cast a vote on a report (upvote or downvote)
 * Requires CSRF protection for state-changing operation
 */
router.post('/', csrfProtection, castVote);

/**
 * DELETE /api/votes/:reportId
 * Remove a vote from a report
 * Requires CSRF protection for state-changing operation
 */
router.delete('/:reportId', csrfProtection, removeVote);

/**
 * GET /api/votes/:reportId/my-vote
 * Get the current user's vote on a report
 * No CSRF needed for GET requests
 */
router.get('/:reportId/my-vote', getMyVote);

export default router;

