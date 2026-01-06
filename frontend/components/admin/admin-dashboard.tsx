'use client';

import { Button } from '@/components/ui/button';
import { ContentReportsList } from './content-reports-list';
import { IndividualManagementPanel } from './individual-management-panel';
import { OrganizationManagementPanel } from './organization-management-panel';
import { RoleManagementPanel } from './role-management-panel';
import { UserManagementPanel } from './user-management-panel';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

type AdminTab = 'reports' | 'users' | 'organizations' | 'roles' | 'individuals';

interface AdminDashboardProps {
  initialTab?: AdminTab;
  canManageUsers?: boolean;
}

export function AdminDashboard({ initialTab = 'reports', canManageUsers = true }: AdminDashboardProps) {
  const t = useTranslations('admin');
  const [activeTab, setActiveTab] = useState<AdminTab>(
    canManageUsers || initialTab !== 'users' ? initialTab : 'reports'
  );

  const tabs = useMemo(
    () =>
      [
        { key: 'reports', label: t('tab_reports') },
        ...(canManageUsers ? [{ key: 'users', label: t('tab_users') }] : []),
        { key: 'organizations', label: t('tab_organizations') },
        { key: 'roles', label: t('tab_roles') },
        { key: 'individuals', label: t('tab_individuals') },
      ],
    [t, canManageUsers]
  );

  return (
    <main className="min-h-screen pt-32 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">{t('dashboard_title')}</h1>
          <p className="text-foreground/60">{t('dashboard_subtitle')}</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {tabs.map(tab => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'primary' : 'outline'}
              onClick={() => setActiveTab(tab.key as AdminTab)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="bg-background/60 border border-white/10 rounded-2xl p-6 shadow-xl">
          {activeTab === 'reports' && <ContentReportsList />}
          {activeTab === 'users' && canManageUsers && <UserManagementPanel />}
          {activeTab === 'organizations' && <OrganizationManagementPanel />}
          {activeTab === 'roles' && <RoleManagementPanel />}
          {activeTab === 'individuals' && <IndividualManagementPanel />}
        </div>
      </div>
    </main>
  );
}
