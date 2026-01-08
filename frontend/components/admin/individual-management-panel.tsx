'use client';

import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect, type SelectOption } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { fetchApi } from '@/lib/api';
import type { Individual, Organization, Role } from '@/shared/types';

interface OrganizationListResponse {
  organizations: Organization[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface RoleListResponse {
  roles: Role[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function IndividualManagementPanel() {
  const t = useTranslations('admin');
  const commonT = useTranslations('common');

  const [indsData, setIndsData] = useState<{
    individuals: Individual[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  } | null>(null);

  // These will store the options for the dropdowns
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [loading, setLoading] = useState(true);
  const [fetchingOrgs, setFetchingOrgs] = useState(false);
  const [fetchingRoles, setFetchingRoles] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    fullNameEn: '',
    biography: '',
    biographyEn: '',
    profileImageUrl: '',
    dateOfBirth: '',
    organizationId: '',
    roleId: '',
    startDate: '',
    endDate: '',
  });

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const individuals = indsData?.individuals || [];

  const updateOrganizationOptions = useCallback((newOrgs: Organization[]) => {
    setOrganizations(prev => {
      // Merge new orgs with existing ones, avoiding duplicates, to keep selected ones available
      const map = new Map(prev.map(o => [o.id, o]));
      for (const o of newOrgs) {
        map.set(o.id, o);
      }
      return Array.from(map.values());
    });
  }, []);

  const fetchOrganizations = useCallback(
    async (searchQuery = '') => {
      try {
        setFetchingOrgs(true);
        setError(null);
        const query = new URLSearchParams({
          page: '1',
          limit: '20',
          q: searchQuery,
        });

        const response = await fetchApi<OrganizationListResponse>(
          `/admin/organizations?${query.toString()}`
        );
        if (response.success && response.data) {
          if ('organizations' in response.data) {
            updateOrganizationOptions(response.data.organizations);
          } else if (Array.isArray(response.data)) {
            updateOrganizationOptions(response.data);
          }
        } else if (response.error) {
          console.error(response.error.message);
        }
      } catch (err) {
        console.error('Failed to fetch organizations:', err);
      } finally {
        setFetchingOrgs(false);
      }
    },
    [updateOrganizationOptions]
  );

  const fetchRoles = useCallback(async (orgId: string, searchQuery = '') => {
    try {
      setFetchingRoles(true);
      const query = new URLSearchParams({
        page: '1',
        limit: '20',
        q: searchQuery,
      });
      if (orgId) {
        query.append('organizationId', orgId);
      }

      const response = await fetchApi<RoleListResponse>(`/admin/roles?${query.toString()}`);
      const data = response.data;
      if (response.success && data && 'roles' in data) {
        // Update roles list for the SearchableSelect
        // Note: form.roleId is cleared in the SearchableSelect onChange handler
        setRoles(prev => {
          const map = new Map(prev.map(role => [role.id, role]));
          for (const role of data.roles) {
            map.set(role.id, role);
          }
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    } finally {
      setFetchingRoles(false);
    }
  }, []);

  const fetchIndividuals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams({
        page: String(page),
        q: search,
      });
      const response = await fetchApi<{
        individuals: Individual[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>(`/admin/individuals?${query.toString()}`);

      if (response.success && response.data) {
        setIndsData(response.data);
      } else if (response.error) {
        setError(response.error.message);
      }
    } catch (err) {
      console.error('Failed to fetch individuals:', err);
      setError('Failed to load individuals');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    // Initial fetch of options (first 20)
    fetchOrganizations();
  }, [fetchOrganizations]); // Only on mount/deps change

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIndividuals();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchIndividuals]);

  // When organization changes, refetch roles
  useEffect(() => {
    if (form.organizationId) {
      fetchRoles(form.organizationId, '');
    }
  }, [form.organizationId, fetchRoles]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const body = {
        fullName: form.fullName,
        fullNameEn: form.fullNameEn || null,
        biography: form.biography || null,
        biographyEn: form.biographyEn || null,
        profileImageUrl: form.profileImageUrl || null,
        dateOfBirth: form.dateOfBirth || null,
        organizationId: form.organizationId ? Number(form.organizationId) : null,
        roleId: form.roleId ? Number(form.roleId) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };

      const response = editingId
        ? await fetchApi(`/admin/individuals/${editingId}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        : await fetchApi('/individuals', {
            method: 'POST',
            body: JSON.stringify(body),
          });

      if (response.success) {
        setForm({
          fullName: '',
          fullNameEn: '',
          biography: '',
          biographyEn: '',
          profileImageUrl: '',
          dateOfBirth: '',
          organizationId: '',
          roleId: '',
          startDate: '',
          endDate: '',
        });
        setEditingId(null);
        setShowCreateForm(false);
        fetchIndividuals();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else if (response.error) {
        setSubmitError(response.error.message);
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (person: Individual) => {
    setEditingId(person.id);

    // Ensure the current organization and role are in the options so they display correctly
    if (person.currentOrganizationId && person.currentOrganization) {
      // We need to make sure we have this org in options.
      // If it's not loaded, we might need to fetch it or cheat by adding it if we have the name.
      // We have `person.currentOrganization` (name).
      const orgId = person.currentOrganizationId;
      const orgName = person.currentOrganization;

      setOrganizations(prev => {
        if (!prev.find(o => o.id === orgId)) {
          return [
            ...prev,
            {
              id: orgId,
              name: orgName,
              nameEn: null,
              description: null,
              descriptionEn: null,
              parentId: null,
              logoUrl: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              shareableUuid: '',
            } as Organization,
          ];
        }
        return prev;
      });
    }

    const baseForm = {
      fullName: person.fullName,
      fullNameEn: person.fullNameEn || '',
      biography: person.biography || '',
      biographyEn: person.biographyEn || '',
      profileImageUrl: person.profileImageUrl || '',
      dateOfBirth: person.dateOfBirth ? person.dateOfBirth.split('T')[0] : '',
      organizationId: person.currentOrganizationId ? String(person.currentOrganizationId) : '',
      roleId: '',
      startDate: '',
      endDate: '',
    };

    setForm(baseForm);
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fetch current role occupancy to get role and start date
    if (person.currentOrganizationId) {
      try {
        const response = await fetchApi<
          { id: number; roleId: number; startDate: string; endDate: string | null }[]
        >(`/individuals/${person.id}/roles`);

        if (response.success && response.data && response.data.length > 0) {
          const currentRole = response.data[0];

          // Also fetch the specific role to add to options using /api/roles/:id if needed,
          // or rely on `fetchRoles` filtering by org to likely find it.
          // BUT `fetchRoles` is async and might happen after pagination.
          // Better: If we have the role ID, we should try to fetch it specifically or rely on the fact that filtering by org typically returns a small enough list?
          // If the org has > 20 roles, and this one is 21st, it won't show.
          // Ideally we fetch the single role to add to options.

          if (currentRole.roleId) {
            const roleRes = await fetchApi<Role>(`/admin/roles/${currentRole.roleId}`);
            if (roleRes.success && roleRes.data) {
              const roleData = roleRes.data;
              setRoles(prev => {
                if (!prev.find(r => r.id === roleData.id)) {
                  return [...prev, roleData];
                }
                return prev;
              });
            }
          }

          setForm(prev => ({
            ...prev,
            roleId: String(currentRole.roleId),
            startDate: currentRole.startDate ? currentRole.startDate.split('T')[0] : '',
            endDate: currentRole.endDate ? currentRole.endDate.split('T')[0] : '',
          }));
        }
      } catch (err) {
        console.error('Failed to fetch role occupancy:', err);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('delete_confirm'))) return;
    setDeletingId(id);
    const response = await fetchApi(`/admin/individuals/${id}`, {
      method: 'DELETE',
    });
    setDeletingId(null);
    if (response.success) {
      fetchIndividuals();
    }
  };

  const organizationOptions = useMemo(
    () =>
      organizations.map(org => ({
        value: String(org.id),
        label: org.name,
      })),
    [organizations]
  );

  const roleOptions = useMemo(
    () =>
      roles.map(role => ({
        value: String(role.id),
        label: role.title,
      })),
    [roles]
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm animate-in fade-in duration-300">
          {error}
        </div>
      )}
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
            {t('individuals_create_title')}
          </Button>
        )}
      </div>

      {showCreateForm && (
        <div className="bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {submitError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-lg text-sm mb-4">
                {submitError}
              </div>
            )}
            {showSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-2 rounded-lg text-sm mb-4">
                {commonT('success')}
              </div>
            )}
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium tracking-tight">
                {editingId ? t('edit') : t('individuals_create_title')}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground/40 hover:text-foreground"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    fullName: '',
                    fullNameEn: '',
                    biography: '',
                    biographyEn: '',
                    profileImageUrl: '',
                    dateOfBirth: '',
                    organizationId: '',
                    roleId: '',
                    startDate: '',
                    endDate: '',
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
                value={form.fullName}
                label={t('individuals_name_label')}
                placeholder={t('individuals_name_label')}
                onChange={e => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                className="bg-background/50 border-foreground/10 focus:border-foreground/20"
              />
              <Input
                value={form.fullNameEn}
                label={`${t('individuals_name_label')} (English)`}
                placeholder={`${t('individuals_name_label')} (English)`}
                onChange={e => setForm(prev => ({ ...prev, fullNameEn: e.target.value }))}
                className="bg-background/50 border-foreground/10 focus:border-foreground/20"
              />
            </div>
            <Textarea
              value={form.biography}
              label={t('individuals_bio_label')}
              placeholder={t('individuals_bio_label')}
              onChange={e => setForm(prev => ({ ...prev, biography: e.target.value }))}
              className="bg-background/50 border-foreground/10 focus:border-foreground/20 min-h-[80px]"
            />
            <Textarea
              value={form.biographyEn}
              label={`${t('individuals_bio_label')} (English)`}
              placeholder={`${t('individuals_bio_label')} (English)`}
              onChange={e => setForm(prev => ({ ...prev, biographyEn: e.target.value }))}
              className="bg-background/50 border-foreground/10 focus:border-foreground/20 min-h-[80px]"
            />
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                value={form.profileImageUrl}
                label={t('individuals_image_label')}
                placeholder={t('individuals_image_label')}
                onChange={e => setForm(prev => ({ ...prev, profileImageUrl: e.target.value }))}
                className="bg-background/50 border-foreground/10 focus:border-foreground/20"
              />
              <Input
                type="date"
                value={form.dateOfBirth}
                label={t('individuals_dob_label')}
                onChange={e => setForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                placeholder={t('individuals_dob_label')}
                className="bg-background/50 border-foreground/10 focus:border-foreground/20"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                type="date"
                value={form.startDate}
                label={t('individuals_start_label')}
                onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                placeholder={t('individuals_start_label')}
                className="bg-background/50 border-foreground/10 focus:border-foreground/20"
              />
              <Input
                type="date"
                value={form.endDate}
                label={t('individuals_end_label')}
                onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                placeholder={t('individuals_end_label')}
                className="bg-background/50 border-foreground/10 focus:border-foreground/20"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative z-20">
                <SearchableSelect
                  options={organizationOptions}
                  value={form.organizationId}
                  label={t('individuals_org_label')}
                  onChange={value =>
                    setForm(prev => ({ ...prev, organizationId: value, roleId: '' }))
                  }
                  onSearch={fetchOrganizations}
                  loading={fetchingOrgs}
                  placeholder={t('individuals_org_label')}
                  className="w-full bg-background/50 border-foreground/10 focus:border-foreground/20"
                  emptyMessage={t('no_organizations_found')}
                />
              </div>
              <div className="relative z-10">
                <SearchableSelect
                  options={roleOptions}
                  value={form.roleId}
                  label={t('individuals_role_label')}
                  onChange={value => setForm(prev => ({ ...prev, roleId: value }))}
                  onSearch={q => fetchRoles(form.organizationId, q)}
                  loading={fetchingRoles}
                  placeholder={t('individuals_role_label')}
                  disabled={!form.organizationId}
                  className="w-full bg-background/50 border-foreground/10 focus:border-foreground/20"
                  emptyMessage={t('no_roles_helper')}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={isSubmitting}
              >
                {commonT('cancel')}
              </Button>
              <Button type="submit" variant="default" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {commonT('saving')}
                  </span>
                ) : editingId ? (
                  commonT('save')
                ) : (
                  t('individuals_submit')
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Table view below - mostly unchanged but make sure to close <div> properly */}
      {loading && !indsData ? (
        <div className="p-12 text-center text-foreground/40 italic">{commonT('loading')}</div>
      ) : (
        <div className="rounded-xl border border-foreground/[0.05] overflow-x-auto">
          <table className="w-full text-left rtl:text-right min-w-[800px]">
            <thead className="text-xs uppercase bg-foreground/[0.02] text-foreground/50 font-medium">
              <tr>
                <th className="px-6 py-3 tracking-wider">{t('individuals_table_name')}</th>
                <th className="px-6 py-3 tracking-wider">{t('individuals_table_org')}</th>
                <th className="px-6 py-3 tracking-wider">{t('individuals_table_created')}</th>
                <th className="px-6 py-3 text-right tracking-wider w-[100px]">
                  {t('col_actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/[0.05] text-sm">
              {individuals.map(person => (
                <tr key={person.id} className="hover:bg-foreground/[0.01] transition-colors group">
                  <td className="px-6 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground/90">{person.fullName}</span>
                      {person.biography && (
                        <span className="text-xs text-foreground/50 truncate max-w-[200px]">
                          {person.biography}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-foreground/70">
                    {person.currentOrganization ? (
                      <div className="flex flex-col">
                        <span>{person.currentOrganization}</span>
                        {person.currentRole && (
                          <span className="text-xs opacity-60">{person.currentRole}</span>
                        )}
                      </div>
                    ) : (
                      <span className="opacity-30 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-foreground/60 text-xs">
                    {format(new Date(person.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-foreground/50 hover:text-foreground hover:bg-foreground/5"
                        onClick={() => handleEdit(person)}
                        title={commonT('edit')}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-foreground/50 hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => handleDelete(person.id)}
                        disabled={deletingId === person.id}
                        title={commonT('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {individuals.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-foreground/40 italic">
                    {t('individuals_empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {indsData && indsData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <span className="text-foreground/40 mr-2">
            {t('pagination_page', { current: page, total: indsData.pagination.totalPages })}
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
            disabled={page === indsData.pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
