'use client';

import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { useAuth } from '@/lib/auth';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const tCommon = useTranslations('common');
  const { currentUser, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      const isAuthorized =
        isAuthenticated &&
        currentUser?.type === 'registered' &&
        (currentUser.role === 'admin' || currentUser.role === 'moderator');

      if (!isAuthorized) {
        router.push('/');
      }
    }
  }, [loading, isAuthenticated, currentUser, router]);

  if (loading) {
    return <div className="min-h-screen pt-32 flex justify-center">{tCommon('loading')}</div>;
  }

  const isAuthorized =
    isAuthenticated &&
    currentUser?.type === 'registered' &&
    (currentUser.role === 'admin' || currentUser.role === 'moderator');

  if (!isAuthorized) {
    return null;
  }

  return <AdminDashboard canManageUsers={currentUser.role === 'admin'} />;
}
