import { randomBytes } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

// Store CSRF tokens in memory (use Redis in production for distributed systems)
const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

// Cleanup expired tokens every hour
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, data] of csrfTokens.entries()) {
    if (data.expiresAt < now) {
      csrfTokens.delete(sessionId);
    }
  }
}, 60 * 60 * 1000);

/**
 * Generate a CSRF token for the current session
 */
export function generateCsrfToken(sessionId: string): string {
  const token = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  csrfTokens.set(sessionId, { token, expiresAt });
  return token;
}

/**
 * Validate a CSRF token
 */
export function validateCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  
  if (!stored) {
    return false;
  }

  if (stored.expiresAt < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }

  return stored.token === token;
}

/**
 * Middleware to validate CSRF tokens on state-changing requests
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF check for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Get session ID from current user
  const sessionId = req.currentUser?.type === 'anonymous' 
    ? req.currentUser.sessionId 
    : req.currentUser?.type === 'registered' 
    ? `user-${req.currentUser.id}` 
    : null;

  if (!sessionId) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  // Get CSRF token from header or body
  const csrfToken = req.headers['x-csrf-token'] as string || req.body?.csrfToken;

  if (!csrfToken) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_MISSING',
        message: 'CSRF token is required',
      },
    });
  }

  // Validate token
  if (!validateCsrfToken(sessionId, csrfToken)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'Invalid or expired CSRF token',
      },
    });
  }

  next();
}

/**
 * Endpoint to get a CSRF token
 * GET /api/csrf-token
 */
export function getCsrfToken(req: Request, res: Response) {
  const sessionId = req.currentUser?.type === 'anonymous' 
    ? req.currentUser.sessionId 
    : req.currentUser?.type === 'registered' 
    ? `user-${req.currentUser.id}` 
    : null;

  if (!sessionId) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  const token = generateCsrfToken(sessionId);

  return res.status(200).json({
    success: true,
    data: { csrfToken: token },
  });
}
