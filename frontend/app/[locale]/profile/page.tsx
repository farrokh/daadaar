'use client';

import { ProfileDashboard } from '@/components/profile/profile-dashboard';
import { useAuth } from '@/lib/auth';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const tCommon = useTranslations('common');
  const { currentUser, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || currentUser?.type !== 'registered') {
        router.push('/login');
      }
    }
  }, [loading, isAuthenticated, currentUser, router]);

  if (loading) {
    return <div className="min-h-screen pt-32 flex justify-center">{tCommon('loading')}</div>;
  }

  if (!isAuthenticated || currentUser?.type !== 'registered') {
    return null;
  }

  return <ProfileDashboard user={currentUser} />;
}
