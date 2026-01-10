'use client';

import { fetchApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { CreateContentReportRequest } from '@/shared/api-types';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './button';

interface ReportContentButtonProps {
  contentType: 'report' | 'organization' | 'individual' | 'user' | 'media';
  contentId: number;
  className?: string;
  children?: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>['variant'];
  size?: React.ComponentProps<typeof Button>['size'];
}

const REASON_OPTIONS = [
  'spam',
  'misinformation',
  'harassment',
  'inappropriate',
  'duplicate',
  'other',
] as const;

export function ReportContentButton({
  contentType,
  contentId,
  className = '',
  children,
  variant = 'ghost',
  size = 'sm',
}: ReportContentButtonProps) {
  const t = useTranslations('contentReport');
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASON_OPTIONS)[number]>('spam');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const request: CreateContentReportRequest = {
        contentType,
        contentId,
        reason,
        description: description.trim() || undefined,
      };

      await fetchApi('/content-reports', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setDescription('');
        setReason('spam');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    // Escape key is handled by document listener in useEffect
    // biome-ignore lint/a11y/useKeyWithClickEvents: Backdrop click is sufficient, keyboard handled globally
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: positioning control */}
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200 border-0 relative"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('title')}</h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label={t('close')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-green-600 dark:text-green-400 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-16 h-16 mx-auto"
                role="img"
                aria-label="Success"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">{t('success')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t('reasonLabel')}
              </label>
              <select
                id="reason"
                value={reason}
                onChange={e => setReason(e.target.value as (typeof REASON_OPTIONS)[number])}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {REASON_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {t(`reasons.${opt}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t('descriptionLabel')} {t('optional')}
              </label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder={t('descriptionPlaceholder')}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isSubmitting}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('submitting') : t('submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  // If children are provided, render a custom trigger (raw button) to allow full styling control (e.g. for MobileMenu grid)
  if (children) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn('transition-all duration-200', className)}
          title={t('reportButton')}
          aria-label={t('reportButton')}
        >
          {children}
        </button>
        {isOpen && typeof document !== 'undefined' && createPortal(modalContent, document.body)}
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={cn(
          'transition-all duration-200',
          'rounded-full hover:text-red-500 hover:bg-red-500/10',
          className
        )}
        title={t('reportButton')}
        aria-label={t('reportButton')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
          />
        </svg>
      </Button>

      {isOpen && typeof document !== 'undefined' && createPortal(modalContent, document.body)}
    </>
  );
}
