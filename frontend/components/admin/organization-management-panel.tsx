'use client';

import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { fetchApi } from '@/lib/api';
import type { Organization } from '@/shared/types';

export function OrganizationManagementPanel() {
  const t = useTranslations('admin');
  const commonT = useTranslations('common');

  const [orgsData, setOrgsData] = useState<{
    organizations: Organization[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    logoUrl: '',
    parentId: '',
  });

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const organizations = orgsData?.organizations || [];

  const parentOptions = useMemo(
    () =>
      organizations
        .filter(org => org.id !== editingId)
        .map(org => ({
          value: org.id,
          label: org.name,
        })),
    [organizations, editingId]
  );

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: String(page),
      q: search,
    });
    const response = await fetchApi<{
      organizations: Organization[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/admin/organizations?${query.toString()}`);

    if (response.success && response.data) {
      setOrgsData(response.data);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrganizations();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchOrganizations]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const body = {
      name: form.name,
      nameEn: form.nameEn || null,
      description: form.description || null,
      descriptionEn: form.descriptionEn || null,
      logoUrl: form.logoUrl || null,
      parentId: form.parentId ? Number(form.parentId) : null,
    };

    const response = editingId
      ? await fetchApi(`/admin/organizations/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      : await fetchApi('/organizations', {
          method: 'POST',
          body: JSON.stringify(body),
        });

    if (response.success) {
      setForm({
        name: '',
        nameEn: '',
        description: '',
        descriptionEn: '',
        logoUrl: '',
        parentId: '',
      });
      setEditingId(null);
      setShowCreateForm(false);
      fetchOrganizations();
    }
  };

  const handleEdit = (org: Organization) => {
    setEditingId(org.id);
    setForm({
      name: org.name,
      nameEn: org.nameEn || '',
      description: org.description || '',
      descriptionEn: org.descriptionEn || '',
      logoUrl: org.logoUrl || '',
      parentId: org.parentId ? String(org.parentId) : '',
    });
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('delete_confirm'))) return;
    setDeletingId(id);
    const response = await fetchApi(`/admin/organizations/${id}`, {
      method: 'DELETE',
    });
    setDeletingId(null);
    if (response.success) {
      fetchOrganizations();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <Input
            placeholder={commonT('search')}
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-10 pl-9 bg-background/50 border-foreground/10"
          />
        </div>

        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('organizations_create_title')}
          </Button>
        )}
      </div>

      {showCreateForm && (
        <div className="bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium tracking-tight">
                {editingId ? t('edit') : t('organizations_create_title')}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground/40 hover:text-foreground"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    name: '',
                    nameEn: '',
                    description: '',
                    descriptionEn: '',
                    logoUrl: '',
                    parentId: '',
                  });
                  setShowCreateForm(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                required
                value={form.name}
                label={t('organizations_name_label')}
                placeholder={t('organizations_name_label')}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="bg-background/50 border-foreground/10 focus:border-foreground/20"
              />
              <Input
                value={form.nameEn}
                label={`${t('organizations_name_label')} (English)`}
                placeholder={`${t('organizations_name_label')} (English)`}
                onChange={e => setForm(prev => ({ ...prev, nameEn: e.target.value }))}
                className="bg-background/50 border-foreground/10 focus:border-foreground/20"
              />
            </div>
            <Textarea
              value={form.description}
              label={t('organizations_description_label')}
              placeholder={t('organizations_description_label')}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="bg-background/50 border-foreground/10 focus:border-foreground/20 min-h-[100px]"
            />
            <Textarea
              value={form.descriptionEn}
              label={`${t('organizations_description_label')} (English)`}
              placeholder={`${t('organizations_description_label')} (English)`}
              onChange={e => setForm(prev => ({ ...prev, descriptionEn: e.target.value }))}
              className="bg-background/50 border-foreground/10 focus:border-foreground/20 min-h-[100px]"
            />
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                value={form.logoUrl}
                label={t('organizations_logo_label')}
                placeholder={t('organizations_logo_label')}
                onChange={e => setForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                className="bg-background/50 border-foreground/10 focus:border-foreground/20"
              />
              <Select
                options={parentOptions.map(opt => ({ value: String(opt.value), label: opt.label }))}
                value={form.parentId}
                label={t('organizations_parent_label')}
                onChange={value => setForm(prev => ({ ...prev, parentId: value }))}
                placeholder={t('organizations_parent_label')}
                className="w-full bg-background/50 border-foreground/10 focus:border-foreground/20"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                {commonT('cancel')}
              </Button>
              <Button type="submit" variant="default">
                {editingId ? commonT('save') : t('organizations_submit')}
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading && !orgsData ? (
        <div className="p-12 text-center text-foreground/40 italic">{commonT('loading')}</div>
      ) : (
        <div className="rounded-xl border border-foreground/[0.05] overflow-x-auto">
          <table className="w-full text-left rtl:text-right min-w-[600px]">
            <thead className="text-xs uppercase bg-foreground/[0.02] text-foreground/50 font-medium">
              <tr>
                <th className="px-6 py-3 tracking-wider">{t('organizations_table_name')}</th>
                <th className="px-6 py-3 tracking-wider">{t('organizations_table_parent')}</th>
                <th className="px-6 py-3 tracking-wider">{t('organizations_table_created')}</th>
                <th className="px-6 py-3 text-right tracking-wider w-[100px]">
                  {t('col_actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/[0.05] text-sm">
              {orgsData?.organizations.map(org => (
                <tr key={org.id} className="hover:bg-foreground/[0.01] transition-colors group">
                  <td className="px-6 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground/90">{org.name}</span>
                      {org.description && (
                        <span className="text-xs text-foreground/50 truncate max-w-[200px]">
                          {org.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-foreground/70">
                    {org.parentId ? (
                      organizations.find(o => o.id === org.parentId)?.name ||
                      t('organizations_parent_label')
                    ) : (
                      <span className="opacity-30">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-foreground/60 text-xs">
                    {format(new Date(org.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-foreground/50 hover:text-foreground hover:bg-foreground/5"
                        onClick={() => handleEdit(org)}
                        title={commonT('edit')}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-foreground/50 hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => handleDelete(org.id)}
                        disabled={deletingId === org.id}
                        title={commonT('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {orgsData?.organizations.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-foreground/40 italic">
                    {t('organizations_empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {orgsData && orgsData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <span className="text-foreground/40 mr-2">
            {t('pagination_page', { current: page, total: orgsData.pagination.totalPages })}
          </span>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={page === orgsData.pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
