'use client';

import { createAnonymousSession } from '@/lib/auth';
import { useEffect } from 'react';

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
