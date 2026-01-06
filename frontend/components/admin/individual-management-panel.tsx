'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { fetchApi } from '@/lib/api';
import type { Individual, Organization, Role } from '@/shared/types';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

export function IndividualManagementPanel() {
  const t = useTranslations('admin');
  const commonT = useTranslations('common');

  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    fullName: '',
    biography: '',
    organizationId: '',
    roleId: '',
    startDate: '',
  });

  const organizationOptions = useMemo(
    () =>
      organizations.map(org => ({
        value: String(org.id),
        label: org.name,
      })),
    [organizations]
  );

  const filteredRoles = useMemo(() => {
    if (!form.organizationId) return roles;
    return roles.filter(role => String(role.organizationId) === form.organizationId);
  }, [form.organizationId, roles]);

  const fetchOrganizations = useCallback(async () => {
    const response = await fetchApi<Organization[]>('/organizations');
    if (response.success && response.data) {
      setOrganizations(response.data);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    const response = await fetchApi<Role[]>('/roles');
    if (response.success && response.data) {
      setRoles(response.data);
    }
  }, []);

  const fetchIndividuals = useCallback(async () => {
    setLoading(true);
    const response = await fetchApi<Individual[]>('/individuals');
    if (response.success && response.data) {
      setIndividuals(response.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrganizations();
    fetchRoles();
  }, [fetchOrganizations, fetchRoles]);

  useEffect(() => {
    fetchIndividuals();
  }, [fetchIndividuals]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const response = await fetchApi('/individuals', {
      method: 'POST',
      body: JSON.stringify({
        fullName: form.fullName,
        biography: form.biography || undefined,
        organizationId: form.organizationId ? Number(form.organizationId) : undefined,
        roleId: form.roleId ? Number(form.roleId) : undefined,
        startDate: form.startDate || undefined,
      }),
    });

    if (response.success) {
      setForm({ fullName: '', biography: '', organizationId: '', roleId: '', startDate: '' });
      fetchIndividuals();
    }
  };

  return (
    <div className="space-y-6">
      <form
        className="bg-background/40 border border-white/10 rounded-2xl p-4 space-y-3"
        onSubmit={handleSubmit}
      >
        <h3 className="text-lg font-semibold">{t('individuals_create_title')}</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <Input
            required
            value={form.fullName}
            placeholder={t('individuals_name_label')}
            onChange={e => setForm(prev => ({ ...prev, fullName: e.target.value }))}
          />
          <Input
            type="date"
            value={form.startDate}
            onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
            placeholder={t('individuals_start_label')}
          />
        </div>
        <Textarea
          value={form.biography}
          placeholder={t('individuals_bio_label')}
          onChange={e => setForm(prev => ({ ...prev, biography: e.target.value }))}
        />
        <div className="grid md:grid-cols-2 gap-3">
          <Select
            options={organizationOptions}
            value={form.organizationId}
            onChange={value => setForm(prev => ({ ...prev, organizationId: value }))}
            placeholder={t('individuals_org_label')}
          />
          <Select
            options={filteredRoles.map(role => ({ value: String(role.id), label: role.title }))}
            value={form.roleId}
            onChange={value => setForm(prev => ({ ...prev, roleId: value }))}
            placeholder={t('individuals_role_label')}
            disabled={!form.organizationId || filteredRoles.length === 0}
          />
        </div>
        <Button type="submit" variant="primary" className="w-full md:w-auto">
          {t('individuals_submit')}
        </Button>
      </form>

      <div className="bg-background/40 border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-foreground/60">{commonT('loading')}</div>
        ) : (
          <table className="w-full text-left rtl:text-right">
            <thead className="text-xs uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">{t('individuals_table_name')}</th>
                <th className="px-4 py-3">{t('individuals_table_org')}</th>
                <th className="px-4 py-3">{t('individuals_table_created')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-sm">
              {individuals.map(person => (
                <tr key={person.id} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{person.fullName}</span>
                    {person.biography && (
                      <span className="text-xs opacity-60 truncate max-w-[220px]">{person.biography}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 opacity-60">{commonT('none')}</td>
                <td className="px-4 py-3 opacity-60">{format(new Date(person.createdAt), 'PP')}</td>
              </tr>
            ))}
              {individuals.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center opacity-60 italic">
                    {t('individuals_empty')}
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
