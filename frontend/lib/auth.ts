import { AuthContext } from '@/components/auth/auth-provider';
import type { CurrentUser } from '@/shared/types';
import { useContext } from 'react';
import { fetchApi } from './api';

/**
 * Get current authenticated user
 * Works for both registered users and anonymous sessions
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const response = await fetchApi<CurrentUser>('/auth/me');
  if (response.success && response.data) {
    return response.data;
  }
  return null;
}

/**
 * Logout the current user
 * Clears the auth cookie on the backend
 */
export async function logout(): Promise<boolean> {
  const response = await fetchApi<void>('/auth/logout', { method: 'POST' });
  if (response.success) {
    window.location.href = '/';
  }
  return response.success;
}

/**
 * Create or validate anonymous session
 * The backend middleware handles session creation automatically,
 * this just ensures a session exists and returns its ID
 */
export async function createAnonymousSession(): Promise<{ sessionId: string } | null> {
  const response = await fetchApi<{ sessionId: string }>('/auth/session', { method: 'POST' });
  return response.success ? (response.data ?? null) : null;
}

/**
 * Validate current session
 */
export async function validateSession(): Promise<boolean> {
  const response = await fetchApi<unknown>('/auth/session', { method: 'GET' });
  return response.success;
}

/**
 * Invalidate current session (logout for anonymous users)
 */
export async function invalidateSession(): Promise<boolean> {
  const response = await fetchApi<void>('/auth/session', { method: 'DELETE' });
  return response.success;
}

/**
 * Check if current user/session is banned
 */
export async function getBanStatus(): Promise<{
  isBanned: boolean;
  bannedAt?: string;
  bannedUntil?: string;
  banReason?: string;
} | null> {
  const response = await fetchApi<{
    isBanned: boolean;
    bannedAt?: string;
    bannedUntil?: string;
    banReason?: string;
  }>('/auth/ban-status');
  return response.success ? (response.data ?? null) : null;
}

/**
 * Login with email/username and password
 */
export async function login(
  identifier: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetchApi<CurrentUser>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });

  if (response.success) {
    return { success: true };
  }

  return {
    success: false,
    error: response.error?.message || 'Login failed',
  };
}

/**
 * Register a new user
 */
export async function register(data: {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const response = await fetchApi<CurrentUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (response.success) {
    return { success: true };
  }

  return {
    success: false,
    error: response.error?.message || 'Registration failed',
  };
}

/**
 * Get OAuth login URL
 */
export function getOAuthUrl(provider: 'google' | 'github'): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  return `${apiUrl}/auth/${provider}`;
}

/**
 * React hook to get the current authenticated user from the AuthContext
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
