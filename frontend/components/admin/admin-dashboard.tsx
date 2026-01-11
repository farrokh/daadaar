'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { ContentReportsList } from './content-reports-list';
import { IndividualManagementPanel } from './individual-management-panel';
import { OrganizationManagementPanel } from './organization-management-panel';
import { ReportManagementPanel } from './report-management-panel';
import { RoleManagementPanel } from './role-management-panel';
import { UserManagementPanel } from './user-management-panel';

type AdminTab =
  | 'reports'
  | 'incident_reports'
  | 'users'
  | 'organizations'
  | 'roles'
  | 'individuals';

interface AdminDashboardProps {
  initialTab?: AdminTab;
  canManageUsers?: boolean;
}

export function AdminDashboard({
  initialTab = 'reports',
  canManageUsers = true,
}: AdminDashboardProps) {
  const t = useTranslations('admin');
  const [activeTab, setActiveTab] = useState<AdminTab>(
    canManageUsers || initialTab !== 'users' ? initialTab : 'reports'
  );

  const tabs = useMemo(
    () => [
      { key: 'reports', label: t('tab_reports') },
      { key: 'incident_reports', label: t('incident_reports_title') },
      ...(canManageUsers ? [{ key: 'users', label: t('tab_users') }] : []),
      { key: 'organizations', label: t('tab_organizations') },
      { key: 'roles', label: t('tab_roles') },
      { key: 'individuals', label: t('tab_individuals') },
    ],
    [t, canManageUsers]
  );

  return (
    <main className="min-h-screen pt-32 pb-32 px-6 md:px-12 max-w-5xl mx-auto font-sans">
      <header className="mb-12 space-y-6">
        <h1 className="text-sm font-medium uppercase text-foreground/50 border-b border-foreground/10 pb-4 tracking-[0.2em]">
          {t('dashboard_title')}
        </h1>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <p className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-[1.1]">
            {t('dashboard_subtitle')}
          </p>
        </div>
      </header>

      <div className="flex items-center gap-2 mb-12 overflow-x-auto pb-2 no-scrollbar">
        {tabs.map(tab => (
          <button
            type="button"
            key={tab.key}
            onClick={() => setActiveTab(tab.key as AdminTab)}
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

      <div className="space-y-12">
        {activeTab === 'reports' && <ContentReportsList />}
        {activeTab === 'incident_reports' && <ReportManagementPanel />}
        {activeTab === 'users' && canManageUsers && <UserManagementPanel />}
        {activeTab === 'organizations' && <OrganizationManagementPanel />}
        {activeTab === 'roles' && <RoleManagementPanel />}
        {activeTab === 'individuals' && <IndividualManagementPanel />}
      </div>
    </main>
  );
}
