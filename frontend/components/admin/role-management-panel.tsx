'use client';

import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Filter, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { fetchApi } from '@/lib/api';
import type { Organization, Role } from '@/shared/types';

export function RoleManagementPanel() {
  const t = useTranslations('admin');
  const commonT = useTranslations('common');

  const [rolesData, setRolesData] = useState<{
    roles: Role[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  } | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    organizationId: '',
    title: '',
    description: '',
  });

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const roles = rolesData?.roles || [];

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
    const query = new URLSearchParams({
      page: String(page),
      q: search,
    });
    if (selectedOrg) query.append('organizationId', selectedOrg);

    const response = await fetchApi<{
      roles: Role[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/admin/roles?${query.toString()}`);

    if (response.success && response.data) {
      setRolesData(response.data);
    }
    setLoading(false);
  }, [selectedOrg, page, search]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRoles();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchRoles]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.organizationId) return;

    const body = {
      organizationId: Number(form.organizationId),
      title: form.title,
      description: form.description || null,
    };

    const response = editingId
      ? await fetchApi(`/admin/roles/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      : await fetchApi('/roles', {
          method: 'POST',
          body: JSON.stringify(body),
        });

    if (response.success) {
      setForm({ organizationId: '', title: '', description: '' });
      setEditingId(null);
      setShowCreateForm(false);
      fetchRoles();
    }
  };

  const handleEdit = (role: Role) => {
    setEditingId(role.id);
    setForm({
      organizationId: String(role.organizationId),
      title: role.title,
      description: role.description || '',
    });
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('delete_confirm'))) return;
    setDeletingId(id);
    const response = await fetchApi(`/admin/roles/${id}`, {
      method: 'DELETE',
    });
    setDeletingId(null);
    if (response.success) {
      fetchRoles();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
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
          <div className="relative w-full sm:w-48">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <Filter className="w-4 h-4 text-foreground/40" />
            </div>
            <Select
              options={[{ value: '', label: t('all') }, ...organizationOptions]}
              value={selectedOrg}
              onChange={value => {
                setSelectedOrg(value);
                setPage(1);
              }}
              className="h-10 pl-9 bg-background/50 border-foreground/10"
              placeholder={t('organization')}
            />
          </div>
        </div>

        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('roles_create_title')}
          </Button>
        )}
      </div>

      {showCreateForm && (
        <div className="bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium tracking-tight">
                {editingId ? t('edit') : t('roles_create_title')}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground/40 hover:text-foreground"
                onClick={() => {
                  setEditingId(null);
                  setForm({ organizationId: '', title: '', description: '' });
                  setShowCreateForm(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Select
                options={organizationOptions}
                value={form.organizationId}
                label={t('roles_org_label')}
                onChange={value => setForm(prev => ({ ...prev, organizationId: value }))}
                placeholder={t('roles_org_label')}
                className="w-full bg-background/50 border-foreground/10 focus:border-foreground/20"
              />
              <Input
                required
                value={form.title}
                label={t('roles_title_label')}
                placeholder={t('roles_title_label')}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="bg-background/50 border-foreground/10 focus:border-foreground/20"
              />
            </div>
            <Textarea
              value={form.description}
              label={t('roles_description_label')}
              placeholder={t('roles_description_label')}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="bg-background/50 border-foreground/10 focus:border-foreground/20 min-h-[80px]"
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                {commonT('cancel')}
              </Button>
              <Button type="submit" variant="default" disabled={!form.organizationId}>
                {editingId ? commonT('save') : t('roles_submit')}
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading && !rolesData ? (
        <div className="p-12 text-center text-foreground/40 italic">{commonT('loading')}</div>
      ) : (
        <div className="rounded-xl border border-foreground/[0.05] overflow-x-auto">
          <table className="w-full text-left rtl:text-right min-w-[600px]">
            <thead className="text-xs uppercase bg-foreground/[0.02] text-foreground/50 font-medium">
              <tr>
                <th className="px-6 py-3 tracking-wider">{t('roles_table_title')}</th>
                <th className="px-6 py-3 tracking-wider">{t('roles_table_org')}</th>
                <th className="px-6 py-3 tracking-wider">{t('roles_table_created')}</th>
                <th className="px-6 py-3 text-right tracking-wider w-[100px]">
                  {t('col_actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/[0.05] text-sm">
              {roles.map(role => (
                <tr key={role.id} className="hover:bg-foreground/[0.01] transition-colors group">
                  <td className="px-6 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground/90">{role.title}</span>
                      {role.description && (
                        <span className="text-xs text-foreground/50 truncate max-w-[200px]">
                          {role.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-foreground/70">
                    {organizations.find(org => org.id === role.organizationId)?.name ||
                      t('roles_org_label')}
                  </td>
                  <td className="px-6 py-3 text-foreground/60 text-xs">
                    {format(new Date(role.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-foreground/50 hover:text-foreground hover:bg-foreground/5"
                        onClick={() => handleEdit(role)}
                        title={commonT('edit')}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-foreground/50 hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => handleDelete(role.id)}
                        disabled={deletingId === role.id}
                        title={commonT('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-foreground/40 italic">
                    {t('roles_empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {rolesData && rolesData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <span className="text-foreground/40 mr-2">
            {t('pagination_page', { current: page, total: rolesData.pagination.totalPages })}
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
            disabled={page === rolesData.pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
