'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { ChangePasswordForm } from './change-password-form';

interface ProfileDashboardProps {
  // biome-ignore lint/suspicious/noExplicitAny: User type definition varies in different files
  user: any;
}

type ProfileTab = 'security';

export function ProfileDashboard({ user }: ProfileDashboardProps) {
  const t = useTranslations('profile');
  const [activeTab, setActiveTab] = useState<ProfileTab>('security');

  const tabs = useMemo(() => [{ key: 'security', label: t('tab_security') }], [t]);

  return (
    <main className="min-h-screen pt-32 pb-32 px-6 md:px-12 max-w-3xl mx-auto font-sans">
      <header className="mb-12 space-y-6">
        <h1 className="text-sm font-medium uppercase text-foreground/50 border-b border-foreground/10 pb-4 tracking-[0.2em]">
          {t('title')}
        </h1>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <p className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-[1.1]">
            {user.displayName || user.username}
          </p>
        </div>
        <p className="text-lg text-foreground/60 max-w-2xl leading-relaxed">{t('subtitle')}</p>
      </header>

      <div className="flex items-center gap-2 mb-12 overflow-x-auto pb-2 no-scrollbar">
        {tabs.map(tab => (
          <button
            type="button"
            key={tab.key}
            onClick={() => setActiveTab(tab.key as ProfileTab)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.key
                ? 'bg-foreground text-background'
                : 'bg-foreground/5 text-foreground/60 hover:text-foreground hover:bg-foreground/10'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-12">{activeTab === 'security' && <ChangePasswordForm />}</div>
    </main>
  );
}
