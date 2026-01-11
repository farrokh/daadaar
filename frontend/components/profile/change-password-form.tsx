'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchApi } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function ChangePasswordForm() {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: t('password_mismatch') });
      setLoading(false);
      return;
    }

    try {
      const response = await fetchApi('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (response.success) {
        setMessage({ type: 'success', text: t('password_updated') });
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        if (response.error?.code === 'INVALID_CREDENTIALS') {
          setMessage({ type: 'error', text: t('current_password_incorrect') });
        } else {
          setMessage({
            type: 'error',
            text: response.error?.message || t('password_update_failed'),
          });
        }
      }
    } catch (_err) {
      setMessage({ type: 'error', text: t('password_update_failed') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-foreground/[0.05] bg-foreground/[0.02]">
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">{t('change_password')}</h3>
        <p className="text-sm text-foreground/60">{t('change_password_desc')}</p>
      </div>

      {message && (
        <div
          className={`px-4 py-3 rounded-xl text-sm mb-6 ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-500 border border-green-500/20'
              : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        <Input
          label={t('current_password')}
          type="password"
          placeholder={t('current_password_placeholder')}
          value={formData.currentPassword}
          onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
          required
          className="bg-background/50"
        />
        <Input
          label={t('new_password')}
          type="password"
          placeholder={t('new_password_placeholder')}
          value={formData.newPassword}
          onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
          required
          minLength={8}
          className="bg-background/50"
        />
        <Input
          label={t('confirm_password')}
          type="password"
          placeholder={t('confirm_password_placeholder')}
          value={formData.confirmPassword}
          onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
          minLength={8}
          className="bg-background/50"
        />

        <Button type="submit" disabled={loading}>
          {loading ? tCommon('saving') : t('update_password')}
        </Button>
      </form>
    </div>
  );
}
