'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { register } from '@/lib/auth';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import posthog from 'posthog-js';

import { useState } from 'react';

export default function SignupPage() {
  const t = useTranslations('auth');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });

  // Client-side validation
  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};

    // Email validation
    if (!formData.email) {
      errors.email = t('email_required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = t('email_invalid');
      }
    }

    // Username validation
    if (!formData.username) {
      errors.username = t('username_required');
    } else {
      const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
      if (!usernameRegex.test(formData.username)) {
        errors.username = t('username_invalid');
      }
    }

    // Password validation
    if (!formData.password) {
      errors.password = t('password_required');
    } else if (formData.password.length < 8) {
      errors.password = t('password_min_length');
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t('password_mismatch');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    // Validate form
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const result = await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        displayName: formData.displayName || undefined,
      });

      if (result.success) {
        // Import hashing utility dynamically to avoid SSR issues
        const { hashIdentifier } = await import('@/lib/analytics-utils');
        const hashedEmail = await hashIdentifier(formData.email);

        // Only call PostHog if it's initialized
        if (posthog && typeof posthog.identify === 'function') {
          // Identify user in PostHog with hashed email
          posthog.identify(hashedEmail);

          // Track successful signup with hashed identifier only
          posthog.capture('user_signed_up', {
            // No raw PII - only hashed identifier and flags
            hashedIdentifier: hashedEmail,
            requiresEmailVerification: result.requiresEmailVerification ?? true,
          });
        }

        setRequiresEmailVerification(result.requiresEmailVerification ?? true);
        setSuccess(true);
      } else {
        // Handle specific error messages
        if (result.error?.includes('already exists')) {
          setError(t('user_already_exists'));
        } else {
          setError(result.error || t('signup_failed'));
        }
      }
    } catch (err) {
      // Guard PostHog call to prevent errors when not initialized
      if (posthog && typeof posthog.captureException === 'function') {
        posthog.captureException(err);
      }
      setError(t('signup_failed'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-2xl liquid-glass border border-white/[0.05] backdrop-blur-xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-primary"
              >
                <title>Email Icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">{t('signup_success')}</h2>
          <p className="text-muted-foreground mb-8">
            {requiresEmailVerification
              ? t('verification_email_sent')
              : t('verification_not_required')}
          </p>
          <Link href="/login">
            <Button className="w-full">{t('login_button')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl liquid-glass border border-white/[0.05] backdrop-blur-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2 tracking-tight">{t('signup_title')}</h1>
          <p className="text-muted-foreground">{t('signup_subtitle')}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={t('email_only_label')}
            type="email"
            placeholder={t('email_placeholder')}
            value={formData.email}
            onChange={e => {
              setFormData({ ...formData, email: e.target.value });
              if (fieldErrors.email) {
                setFieldErrors({ ...fieldErrors, email: undefined });
              }
            }}
            error={fieldErrors.email}
            required
            className="transition-colors"
          />

          <Input
            label={t('username_label')}
            type="text"
            placeholder={t('username_placeholder')}
            value={formData.username}
            onChange={e => {
              setFormData({ ...formData, username: e.target.value });
              if (fieldErrors.username) {
                setFieldErrors({ ...fieldErrors, username: undefined });
              }
            }}
            error={fieldErrors.username}
            required
            className="transition-colors"
          />

          <Input
            label={t('display_name_label')}
            type="text"
            placeholder={t('display_name_placeholder')}
            value={formData.displayName}
            onChange={e => setFormData({ ...formData, displayName: e.target.value })}
            helperText={t('display_name_helper')}
            className="transition-colors"
          />

          <Input
            label={t('password_label')}
            type="password"
            placeholder={t('password_placeholder')}
            value={formData.password}
            onChange={e => {
              setFormData({ ...formData, password: e.target.value });
              if (fieldErrors.password) {
                setFieldErrors({ ...fieldErrors, password: undefined });
              }
            }}
            error={fieldErrors.password}
            required
            className="transition-colors"
          />

          <Input
            label={t('confirm_password_label')}
            type="password"
            placeholder={t('confirm_password_placeholder')}
            value={formData.confirmPassword}
            onChange={e => {
              setFormData({ ...formData, confirmPassword: e.target.value });
              if (fieldErrors.confirmPassword) {
                setFieldErrors({ ...fieldErrors, confirmPassword: undefined });
              }
            }}
            error={fieldErrors.confirmPassword}
            required
            className="transition-colors"
          />

          <Button
            type="submit"
            className="w-full transaction-all duration-200"
            disabled={loading}
            size="lg"
          >
            {loading ? t('creating_account') : t('signup_button')}
          </Button>

          <div className="flex justify-center text-sm mt-4">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {t('login_link')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
