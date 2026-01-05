'use client';

import { VotingButtons } from '@/components/reports/voting-buttons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { getS3PublicUrl } from '@/lib/utils';
import type { ReportWithDetails } from '@/shared/types';
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
  const truncatedContent = content.length > 200 ? `${content.substring(0, 200)}...` : content;

  // Format date
  const date = report.incidentDate
    ? new Date(report.incidentDate).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : report.createdAt
      ? new Date(report.createdAt).toLocaleDateString(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';

  // Get preview image if exists
  const previewImage = report.media?.find(m => m.mediaType === 'image') as
    | (NonNullable<typeof report.media>[number] & { url?: string })
    | undefined;
  const imageUrl = previewImage
    ? previewImage.url || getS3PublicUrl(previewImage.s3Key, previewImage.s3Bucket)
    : null;

  return (
    <div className="bg-foreground/5 backdrop-blur-md border border-foreground/10 rounded-2xl overflow-hidden hover:border-accent-primary/50 transition-all duration-300 group flex flex-col h-full">
      {imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent-primary/20 text-accent-primary border border-accent-primary/30">
            {t('verification_score')}: {report.aiVerification?.confidenceScore ?? 0}%
          </span>
          <span className="text-xs text-foreground/40">{date}</span>
        </div>

        <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-accent-primary transition-colors line-clamp-2">
          {title}
        </h3>

        <p className="text-foreground/70 text-sm mb-6 line-clamp-3 overflow-hidden text-ellipsis">
          {truncatedContent}
        </p>

        <div className="mt-auto pt-4 space-y-4">
          {/* Voting Buttons */}
          <VotingButtons
            reportId={report.id}
            initialUpvoteCount={report.upvoteCount}
            initialDownvoteCount={report.downvoteCount}
            isAnonymous={isAnonymous}
            compact
          />

          {/* Footer */}
          <div className="pt-4 border-t border-foreground/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-accent-secondary/50 flex items-center justify-center text-[10px] text-white">
                {report.user?.displayName?.[0] || 'A'}
              </div>
              <span className="text-xs text-foreground/60">
                {report.user?.displayName || t('anonymous_reporter')}
              </span>
            </div>

            <Link href={`/${locale}/reports/${report.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="text-accent-primary hover:text-accent-primary hover:bg-accent-primary/10"
              >
                {t('report_details')} →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
