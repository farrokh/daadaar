// Import shared types from the shared package
import type { AnonymousUser, ApiResponse, AuthUser, CurrentUser, UserRole } from '@/shared/types';

// Re-export types for convenience
export type { ApiResponse, CurrentUser, AuthUser, AnonymousUser, UserRole };

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Fetch API helper with cookie support
 * Ensures credentials (cookies) are sent with every request
 */
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${endpoint}`;

  // Default headers
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Ensure credentials (cookies) are sent
  const config: RequestInit = {
    ...options,
    headers,
    credentials: options.credentials || 'include',
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || {
          code: 'FETCH_ERROR',
          message: `Request failed with status ${response.status}`,
        },
      };
    }

    return data;
  } catch (error) {
    console.error(`API Fetch Error (${endpoint}):`, error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network request failed',
      },
    };
  }
}
