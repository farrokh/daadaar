'use client';

import { VotingButtons } from '@/components/reports/voting-buttons';
import { Button } from '@/components/ui/button';
import { ReportContentButton } from '@/components/ui/report-content-button';
import { ShareLinkButton } from '@/components/ui/share-link-button';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, getS3PublicUrl } from '@/lib/utils';
import type { Media, ReportWithDetails } from '@/shared/types';
import {
  Calendar,
  Download,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  MapPin,
  Music,
  Play,
  Shield,
  User,
} from 'lucide-react';
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

  // Fetch Logic
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const response = await fetchApi<ReportWithDetails>(`/reports/${params.id}`);
        if (response.success && response.data) setReport(response.data);
        else setError(response.error?.message || t('error_not_found'));
      } catch (_err) {
        setError(t('error_fetching'));
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchReport();
  }, [params.id, t]);

  // Lightbox Logic
  useEffect(() => {
    if (!selectedMedia) {
      dialogRef.current?.close();
      document.body.style.overflow = '';
      return;
    }
    dialogRef.current?.showModal();
    document.body.style.overflow = 'hidden';
    const handleEscape = (e: KeyboardEvent) => e.key === 'Escape' && setSelectedMedia(null);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [selectedMedia]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-32 px-6 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen pt-32 pb-32 px-6 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <h1 className="text-xl font-medium text-foreground mb-6">
          {error || t('error_not_found')}
        </h1>
        <Button
          onClick={() => window.history.back()}
          variant="outline"
          className="text-xs font-medium uppercase tracking-wider"
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
    <div className="min-h-screen pt-32 pb-32 px-6 md:px-12 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <header className="mb-24 space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-foreground/10 pb-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="text-sm font-medium uppercase text-foreground/50 hover:text-foreground transition-colors tracking-[0.2em]"
            >
              {t('reports')}
            </button>
            <span className="text-foreground/20">/</span>
            <span className="text-sm font-medium uppercase text-foreground/50 tracking-[0.2em]">
              ID: {String(report.id).slice(0, 8)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/5 border border-foreground/10">
              <Shield className="w-3 h-3 text-foreground/70" />
              <span className="text-xs font-medium text-foreground/70 uppercase tracking-wider">
                {t('verification_score')}: {report.aiVerification?.confidenceScore ?? 0}%
              </span>
            </div>
            <ShareLinkButton
              label={commonT('share')}
              copiedLabel={commonT('copied')}
              className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/70 transition-colors bg-transparent border-none"
            />
            <ReportContentButton contentType="report" contentId={report.id} />
          </div>
        </div>

        <h1
          className={`text-3xl md:text-5xl lg:text-6xl font-bold text-foreground max-w-4xl ${isRtl ? 'leading-normal' : 'tracking-tight leading-[1.1]'}`}
        >
          {title}
        </h1>
      </header>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Sidebar (Meta) */}
        <div className="md:col-span-4 space-y-10">
          {/* Actions */}
          <div>
            <VotingButtons
              reportId={report.id}
              initialUpvoteCount={report.upvoteCount}
              initialDownvoteCount={report.downvoteCount}
              isAnonymous={isAnonymous}
            />
          </div>
          {/* Details List */}
          <div className="space-y-6">
            {/* Author */}
            <div className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-foreground/10 text-foreground/70 group-hover:ring-foreground/20 transition-all">
                {report.user?.displayName?.[0] || 'A'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none text-foreground/90">
                  {report.user?.displayName || t('anonymous_reporter')}
                </span>
                {report.user && (
                  <span className="text-xs text-foreground/40 mt-1">@{report.user.username}</span>
                )}
              </div>
            </div>

            <div className="h-px bg-foreground/5 w-full" />

            {/* Date */}
            <div className="flex items-center gap-3 text-foreground/60">
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="text-sm">{displayDate}</span>
            </div>

            {/* Location */}
            {report.incidentLocation && (
              <div className="flex items-center gap-3 text-foreground/60">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="text-sm">
                  {isRtl
                    ? report.incidentLocation
                    : report.incidentLocationEn || report.incidentLocation}
                </span>
              </div>
            )}
          </div>

          {/* Linked entities */}
          {report.reportLinks && report.reportLinks.length > 0 && (
            <div className="space-y-6 pt-8 border-t border-foreground/10">
              <div className="flex items-center gap-2 text-foreground/40 text-sm font-medium uppercase tracking-wider">
                <LinkIcon className="w-4 h-4" />
                {t('linked_individuals')}
              </div>
              <div className="space-y-4">
                {report.reportLinks.map(link => (
                  <div key={link.id} className="flex items-center gap-3 py-1 group">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-foreground/10 text-foreground/60 transition-all group-hover:ring-foreground/20 shrink-0">
                      {link.individual?.fullName?.[0] || 'P'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground/90 leading-none">
                        {isRtl
                          ? link.individual?.fullName
                          : link.individual?.fullNameEn || link.individual?.fullName}
                      </p>
                      {link.role && (
                        <p className="text-xs text-foreground/40 mt-1">
                          {isRtl ? link.role.title : link.role.titleEn || link.role.title}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content (Body) */}
        <div className="md:col-span-8 space-y-12">
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg md:text-xl leading-relaxed font-light text-foreground/90 whitespace-pre-wrap">
              {content}
            </p>
          </div>

          {/* Media Grid */}
          {report.media && report.media.length > 0 && (
            <div className="space-y-6 pt-12 border-t border-foreground/10">
              <h3 className="text-sm font-medium uppercase text-foreground/50 tracking-[0.2em]">
                {t('media_attachments')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {report.media.map(item => {
                  const mediaUrl = item.url || getS3PublicUrl(item.s3Key, item.s3Bucket);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedMedia(item)}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-foreground/5 border border-foreground/10 transition-all hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    >
                      {item.mediaType === 'image' && (
                        <img
                          src={mediaUrl}
                          alt="Evidence"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      {item.mediaType === 'video' && (
                        <div className="w-full h-full flex items-center justify-center bg-black/10">
                          <Play className="w-8 h-8 text-foreground/70" fill="currentColor" />
                        </div>
                      )}
                      {item.mediaType === 'document' && (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                          <FileText className="w-8 h-8 text-foreground/40 mb-2" />
                          <span className="text-[10px] text-foreground/40 truncate w-full text-center">
                            {item.originalFilename}
                          </span>
                        </div>
                      )}
                      {item.mediaType === 'audio' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-8 h-8 text-foreground/40" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-[100] w-full h-full bg-background/95 backdrop-blur-xl p-0 m-0 border-0"
        onClick={() => setSelectedMedia(null)}
        onKeyDown={e => e.key === 'Escape' && setSelectedMedia(null)}
      >
        {selectedMedia && (
          <div
            className="relative w-full h-full flex flex-col items-center justify-center p-6 md:p-12"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedMedia(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                role="img"
                aria-label="Close"
              >
                <title>Close</title>
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="w-full max-w-5xl max-h-[80vh] flex items-center justify-center">
              {selectedMedia.mediaType === 'image' && (
                <img
                  src={
                    selectedMedia.url || getS3PublicUrl(selectedMedia.s3Key, selectedMedia.s3Bucket)
                  }
                  alt="Evidence"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
              )}
              {selectedMedia.mediaType === 'video' && (
                <video
                  src={
                    selectedMedia.url || getS3PublicUrl(selectedMedia.s3Key, selectedMedia.s3Bucket)
                  }
                  controls
                  className="max-w-full max-h-full rounded-lg shadow-2xl"
                >
                  <track kind="captions" />
                </video>
              )}
              {/* Add other types as needed */}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <a
                href={
                  selectedMedia.url || getS3PublicUrl(selectedMedia.s3Key, selectedMedia.s3Bucket)
                }
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                {commonT('open')}
              </a>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
