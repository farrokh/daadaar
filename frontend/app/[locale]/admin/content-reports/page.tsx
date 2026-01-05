'use client';

import { ContentReportsList } from '@/components/admin/content-reports-list';
import { useAuth } from '@/lib/auth';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminContentReportsPage() {
  const t = useTranslations('admin');
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

  // Prevent flash of content before redirect
  const isAuthorized =
    isAuthenticated &&
    currentUser?.type === 'registered' &&
    (currentUser.role === 'admin' || currentUser.role === 'moderator');

  if (!isAuthorized) {
    return null;
  }

  return (
    <main className="min-h-screen pt-32 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">{t('dashboard_title')}</h1>
          <p className="text-foreground/60">{t('dashboard_subtitle')}</p>
        </div>

        <ContentReportsList />
      </div>
    </main>
  );
}
