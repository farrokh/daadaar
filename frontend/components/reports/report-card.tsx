'use client';

import { VotingButtons } from '@/components/reports/voting-buttons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
// getS3PublicUrl removed as unused
import type { ReportWithDetails } from '@/shared/types';
import { BadgeCheck, Calendar, FileText, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import type React from 'react';

interface ReportCardProps {
  report: ReportWithDetails;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const locale = useLocale();
  const t = useTranslations('report');
  const isRtl = locale === 'fa';
  const { isAnonymous } = useAuth();

  const title = isRtl ? report.title : report.titleEn || report.title;
  const content = isRtl ? report.content : report.contentEn || report.content;

  // Truncate content for card view
  const truncatedContent = content.length > 150 ? `${content.substring(0, 150)}...` : content;

  // Format date
  const date = report.incidentDate
    ? new Date(report.incidentDate).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : report.createdAt
      ? new Date(report.createdAt).toLocaleDateString(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '';

  // Get preview image if exists
  const previewImage = report.media?.find(m => m.mediaType === 'image') as
    | (NonNullable<typeof report.media>[number] & { url?: string })
    | undefined;
  const imageUrl = previewImage
    ? previewImage.url || ''
    : null;

  const hasMedia = report.media && report.media.length > 0;
  const mediaCount = report.media?.length || 0;

  return (
    <div className="group relative h-full flex flex-col bg-card-bg backdrop-blur-xl border border-card-border rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-accent-primary/5 hover:-translate-y-2">
      {/* Image Section */}
      <div className="relative h-56 overflow-hidden bg-foreground/5">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-foreground/5 to-foreground/10">
            <FileText className="w-12 h-12 text-foreground/10" />
          </div>
        )}

        {/* Floating Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="flex gap-2">
            {report.aiVerification && (
              <div
                className={`backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                  report.aiVerification.confidenceScore > 70
                    ? 'bg-green-500/20 text-green-600 border-green-500/30'
                    : 'bg-amber-500/20 text-amber-600 border-amber-500/30'
                }`}
              >
                <BadgeCheck className="w-3.5 h-3.5" />
                {report.aiVerification.confidenceScore}%
              </div>
            )}
          </div>

          {hasMedia && (
            <div className="bg-black/40 backdrop-blur-md text-white/90 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5">
              <ImageIcon className="w-3 h-3" />
              {mediaCount}
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 pt-4 flex-grow flex flex-col relative">
        {/* Date Row */}
        <div className="flex items-center text-xs font-medium text-foreground/40 mb-3 gap-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>{date}</span>
        </div>

        {/* Title */}
        <h3
          className={`text-xl font-bold text-foreground mb-3 leading-tight group-hover:text-accent-primary transition-colors line-clamp-2 ${isRtl ? 'font-sans' : ''}`}
        >
          {title}
        </h3>

        {/* Content Preview */}
        <p className="text-foreground/60 text-sm leading-relaxed mb-6 line-clamp-3">
          {truncatedContent}
        </p>

        {/* Footer Area */}
        <div className="mt-auto pt-5 border-t border-foreground/5 flex items-center justify-between gap-4">
          {/* Reporter Info */}
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 flex items-center justify-center text-xs font-bold text-accent-primary shrink-0">
              {report.user?.displayName?.[0]?.toUpperCase() || 'A'}
            </div>
            <span className="text-xs text-foreground/70 font-medium truncate">
              {report.user?.displayName || t('anonymous_reporter')}
            </span>
          </div>

          {/* Voting Buttons (Just the display for now or interactive) */}
          <div className="shrink-0 relative z-20">
            <VotingButtons
              reportId={report.id}
              initialUpvoteCount={report.upvoteCount}
              initialDownvoteCount={report.downvoteCount}
              isAnonymous={isAnonymous}
              compact
            />
          </div>
        </div>

        {/* View Details Click Overlay */}
        <Link
          href={`/${locale}/reports/${report.shareableUuid}`}
          className="absolute inset-0 z-10 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 rounded-3xl"
        >
          <span className="sr-only">{t('report_details')}</span>
        </Link>
      </div>
    </div>
  );
};
