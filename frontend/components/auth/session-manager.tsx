'use client';

import { createAnonymousSession } from '@/lib/auth';
import { useEffect } from 'react';

/**
 * Initializes an anonymous session when the component mounts and renders no UI.
 *
 * Calls backend middleware to ensure an anonymous session (and related cookie) exists; any initialization errors are logged to the console.
 *
 * @returns null — the component renders nothing
 */
export function SessionManager() {
  useEffect(() => {
    // We just call it; the middleware in the backend handles checking for existing cookies
    // and only creates a new one if necessary.
    const initSession = async () => {
      try {
        await createAnonymousSession();
      } catch (error) {
        console.error('Failed to initialize anonymous session:', error);
      }
    };

    initSession();
  }, []);

  return null;
}