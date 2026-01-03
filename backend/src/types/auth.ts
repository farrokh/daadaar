// Type definitions for Express request with authentication
import type { Request } from 'express';

// User types from auth middleware
export interface RegisteredUser {
  type: 'registered';
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
  role: 'user' | 'admin' | 'moderator';
}

export interface AnonymousUser {
  type: 'anonymous';
  sessionId: string;
}

export type AuthUser = RegisteredUser | AnonymousUser;

// Express user is already defined in middleware/auth.ts
// after requireAuth, req.user is guaranteed to be a RegisteredUser

export interface AuthenticatedRequest extends Request {
  user: Express.User;
}
