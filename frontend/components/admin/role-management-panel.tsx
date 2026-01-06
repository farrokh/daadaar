'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { fetchApi } from '@/lib/api';
import type { Organization, Role } from '@/shared/types';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

export function RoleManagementPanel() {
  const t = useTranslations('admin');
  const commonT = useTranslations('common');

  const [roles, setRoles] = useState<Role[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [form, setForm] = useState({
    organizationId: '',
    title: '',
    description: '',
  });

  const organizationOptions = useMemo(
    () =>
      organizations.map(org => ({
        value: org.id,
        label: org.name,
      })),
    [organizations]
  );

  const fetchOrganizations = useCallback(async () => {
    const response = await fetchApi<Organization[]>('/organizations');
    if (response.success && response.data) {
      setOrganizations(response.data);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    const query = selectedOrg ? `?organizationId=${selectedOrg}` : '';
    const response = await fetchApi<Role[]>(`/roles${query}`);
    if (response.success && response.data) {
      setRoles(response.data);
    }
    setLoading(false);
  }, [selectedOrg]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.organizationId) return;

    const response = await fetchApi('/roles', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: Number(form.organizationId),
        title: form.title,
        description: form.description || undefined,
      }),
    });

    if (response.success) {
      setForm({ organizationId: '', title: '', description: '' });
      fetchRoles();
    }
  };

  return (
    <div className="space-y-6">
      <form
        className="bg-background/40 border border-white/10 rounded-2xl p-4 space-y-3"
        onSubmit={handleSubmit}
      >
        <h3 className="text-lg font-semibold">{t('roles_create_title')}</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <Select
            options={organizationOptions}
            value={form.organizationId}
            onChange={value => setForm(prev => ({ ...prev, organizationId: value }))}
            placeholder={t('roles_org_label')}
          />
          <Input
            required
            value={form.title}
            placeholder={t('roles_title_label')}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>
        <Textarea
          value={form.description}
          placeholder={t('roles_description_label')}
          onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
        />
        <Button type="submit" variant="primary" className="w-full md:w-auto" disabled={!form.organizationId}>
          {t('roles_submit')}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Select
          options={[{ value: '', label: t('all') }, ...organizationOptions]}
          value={selectedOrg}
          onChange={value => setSelectedOrg(value)}
          placeholder={t('roles_org_filter')}
          className="w-full md:w-64"
        />
        <Button onClick={() => fetchRoles()} variant="outline">
          {t('refresh')}
        </Button>
      </div>

      <div className="bg-background/40 border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-foreground/60">{commonT('loading')}</div>
        ) : (
          <table className="w-full text-left rtl:text-right">
            <thead className="text-xs uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">{t('roles_table_title')}</th>
                <th className="px-4 py-3">{t('roles_table_org')}</th>
                <th className="px-4 py-3">{t('roles_table_created')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-sm">
              {roles.map(role => (
                <tr key={role.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{role.title}</span>
                      {role.description && <span className="text-xs opacity-60">{role.description}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 opacity-60">
                    {organizations.find(org => org.id === role.organizationId)?.name || t('roles_org_label')}
                  </td>
                  <td className="px-4 py-3 opacity-60">{format(new Date(role.createdAt), 'PP')}</td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center opacity-60 italic">
                    {t('roles_empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
