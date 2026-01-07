'use client';

import { format } from 'date-fns';
import {
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { fetchApi } from '@/lib/api';
import type { User } from '@/shared/types';

interface UsersResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function UserManagementPanel() {
  const t = useTranslations('admin');
  const commonT = useTranslations('common');

  const [users, setUsers] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [bannedFilter, setBannedFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roleOptions = useMemo(
    () => [
      { value: '', label: t('all') },
      { value: 'user', label: t('role_user') },
      { value: 'moderator', label: t('role_moderator') },
      { value: 'admin', label: t('role_admin') },
    ],
    [t]
  );

  const bannedOptions = useMemo(
    () => [
      { value: '', label: t('all') },
      { value: 'false', label: t('users_status_active') },
      { value: 'true', label: t('users_status_banned') },
    ],
    [t]
  );

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({ page: page.toString(), limit: '20' });
    if (search) query.set('q', search);
    if (roleFilter) query.set('role', roleFilter);
    if (bannedFilter) query.set('isBanned', bannedFilter);

    const response = await fetchApi<UsersResponse>(`/admin/users?${query.toString()}`);
    if (response.success && response.data) {
      setUsers(response.data);
    }
    setLoading(false);
  }, [bannedFilter, page, roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateUser = useCallback(
    async (
      userId: number,
      updates: Partial<
        Pick<User, 'role' | 'displayName'> & { isBanned: boolean; isVerified: boolean }
      >,
      banReason?: string
    ) => {
      try {
        setUpdatingId(userId);
        setError(null);
        const response = await fetchApi(`/admin/users/${userId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...updates,
            banReason: updates.isBanned ? banReason || t('users_ban_reason_default') : undefined,
          }),
        });

        if (!response.success) {
          setError(response.error?.message || 'Failed to update user');
        } else {
          fetchUsers();
        }
      } catch (err) {
        console.error('Failed to update user:', err);
        setError('An unexpected error occurred while updating the user');
      } finally {
        setUpdatingId(null);
      }
    },
    [fetchUsers, t]
  );

  const handleDeleteUser = async (userId: number) => {
    if (!confirm(t('delete_confirm'))) return;
    setUpdatingId(userId);
    await fetchApi(`/admin/users/${userId}`, { method: 'DELETE' });
    setUpdatingId(null);
    fetchUsers();
  };

  if (loading && !users) {
    return <div className="p-12 text-center text-foreground/40 italic">{commonT('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm animate-in fade-in duration-300">
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-end gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('users_search_placeholder')}
            className="h-10 pl-9 bg-background/50 border-foreground/10"
          />
        </div>
        <div className="w-full sm:w-40">
          <Select
            options={roleOptions}
            value={roleFilter}
            onChange={value => {
              setRoleFilter(value);
              setPage(1);
            }}
            placeholder={t('role')}
            className="h-10 bg-background/50 border-foreground/10"
          />
        </div>
        <div className="w-full sm:w-40">
          <Select
            options={bannedOptions}
            value={bannedFilter}
            onChange={value => {
              setBannedFilter(value);
              setPage(1);
            }}
            placeholder={t('status')}
            className="h-10 bg-background/50 border-foreground/10"
          />
        </div>
        <Button onClick={() => fetchUsers()} variant="outline" size="icon" className="h-10 w-10">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="rounded-xl border border-foreground/[0.05] overflow-x-auto">
        <table className="w-full text-left rtl:text-right min-w-[800px]">
          <thead className="text-xs uppercase bg-foreground/[0.02] text-foreground/50 font-medium">
            <tr>
              <th className="px-6 py-3 tracking-wider">{t('users_table_username')}</th>
              <th className="px-6 py-3 tracking-wider">{t('users_table_email')}</th>
              <th className="px-6 py-3 tracking-wider">{t('users_table_role')}</th>
              <th className="px-6 py-3 tracking-wider">{t('users_table_status')}</th>
              <th className="px-6 py-3 tracking-wider">{t('users_table_created')}</th>
              <th className="px-6 py-3 text-right tracking-wider w-[140px]">
                {t('users_table_actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/[0.05] text-sm">
            {users?.users.map(user => (
              <tr key={user.id} className="hover:bg-foreground/[0.01] transition-colors group">
                <td className="px-6 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground/90">
                      {user.displayName || user.username}
                    </span>
                    <span className="text-xs text-foreground/50">@{user.username}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-foreground/70">{user.email}</td>
                <td className="px-6 py-3">
                  <Select
                    value={user.role}
                    options={roleOptions.slice(1)}
                    onChange={value => handleUpdateUser(user.id, { role: value as User['role'] })}
                    disabled={updatingId === user.id}
                    className="h-8 text-xs w-[130px] bg-transparent border-foreground/10"
                  />
                </td>
                <td className="px-6 py-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-2 items-center">
                      {user.isBanned ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                          <Ban className="w-3 h-3" />
                          {t('users_status_banned')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                          <CheckCircle className="w-3 h-3" />
                          {t('users_status_active')}
                        </span>
                      )}

                      {user.isVerified && (
                        <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    {user.banReason && (
                      <span
                        className="text-xs text-foreground/50 truncate max-w-[200px]"
                        title={user.banReason}
                      >
                        {user.banReason}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3 text-foreground/60 text-xs text-nowrap">
                  {format(new Date(user.createdAt), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-3">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      title={user.isVerified ? 'Unverify' : 'Verify'}
                      className={
                        user.isVerified
                          ? 'h-8 w-8 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10'
                          : 'h-8 w-8 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10'
                      }
                      onClick={() =>
                        handleUpdateUser(user.id, {
                          isVerified: !user.isVerified,
                        })
                      }
                      disabled={updatingId === user.id}
                    >
                      {user.isVerified ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title={user.isBanned ? t('action_unban') : t('action_ban')}
                      className={
                        user.isBanned
                          ? 'h-8 w-8 text-green-600 dark:text-green-400 hover:bg-green-500/10'
                          : 'h-8 w-8 text-red-600 dark:text-red-400 hover:bg-red-500/10'
                      }
                      onClick={() => {
                        if (!user.isBanned) {
                          const reason = prompt(
                            `${t('action_ban')} - ${t('users_ban_reason_label')} (${commonT('optional')}):`
                          );
                          if (reason === null) return; // Cancelled
                          handleUpdateUser(user.id, { isBanned: true }, reason);
                        } else {
                          handleUpdateUser(user.id, { isBanned: false });
                        }
                      }}
                      disabled={updatingId === user.id}
                    >
                      {user.isBanned ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Ban className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title={commonT('delete')}
                      className="h-8 w-8 text-foreground/40 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={updatingId === user.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {users?.users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-foreground/40 italic">
                  {t('users_empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {users && users.pagination.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <span className="text-foreground/40 mr-2">
            {t('pagination_page', { current: page, total: users.pagination.totalPages })}
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
            disabled={page === users.pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
