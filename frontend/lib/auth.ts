import type { CurrentUser } from '@/shared/types';
import { fetchApi } from './api';

/**
 * Retrieves the currently authenticated user, including anonymous sessions.
 *
 * @returns The authenticated CurrentUser if present, otherwise `null`.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const response = await fetchApi<CurrentUser>('/auth/me');
  if (response.success && response.data) {
    return response.data;
  }
  return null;
}

/**
 * Log out the current user and navigate to the site root if successful.
 *
 * @returns `true` if the logout request succeeded, `false` otherwise.
 */
export async function logout(): Promise<boolean> {
  const response = await fetchApi<void>('/auth/logout', { method: 'POST' });
  if (response.success) {
    window.location.href = '/';
  }
  return response.success;
}

/**
 * Ensure an anonymous session exists and return its session identifier.
 *
 * @returns `{ sessionId: string }` containing the session ID if available, `null` if the session could not be created or validated
 */
export async function createAnonymousSession(): Promise<{ sessionId: string } | null> {
  const response = await fetchApi<{ sessionId: string }>('/auth/session', { method: 'POST' });
  return response.success ? (response.data ?? null) : null;
}

/**
 * Check whether the current authentication session is still valid.
 *
 * @returns `true` if the current session is valid, `false` otherwise.
 */
export async function validateSession(): Promise<boolean> {
  const response = await fetchApi<unknown>('/auth/session', { method: 'GET' });
  return response.success;
}

/**
 * Invalidate the current authentication session.
 *
 * @returns `true` if the session was invalidated, `false` otherwise.
 */
export async function invalidateSession(): Promise<boolean> {
  const response = await fetchApi<void>('/auth/session', { method: 'DELETE' });
  return response.success;
}

/**
 * Determine whether the current user or session is banned.
 *
 * @returns The ban status object `{ isBanned: boolean; bannedAt?: string; bannedUntil?: string; banReason?: string }` when available, or `null` if the status could not be retrieved.
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
 * Authenticate a user using an email address or username and a password.
 *
 * @param identifier - The user's email address or username
 * @param password - The user's password
 * @returns `success` is `true` when authentication succeeds, `false` otherwise. When `success` is `false`, `error` contains a human-readable failure message.
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
 * Create a new user account with the provided credentials and optional display name.
 *
 * @param data - Registration information.
 * @param data.email - User's email address.
 * @param data.username - Chosen username.
 * @param data.password - Account password.
 * @param data.displayName - Optional display name to show in the UI.
 * @returns `{ success: true }` on success, or `{ success: false, error: string }` with an error message on failure.
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
 * Builds the OAuth login URL for the specified provider.
 *
 * @param provider - OAuth provider, either `'google'` or `'github'`
 * @returns The full OAuth endpoint URL for the given provider
 */
export function getOAuthUrl(provider: 'google' | 'github'): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  return `${apiUrl}/auth/${provider}`;
}