'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import posthog from 'posthog-js';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { fetchApi } from '../../lib/api';
import { type PowProgress, requestPowChallenge, solvePowChallenge } from '../../lib/pow-solver';
import { type ReportFormData, reportFormSchema } from '../../lib/validation/report-form-schema';
import { MediaUploader } from './media-uploader';

interface SubmitReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  individualId: number;
  individualName: string;
  roleId?: number;
  roleName?: string;
  organizationName?: string;
  apiUrl: string;
  onSuccess?: (reportId: number) => void;
}

export function SubmitReportModal({
  isOpen,
  onClose,
  individualId,
  individualName,
  roleId,
  roleName,
  organizationName,
  onSuccess,
}: SubmitReportModalProps) {
  const [mediaIds, setMediaIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [powProgress, setPowProgress] = useState<PowProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      individualId,
      roleId,
      mediaIds: [],
    },
  });

  const handleMediaUploaded = (mediaId: number) => {
    setMediaIds(prev => [...prev, mediaId]);
  };

  const handleMediaRemoved = (mediaId: number) => {
    setMediaIds(prev => prev.filter(id => id !== mediaId));
  };

  const onSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    setError(null);
    setPowProgress(null);

    try {
      // 1. Request PoW challenge
      const challenge = await requestPowChallenge('report-submission');

      // 2. Solve PoW challenge
      const { solution: powSolution, solutionNonce: powSolutionNonce } = await solvePowChallenge(
        challenge,
        progress => {
          setPowProgress(progress);
        }
      );

      // 3. Submit report
      const response = await fetchApi<{ id: number }>('/reports', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          individualId,
          roleId,
          mediaIds,
          powChallengeId: challenge.challengeId,
          powSolution,
          powSolutionNonce,
        }),
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to submit report');
      }

      const { data: responseData } = response;
      if (!responseData) throw new Error('No data received');

      // Track successful report submission
      posthog.capture('report_submitted', {
        reportId: responseData.id,
        individualId,
        individualName,
        roleId,
        roleName,
        organizationName,
        hasMedia: mediaIds.length > 0,
        mediaCount: mediaIds.length,
      });

      // Success!
      reset();
      setMediaIds([]);
      onSuccess?.(responseData.id);
      onClose();
    } catch (err) {
      console.error('Submit error:', err);
      posthog.captureException(err);
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
      setPowProgress(null);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setMediaIds([]);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border border-foreground/10 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-background border-b border-foreground/5 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Submit Report</h2>
            <p className="text-sm text-foreground/40 mt-1">
              About: <span className="font-medium text-foreground">{individualName}</span>
              {roleName && organizationName && (
                <span className="text-accent-primary">
                  {' '}
                  ({roleName} at {organizationName})
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-foreground/20 hover:text-foreground p-2 hover:bg-foreground/5 rounded-full transition-all disabled:opacity-50"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>Close</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto grow">
          <form id="report-form" onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
            {/* Title (Persian) */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-bold text-foreground/60 mb-2 uppercase tracking-wider"
              >
                {individualName} (Persian) <span className="text-red-500">*</span>
              </label>
              <input
                {...register('title')}
                id="title"
                type="text"
                className="w-full px-5 py-3 bg-foreground/5 border border-foreground/10 rounded-2xl focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all outline-none text-foreground placeholder:text-foreground/20"
                placeholder="عنوان گزارش"
                dir="rtl"
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-2 px-1">{errors.title.message}</p>
              )}
            </div>

            {/* Title (English) */}
            <div>
              <label
                htmlFor="titleEn"
                className="block text-sm font-bold text-foreground/60 mb-2 uppercase tracking-wider"
              >
                Title (English)
              </label>
              <input
                {...register('titleEn')}
                id="titleEn"
                type="text"
                className="w-full px-5 py-3 bg-foreground/5 border border-foreground/10 rounded-2xl focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all outline-none text-foreground placeholder:text-foreground/20"
                placeholder="Report title"
              />
              {errors.titleEn && (
                <p className="text-red-500 text-xs mt-2 px-1">{errors.titleEn.message}</p>
              )}
            </div>

            {/* Content (Persian) */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-bold text-foreground/60 mb-2 uppercase tracking-wider"
              >
                Content (Persian) <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('content')}
                id="content"
                rows={6}
                className="w-full px-5 py-3 bg-foreground/5 border border-foreground/10 rounded-2xl focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all outline-none text-foreground placeholder:text-foreground/20 resize-none"
                placeholder="محتوای گزارش..."
                dir="rtl"
              />
              {errors.content && (
                <p className="text-red-500 text-xs mt-2 px-1">{errors.content.message}</p>
              )}
            </div>

            {/* Content (English) */}
            <div>
              <label
                htmlFor="contentEn"
                className="block text-sm font-bold text-foreground/60 mb-2 uppercase tracking-wider"
              >
                Content (English)
              </label>
              <textarea
                {...register('contentEn')}
                id="contentEn"
                rows={6}
                className="w-full px-5 py-3 bg-foreground/5 border border-foreground/10 rounded-2xl focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all outline-none text-foreground placeholder:text-foreground/20 resize-none"
                placeholder="Report content..."
              />
              {errors.contentEn && (
                <p className="text-red-500 text-xs mt-2 px-1">{errors.contentEn.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Incident Date */}
              <div>
                <label
                  htmlFor="incidentDate"
                  className="block text-sm font-bold text-foreground/60 mb-2 uppercase tracking-wider"
                >
                  Incident Date
                </label>
                <input
                  {...register('incidentDate')}
                  id="incidentDate"
                  type="date"
                  className="w-full px-5 py-3 bg-foreground/5 border border-foreground/10 rounded-2xl focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all outline-none text-foreground scheme-dark dark:scheme-dark light:[color-scheme:light]"
                />
                {errors.incidentDate && (
                  <p className="text-red-500 text-xs mt-2 px-1">{errors.incidentDate.message}</p>
                )}
              </div>

              {/* Incident Location */}
              <div>
                <label
                  htmlFor="incidentLocation"
                  className="block text-sm font-bold text-foreground/60 mb-2 uppercase tracking-wider"
                >
                  Location (Persian)
                </label>
                <input
                  {...register('incidentLocation')}
                  id="incidentLocation"
                  type="text"
                  className="w-full px-5 py-3 bg-foreground/5 border border-foreground/10 rounded-2xl focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all outline-none text-foreground placeholder:text-foreground/20"
                  placeholder="مکان رویداد"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <label
                htmlFor="media-upload"
                className="block text-sm font-bold text-foreground/60 mb-4 uppercase tracking-wider"
              >
                Evidence & Media
              </label>
              <MediaUploader
                onMediaUploaded={handleMediaUploaded}
                onMediaRemoved={handleMediaRemoved}
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-foreground/5 bg-foreground/2">
          {/* PoW Progress */}
          {powProgress && (
            <div className="bg-accent-primary/10 border border-accent-primary/20 rounded-2xl p-5 mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-accent-primary">
                  Solving security challenge...
                </span>
                <span className="text-xs font-mono text-accent-primary/60">
                  {powProgress.progress.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-accent-primary/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-accent-primary h-full rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                  style={{ width: `${powProgress.progress}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-3 text-[10px] text-foreground/40 font-mono">
                <span>Attempts: {powProgress.attempts.toLocaleString()}</span>
                <span>Est. time: {(powProgress.estimatedTimeMs / 1000).toFixed(1)}s</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-6">
              <p className="text-sm text-red-500 font-medium">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-8 py-3 font-bold text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-2xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              form="report-form"
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-accent-primary text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-primary/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {powProgress ? 'Verifying...' : 'Submitting...'}
                </>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
