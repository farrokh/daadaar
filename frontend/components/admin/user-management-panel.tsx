'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { fetchApi } from '@/lib/api';
import type { User } from '@/shared/types';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

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

  const handleUpdateUser = async (
    userId: number,
    updates: Partial<Pick<User, 'role' | 'displayName'> & { isBanned: boolean }>
  ) => {
    setUpdatingId(userId);
    await fetchApi(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...updates,
        banReason: updates.isBanned ? t('users_ban_reason_default') : undefined,
      }),
    });
    setUpdatingId(null);
    fetchUsers();
  };

  if (loading && !users) {
    return <div className="p-6 text-center text-foreground/60">{commonT('loading')}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('users_search_placeholder')}
          />
        </div>
        <div className="w-full md:w-56">
          <Select
            options={roleOptions}
            value={roleFilter}
            onChange={value => {
              setRoleFilter(value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-full md:w-56">
          <Select
            options={bannedOptions}
            value={bannedFilter}
            onChange={value => {
              setBannedFilter(value);
              setPage(1);
            }}
          />
        </div>
        <Button onClick={() => fetchUsers()} variant="outline">
          {t('refresh')}
        </Button>
      </div>

      <div className="bg-background/40 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left rtl:text-right">
          <thead className="text-xs uppercase bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-4 py-3">{t('users_table_username')}</th>
              <th className="px-4 py-3">{t('users_table_email')}</th>
              <th className="px-4 py-3">{t('users_table_role')}</th>
              <th className="px-4 py-3">{t('users_table_status')}</th>
              <th className="px-4 py-3">{t('users_table_created')}</th>
              <th className="px-4 py-3 text-right">{t('users_table_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-sm">
            {users?.users.map(user => (
              <tr key={user.id} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{user.displayName || user.username}</span>
                    <span className="text-xs opacity-60">@{user.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <Select
                    value={user.role}
                    options={roleOptions.slice(1)}
                    onChange={value => handleUpdateUser(user.id, { role: value as User['role'] })}
                    disabled={updatingId === user.id}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${
                      user.isBanned
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-green-500/10 text-green-400 border border-green-500/20'
                    }`}>
                      {user.isBanned ? t('users_status_banned') : t('users_status_active')}
                    </span>
                    {user.banReason && (
                      <span className="text-xs opacity-60 truncate max-w-[200px]" title={user.banReason}>
                        {user.banReason}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 opacity-60">
                  {format(new Date(user.createdAt), 'PP')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className={
                        user.isBanned
                          ? 'text-green-400 border-green-500/30 hover:bg-green-500/10'
                          : 'text-red-400 border-red-500/30 hover:bg-red-500/10'
                      }
                      onClick={() =>
                        handleUpdateUser(user.id, {
                          isBanned: !user.isBanned,
                        })
                      }
                      disabled={updatingId === user.id}
                    >
                      {user.isBanned ? t('action_unban') : t('action_ban')}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {users?.users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center opacity-60 italic">
                  {t('users_empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {users && users.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            {commonT('previous')}
          </Button>
          <span className="text-sm opacity-60">
            {t('pagination_page', { current: page, total: users.pagination.totalPages })}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page === users.pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            {commonT('next')}
          </Button>
        </div>
      )}
    </div>
  );
}
