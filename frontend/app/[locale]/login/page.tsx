'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login, useAuth } from '@/lib/auth';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth(); // Get refreshUser from context
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verified = searchParams.get('verified') === 'true';
  const errorParam = searchParams.get('error');

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.identifier, formData.password);
      if (result.success) {
        await refreshUser(); // Refresh the auth context
        router.push('/');
        router.refresh();
      } else {
        setError(result.error || t('login_failed'));
      }
    } catch (_err) {
      setError(t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl liquid-glass border border-white/20 backdrop-blur-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2 tracking-tight">{t('login_title')}</h1>
          <p className="text-muted-foreground">{t('login_subtitle')}</p>
        </div>

        {verified && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-2 rounded-lg text-sm mb-6">
            {t('email_verified')}
          </div>
        )}

        {(error || errorParam) && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-lg text-sm mb-6">
            {error ||
              (errorParam === 'invalid_token' ? t('verification_failed') : t('login_failed'))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label={t('email_label')}
            type="text"
            placeholder={t('email_placeholder')}
            value={formData.identifier}
            onChange={e => setFormData({ ...formData, identifier: e.target.value })}
            required
            className="transition-colors"
          />

          <Input
            label={t('password_label')}
            type="password"
            placeholder={t('password_placeholder')}
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            required
            className="transition-colors"
          />

          <Button
            type="submit"
            className="w-full transaction-all duration-200"
            disabled={loading}
            size="lg"
          >
            {loading ? tCommon('loading') : t('login_button')}
          </Button>

          <div className="flex justify-center text-sm mt-4">
            <Link
              href="/signup"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {t('register_link')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
