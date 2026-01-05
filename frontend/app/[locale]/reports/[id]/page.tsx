'use client';

import { VotingButtons } from '@/components/reports/voting-buttons';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, getS3PublicUrl } from '@/lib/utils';
import type { Media, ReportWithDetails } from '@/shared/types';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

export default function ReportDetailPage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('report');
  const commonT = useTranslations('common');
  const { isAnonymous } = useAuth();
  const [report, setReport] = useState<ReportWithDetails | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<(Media & { url?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const response = await fetchApi<ReportWithDetails>(`/reports/${params.id}`);
        if (response.success && response.data) {
          setReport(response.data);
        } else {
          setError(response.error?.message || t('error_not_found'));
        }
      } catch (_err) {
        setError(t('error_fetching'));
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchReport();
    }
  }, [params.id, t]);

  // Focus management and Escape key handling for lightbox
  useEffect(() => {
    if (!selectedMedia) {
      dialogRef.current?.close();
      return;
    }

    // Show the dialog
    dialogRef.current?.showModal();

    // Focus the close button when dialog opens
    closeButtonRef.current?.focus();

    // Handle Escape key at document level
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMedia(null);
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [selectedMedia]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">{error || t('error_not_found')}</h1>
        <Button
          onClick={() => window.history.back()}
          variant="outline"
          className="text-foreground border-foreground/10"
        >
          ← {commonT('cancel')}
        </Button>
      </div>
    );
  }

  const isRtl = locale === 'fa';
  const title = isRtl ? report.title : report.titleEn || report.title;
  const content = isRtl ? report.content : report.contentEn || report.content;
  const displayDate = report.incidentDate
    ? formatDate(report.incidentDate, locale)
    : formatDate(report.createdAt, locale);

  return (
    <div
      className={`min-h-screen bg-transparent pt-16 pb-20 px-4 sm:px-6 lg:px-8 ${isRtl ? 'rtl' : 'ltr'}`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <button
          type="button"
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-foreground/40 hover:text-foreground mb-8 transition-colors"
        >
          {isRtl ? '→' : '←'} {t('all_reports')}
        </button>

        {/* Hero Meta */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
              {t('verification_score')}: {report.aiVerification?.confidenceScore ?? 0}%
            </span>
            <span className="text-sm text-foreground/40">{displayDate}</span>
            {report.incidentLocation && (
              <span className="text-sm text-foreground/40 flex items-center gap-1">
                📍{' '}
                {isRtl
                  ? report.incidentLocation
                  : report.incidentLocationEn || report.incidentLocation}
              </span>
            )}
          </div>
          <VotingButtons
            reportId={report.id}
            initialUpvoteCount={report.upvoteCount}
            initialDownvoteCount={report.downvoteCount}
            isAnonymous={isAnonymous}
            compact
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-foreground mb-10 tracking-tight leading-tight">
          {title}
        </h1>

        {/* Content */}
        <div className="prose dark:prose-invert prose-lg max-w-none mb-12 whitespace-pre-wrap text-foreground/80 leading-relaxed">
          {content}
        </div>

        {/* Media Gallery (Thumbnails) */}
        {report.media && report.media.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-16">
            {report.media.map(item => {
              const mediaUrl = item.url || getS3PublicUrl(item.s3Key, item.s3Bucket);
              return (
                <button
                  type="button"
                  key={item.id}
                  className="aspect-square rounded-2xl overflow-hidden border border-foreground/10 bg-foreground/5 cursor-zoom-in group relative"
                  onClick={() => setSelectedMedia(item)}
                  onKeyDown={e => e.key === 'Enter' && setSelectedMedia(item)}
                >
                  {item.mediaType === 'image' && (
                    <img
                      src={mediaUrl}
                      alt={item.originalFilename || 'Media'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  )}
                  {item.mediaType === 'video' && (
                    <div className="w-full h-full flex items-center justify-center bg-black/40">
                      <svg
                        className="w-8 h-8 text-white/60"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <title>Video</title>
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </button>
              );
            })}
          </div>
        )}

        {/* Associations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-foreground/10 mt-12">
          {/* Reporter Info */}
          <div>
            <h3 className="text-sm font-bold text-foreground/40 uppercase tracking-widest mb-4">
              {t('reported_by')}
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center text-lg text-white font-bold">
                {report.user?.displayName?.[0] || 'A'}
              </div>
              <div>
                <div className="text-foreground font-bold">
                  {report.user?.displayName || t('anonymous_reporter')}
                </div>
                <div className="text-xs text-foreground/40">
                  {report.user ? `@${report.user.username}` : t('anonymous_reporter')}
                </div>
              </div>
            </div>
          </div>

          {/* Linked Individuals */}
          {report.reportLinks && report.reportLinks.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-foreground/40 uppercase tracking-widest mb-4">
                {t('linked_individuals')}
              </h3>
              <div className="space-y-4">
                {report.reportLinks.map(link => (
                  <div key={link.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/50 flex items-center justify-center text-xs text-white">
                      {link.individual?.fullName?.[0] || 'P'}
                    </div>
                    <div>
                      <div className="text-foreground font-medium text-sm">
                        {isRtl
                          ? link.individual?.fullName
                          : link.individual?.fullNameEn || link.individual?.fullName}
                      </div>
                      {link.role && (
                        <div className="text-xs text-primary">
                          {isRtl ? link.role.title : link.role.titleEn || link.role.title}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lightbox Modal */}
        {selectedMedia && (
          <dialog
            ref={dialogRef}
            aria-labelledby="lightbox-title"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-10 border-0"
            onClick={() => setSelectedMedia(null)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedMedia(null);
              }
            }}
          >
            <button
              ref={closeButtonRef}
              type="button"
              className="absolute top-6 right-6 text-white/60 hover:text-white z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              onClick={() => setSelectedMedia(null)}
              aria-label={commonT('close')}
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <title>{commonT('close')}</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div
              className="max-w-7xl w-full max-h-full flex flex-col items-center"
              onClick={e => e.stopPropagation()}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                }
              }}
            >
              <div className="w-full flex justify-center mb-6">
                {selectedMedia.mediaType === 'image' && (
                  <img
                    src={
                      selectedMedia.url ||
                      getS3PublicUrl(selectedMedia.s3Key, selectedMedia.s3Bucket)
                    }
                    alt={selectedMedia.originalFilename || 'Media'}
                    className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-foreground/10"
                  />
                )}
                {selectedMedia.mediaType === 'video' && (
                  <video
                    src={
                      selectedMedia.url ||
                      getS3PublicUrl(selectedMedia.s3Key, selectedMedia.s3Bucket)
                    }
                    controls
                    className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl border border-foreground/10"
                  >
                    <track kind="captions" />
                  </video>
                )}
              </div>
              <div className="text-center">
                <h4 id="lightbox-title" className="text-white font-bold text-xl mb-2">
                  {selectedMedia.originalFilename}
                </h4>
                <p className="text-white/40 text-sm">
                  {selectedMedia.fileSizeBytes
                    ? (selectedMedia.fileSizeBytes / 1024 / 1024).toFixed(2)
                    : '0'}
                  MB
                </p>
              </div>
            </div>
          </dialog>
        )}
      </div>
    </div>
  );
}
