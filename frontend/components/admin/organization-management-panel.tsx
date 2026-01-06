'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { fetchApi } from '@/lib/api';
import type { Organization } from '@/shared/types';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

export function OrganizationManagementPanel() {
  const t = useTranslations('admin');
  const commonT = useTranslations('common');

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    description: '',
    parentId: '',
  });
  const parentOptions = useMemo(
    () =>
      organizations.map(org => ({
        value: org.id,
        label: org.name,
      })),
    [organizations]
  );

  const fetchOrganizations = async () => {
    setLoading(true);
    const response = await fetchApi<Organization[]>('/organizations');
    if (response.success && response.data) {
      setOrganizations(response.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const response = await fetchApi('/organizations', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        parentId: form.parentId ? Number(form.parentId) : undefined,
      }),
    });

    if (response.success) {
      setForm({ name: '', description: '', parentId: '' });
      fetchOrganizations();
    }
  };

  return (
    <div className="space-y-6">
      <form
        className="bg-background/40 border border-white/10 rounded-2xl p-4 space-y-3"
        onSubmit={handleSubmit}
      >
        <h3 className="text-lg font-semibold">{t('organizations_create_title')}</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <Input
            required
            value={form.name}
            placeholder={t('organizations_name_label')}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
          />
          <div>
            <select
              className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2"
              value={form.parentId}
              onChange={e => setForm(prev => ({ ...prev, parentId: e.target.value }))}
            >
              <option value="">{t('organizations_parent_label')}</option>
              {parentOptions.map(option => (
                <option key={option.value} value={option.value} className="bg-slate-950">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Textarea
          value={form.description}
          placeholder={t('organizations_description_label')}
          onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
        />
        <Button type="submit" variant="primary" className="w-full md:w-auto">
          {t('organizations_submit')}
        </Button>
      </form>

      <div className="bg-background/40 border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-foreground/60">{commonT('loading')}</div>
        ) : (
          <table className="w-full text-left rtl:text-right">
            <thead className="text-xs uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">{t('organizations_table_name')}</th>
                <th className="px-4 py-3">{t('organizations_table_parent')}</th>
                <th className="px-4 py-3">{t('organizations_table_created')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-sm">
              {organizations.map(org => (
                <tr key={org.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">{org.name}</td>
                  <td className="px-4 py-3 opacity-60">
                    {org.parentId
                      ? organizations.find(o => o.id === org.parentId)?.name || t('organizations_parent_label')
                      : commonT('none')}
                  </td>
                  <td className="px-4 py-3 opacity-60">{format(new Date(org.createdAt), 'PP')}</td>
                </tr>
              ))}
              {organizations.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center opacity-60 italic">
                    {t('organizations_empty')}
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
