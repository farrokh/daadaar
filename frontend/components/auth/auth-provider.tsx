'use client';

import { getCurrentUser, logout as logoutApi } from '@/lib/auth';
import type { CurrentUser } from '@/shared/types';
import type React from 'react';
import { createContext, useCallback, useEffect, useState } from 'react';

interface AuthContextType {
  currentUser: CurrentUser | null;
  loading: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAnonymous: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = async () => {
    const success = await logoutApi();
    if (success) {
      setCurrentUser(null);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    refreshUser: fetchUser,
    logout,
    isAuthenticated: !!currentUser && currentUser.type === 'registered',
    isAnonymous: !!currentUser && currentUser.type === 'anonymous',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
