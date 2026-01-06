import bcrypt from 'bcrypt';
import { eq, or } from 'drizzle-orm';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db, schema } from '../db';
import { sendVerificationEmail } from '../lib/email';
import { redis } from '../lib/redis';
import { notifyNewUser } from '../lib/slack';
import type { SessionData } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_EXPIRES_IN = '30d';
const SESSION_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds
const isEmailVerificationEnabled = () =>
  (process.env.EMAIL_VERIFICATION_ENABLED ?? 'true').toLowerCase() === 'true';

/**
 * POST /api/auth/register
 * Register a new user with email/password
 * Per ARCHITECTURE_SUMMARY.md - Email/Password Authentication
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password, displayName } = req.body;

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email, username and password are required' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid email format' },
      });
    }

    // Validate username (alphanumeric, underscores, 3-50 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Username must be 3-50 characters, alphanumeric and underscores only',
        },
      });
    }

    // Validate password strength (min 8 chars)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters' },
      });
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: or(eq(schema.users.email, email), eq(schema.users.username, username)),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_EXISTS',
          message: 'User with this email or username already exists',
        },
      });
    }

    // Hash password with bcrypt (cost factor 10)
    const passwordHash = await bcrypt.hash(password, 10);

    const emailVerificationEnabled = isEmailVerificationEnabled();

    // Generate verification token only when verification is enabled
    const verificationToken = emailVerificationEnabled ? uuidv4() : null;

    // Create user
    const [newUser] = await db
      .insert(schema.users)
      .values({
        email,
        username,
        passwordHash,
        displayName: displayName || username,
        role: 'user',
        isVerified: !emailVerificationEnabled,
        verificationToken,
      })
      .returning();

    // Send verification email only when verification is enabled
    if (emailVerificationEnabled && verificationToken) {
      await sendVerificationEmail(newUser.email, verificationToken);
    }

    // Notify Slack about new user
    notifyNewUser({
      email: newUser.email,
      username: newUser.username,
      displayName: newUser.displayName || newUser.username,
    }).catch(err => console.error('Slack notification error:', err));

    res.status(201).json({
      success: true,
      message: emailVerificationEnabled
        ? 'Registration successful. Please check your email to verify your account.'
        : 'Registration successful. Your account is active.',
      data: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        requiresEmailVerification: emailVerificationEnabled,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
};

/**
 * GET /api/auth/verify-email
 * Verify user email with token
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Verification token is required' },
      });
    }

    // Find user with this token
    const user = await db.query.users.findFirst({
      where: eq(schema.users.verificationToken, token),
    });

    if (!user) {
      // Redirect to frontend with error
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=invalid_token`
      );
    }

    // Update user: isVerified = true, verificationToken = null
    await db
      .update(schema.users)
      .set({
        isVerified: true,
        verificationToken: null,
      })
      .where(eq(schema.users.id, user.id));

    // Redirect to frontend login with success
    return res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?verified=true`
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=server_error`
    );
  }
};

/**
 * POST /api/auth/login
 * Login with email/username and password
 * Per ARCHITECTURE_SUMMARY.md - Email/Password Authentication
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or username

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Identifier and password are required' },
      });
    }

    // Find user by email or username
    const user = await db.query.users.findFirst({
      where: or(eq(schema.users.email, identifier), eq(schema.users.username, identifier)),
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/username or password' },
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/username or password' },
      });
    }

    // Check if user is verified (if verification is enabled)
    if (isEmailVerificationEnabled() && !user.isVerified) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email address to log in',
        },
      });
    }

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'USER_BANNED',
          message: 'User account is banned',
          details: {
            reason: user.banReason,
            bannedUntil: user.bannedUntil,
          },
        },
      });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Set httpOnly cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  }
};

/**
 * POST /api/auth/logout
 * Logout user by clearing auth cookie
 */
export const logout = async (_req: Request, res: Response) => {
  res.clearCookie('authToken');
  res.json({ success: true });
};

/**
 * GET /api/auth/me
 * Get current user info (works for both registered and anonymous)
 * Per ARCHITECTURE_SUMMARY.md line 1227: GET /api/auth/me
 */
export const getMe = async (req: Request, res: Response) => {
  if (!req.currentUser) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    });
  }

  res.json({
    success: true,
    data: req.currentUser,
  });
};

/**
 * POST /api/auth/session
 * Create anonymous session (if not already exists)
 * Per ARCHITECTURE_SUMMARY.md line 1218: POST /api/auth/session
 */
export const createSession = async (req: Request, res: Response) => {
  // If user already has a session (anonymous or registered), return it
  if (req.currentUser) {
    if (req.currentUser.type === 'anonymous') {
      return res.json({
        success: true,
        data: { sessionId: req.currentUser.sessionId },
      });
    }
    // Registered user
    return res.json({
      success: true,
      data: req.currentUser,
    });
  }

  // This shouldn't happen if authMiddleware ran, but handle it anyway
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

  res.cookie('sessionId', newSessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY * 1000,
  });

  res.json({
    success: true,
    data: { sessionId: newSessionId },
  });
};

/**
 * GET /api/auth/session
 * Validate current session
 * Per ARCHITECTURE_SUMMARY.md line 1219: GET /api/auth/session
 */
export const validateSession = async (req: Request, res: Response) => {
  if (!req.currentUser) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No valid session' },
    });
  }

  if (req.currentUser.type === 'anonymous') {
    // Get session details from Redis
    if (redis) {
      const sessionData = await redis.get(`session:${req.currentUser.sessionId}`);
      if (sessionData) {
        const session: SessionData = JSON.parse(sessionData);
        return res.json({
          success: true,
          data: {
            type: 'anonymous',
            sessionId: req.currentUser.sessionId,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
          },
        });
      }
    }
    // Redis not available but session exists
    return res.json({
      success: true,
      data: {
        type: 'anonymous',
        sessionId: req.currentUser.sessionId,
      },
    });
  }

  // Registered user
  res.json({
    success: true,
    data: req.currentUser,
  });
};

/**
 * DELETE /api/auth/session
 * Invalidate current session
 * Per ARCHITECTURE_SUMMARY.md line 1220: DELETE /api/auth/session
 */
export const invalidateSession = async (req: Request, res: Response) => {
  if (!req.currentUser) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No session to invalidate' },
    });
  }

  if (req.currentUser.type === 'anonymous' && redis) {
    // Delete session from Redis
    await redis.del(`session:${req.currentUser.sessionId}`);
  }

  // Clear session cookie
  res.clearCookie('sessionId');

  res.json({ success: true });
};

/**
 * OAuth callback handler
 * Called after successful OAuth authentication
 * Per ARCHITECTURE_SUMMARY.md - OAuth Authentication (Passport.js)
 */
export const oauthCallback = async (req: Request, res: Response) => {
  // Passport attaches the user from the database to req.user
  // We need to check if it's a valid database user object
  const dbUser = req.user as { id?: number; isBanned?: boolean } | undefined;

  if (!dbUser || !dbUser.id) {
    return res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`
    );
  }

  // Check if user is banned
  if (dbUser.isBanned) {
    return res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=user_banned`
    );
  }

  // Generate JWT token
  const token = jwt.sign({ userId: dbUser.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  // Set httpOnly cookie
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // Redirect to frontend dashboard
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`);
};

/**
 * GET /api/users/me/ban-status
 * Check if current user/session is banned
 * Per ARCHITECTURE_SUMMARY.md line 1335: GET /api/users/me/ban-status
 */
export const getBanStatus = async (req: Request, res: Response) => {
  if (!req.currentUser) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    });
  }

  if (req.currentUser.type === 'registered') {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, req.currentUser.id),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    return res.json({
      success: true,
      data: {
        isBanned: user.isBanned,
        bannedAt: user.bannedAt,
        bannedUntil: user.bannedUntil,
        banReason: user.banReason,
      },
    });
  }

  // Anonymous user
  if (redis) {
    const sessionData = await redis.get(`session:${req.currentUser.sessionId}`);
    if (sessionData) {
      const session: SessionData = JSON.parse(sessionData);
      return res.json({
        success: true,
        data: {
          isBanned: session.isBanned,
          bannedAt: session.bannedAt,
          bannedUntil: session.bannedUntil,
        },
      });
    }
  }

  res.json({
    success: true,
    data: {
      isBanned: false,
    },
  });
};
