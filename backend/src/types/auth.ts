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

// Extend Express Request with user property
// This interface includes all Express Request properties (params, query, body, etc.)
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
