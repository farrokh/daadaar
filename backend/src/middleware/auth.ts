import { eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import type { UserRole } from '../../../shared/types';
import { db, schema } from '../db';
import { redis } from '../lib/redis';

// Define CurrentUser types locally to avoid import conflicts
interface RegisteredUser {
  type: 'registered';
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  profileImageUrl?: string | null;
  role: UserRole;
}

interface AnonymousUser {
  type: 'anonymous';
  sessionId: string;
}

type CurrentUser = RegisteredUser | AnonymousUser;

// Extend Express Request type to include currentUser
// Note: Express.User is already defined by @types/passport for req.user
declare global {
  namespace Express {
    interface Request {
      currentUser?: CurrentUser;
    }
    // Extend Passport's User type to match our RegisteredUser
    // This allows req.user to work with Passport OAuth flow
    interface User {
      type: 'registered';
      id: number;
      email: string;
      username: string;
      displayName: string | null;
      profileImageUrl?: string | null;
      role: UserRole;
      oauthProvider?: string | null;
      oauthId?: string | null;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const SESSION_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds

// Interface for session data stored in Redis
interface SessionData {
  sessionId: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  isBanned: boolean;
  bannedAt?: string | null;
  bannedUntil?: string | null;
}

/**
 * Check if a temporary ban has expired
 */
const isTemporaryBanExpired = (bannedUntil: string | null | undefined): boolean => {
  if (!bannedUntil) return false; // Permanent ban, not expired
  return new Date(bannedUntil) <= new Date();
};

/**
 * Auto-unban user if temporary ban has expired
 */
const autoUnbanUser = async (userId: number): Promise<void> => {
  await db
    .update(schema.users)
    .set({
      isBanned: false,
      bannedAt: null,
      bannedUntil: null,
      banReason: null,
    })
    .where(eq(schema.users.id, userId));
};

/**
 * Auto-unban session if temporary ban has expired
 */
const autoUnbanSession = async (sessionId: string, session: SessionData): Promise<SessionData> => {
  const updatedSession: SessionData = {
    ...session,
    isBanned: false,
    bannedAt: null,
    bannedUntil: null,
  };

  if (redis) {
    await redis.set(`session:${sessionId}`, JSON.stringify(updatedSession), 'EX', SESSION_EXPIRY);
  }

  return updatedSession;
};

/**
 * Unified Authentication Middleware
 * Handles both registered users (JWT) and anonymous sessions (Redis)
 * Per ARCHITECTURE_SUMMARY.md lines 113-141
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Try JWT token (registered user - email/password or OAuth)
    const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        const user = await db.query.users.findFirst({
          where: eq(schema.users.id, decoded.userId),
        });

        if (user) {
          // Check if user is banned (per ARCHITECTURE_SUMMARY.md lines 667-683)
          if (user.isBanned) {
            // Check if temporary ban has expired
            const bannedUntilStr = user.bannedUntil?.toISOString() ?? null;
            if (bannedUntilStr && isTemporaryBanExpired(bannedUntilStr)) {
              // Temporary ban expired, auto-unban
              await autoUnbanUser(user.id);
            } else {
              // User is still banned
              return res.status(403).json({
                success: false,
                error: {
                  code: 'USER_BANNED',
                  message: 'Account banned',
                  details: {
                    bannedUntil: user.bannedUntil?.toISOString() || null,
                    banReason: user.banReason || null,
                  },
                },
              });
            }
          }

          req.currentUser = {
            type: 'registered',
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
            role: user.role as UserRole,
          };
          return next();
        }
      } catch (_e) {
        // Invalid token, continue to anonymous check
      }
    }

    // 2. Fall back to anonymous session
    const sessionId = req.cookies.sessionId;

    if (sessionId && redis) {
      const sessionData = await redis.get(`session:${sessionId}`);
      if (sessionData) {
        let session: SessionData = JSON.parse(sessionData);

        // Check if session is banned (per ARCHITECTURE_SUMMARY.md lines 687-707)
        if (session.isBanned) {
          // Check if temporary ban has expired
          if (session.bannedUntil && isTemporaryBanExpired(session.bannedUntil)) {
            // Temporary ban expired, auto-unban
            session = await autoUnbanSession(sessionId, session);
          } else {
            // Session is still banned
            return res.status(403).json({
              success: false,
              error: {
                code: 'SESSION_BANNED',
                message: 'Session banned',
                details: {
                  bannedUntil: session.bannedUntil || null,
                },
              },
            });
          }
        }

        // Update last activity
        await redis.set(
          `session:${sessionId}`,
          JSON.stringify({
            ...session,
            lastActivity: new Date().toISOString(),
          }),
          'EX',
          SESSION_EXPIRY
        );

        req.currentUser = {
          type: 'anonymous',
          sessionId,
        };
        return next();
      }
    } else if (sessionId && !redis) {
      // If Redis is not available, allow session for development
      // but log warning
      console.warn('Redis not available, allowing session without verification');
      req.currentUser = {
        type: 'anonymous',
        sessionId,
      };
      return next();
    }

    // 3. Create new anonymous session if none exists
    const newSessionId = uuidv4();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY * 1000).toISOString();

    const newSession: SessionData = {
      sessionId: newSessionId,
      createdAt: now,
      lastActivity: now,
      expiresAt,
      isBanned: false,
      bannedAt: null,
      bannedUntil: null,
    };

    if (redis) {
      await redis.set(`session:${newSessionId}`, JSON.stringify(newSession), 'EX', SESSION_EXPIRY);
    }

    req.currentUser = {
      type: 'anonymous',
      sessionId: newSessionId,
    };

    // Set cookie for new session
    res.cookie('sessionId', newSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY * 1000,
    });

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next();
  }
};

/**
 * Admin Middleware - Requires admin role
 * Per ARCHITECTURE_SUMMARY.md lines 722-728
 */
export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (
    !req.currentUser ||
    req.currentUser.type !== 'registered' ||
    req.currentUser.role !== 'admin'
  ) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin access required' },
    });
  }
  next();
};

/**
 * Moderator Middleware - Requires moderator or admin role
 * Per ARCHITECTURE_SUMMARY.md lines 730-738
 */
export const moderatorMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (
    !req.currentUser ||
    req.currentUser.type !== 'registered' ||
    (req.currentUser.role !== 'admin' && req.currentUser.role !== 'moderator')
  ) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Moderator access required' },
    });
  }
  next();
};

/**
 * Optional Auth Middleware - Does not require authentication but attaches user if available
 * Useful for endpoints that work for both authenticated and unauthenticated users
 */
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Try to authenticate but don't fail if not possible
    await authMiddleware(req, res, () => {});
    next();
  } catch (_error) {
    // Continue without user
    next();
  }
};

/**
 * Require Authentication Middleware
 * Ensures user is authenticated (registered, not anonymous)
 * Maps req.currentUser to req.user for controller compatibility
 * Should be used after authMiddleware in the middleware chain
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.currentUser || req.currentUser.type !== 'registered') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  // Map currentUser to user for controller compatibility
  // This bridges the gap between authMiddleware (sets currentUser) and
  // controllers that expect AuthenticatedRequest (with user property)
  // Cast to Express.User to work with Passport's type system
  req.user = req.currentUser as Express.User;
  next();
};

// Export types for use in controllers
export type { CurrentUser, RegisteredUser, AnonymousUser, SessionData };
