'use client';

import { MobileMenu } from '@/components/layout/mobile-menu';
import { VotingButtons } from '@/components/reports/voting-buttons';
import { ReportContentButton } from '@/components/ui/report-content-button';
import { ShareLinkButton } from '@/components/ui/share-link-button';
import { Link, usePathname } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import { formatDate, getS3PublicUrl } from '@/lib/utils';
import type { Media, ReportWithDetails } from '@/shared/types';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  X as CloseIcon,
  FileText,
  Flag,
  Info,
  MapPin,
  Menu,
  Music,
  Play,
  Share2,
  ShieldQuestion,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import posthog from 'posthog-js';
import React, { useRef, useState } from 'react';

interface ReportDetailProps {
  report: ReportWithDetails;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function ReportDetail({ report }: ReportDetailProps) {
  const locale = useLocale();
  const t = useTranslations('report');
  const commonT = useTranslations('common');
  const { isAnonymous } = useAuth();
  const [selectedMedia, setSelectedMedia] = useState<(Media & { url?: string }) | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleSelectMedia = (media: Media & { url?: string }) => {
    setSelectedMedia(media);
    posthog.capture('media_viewed', {
      reportId: report.id,
      reportUuid: report.shareableUuid,
      mediaId: media.id,
      mediaType: media.mediaType,
      originalFilename: media.originalFilename,
    });
    dialogRef.current?.showModal();
    document.body.style.overflow = 'hidden';
  };

  const handleCloseMedia = () => {
    setSelectedMedia(null);
    dialogRef.current?.close();
    document.body.style.overflow = '';
  };

  const isRtl = locale === 'fa';
  const title = isRtl ? report.title : report.titleEn || report.title;
  const content = isRtl ? report.content : report.contentEn || report.content;
  const displayDate = report.incidentDate
    ? formatDate(report.incidentDate, locale)
    : formatDate(report.createdAt, locale);

  const confidenceScore = report.aiVerification?.confidenceScore ?? 0;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className={`min-h-screen pt-12 pb-40 md:pt-32 md:pb-32 px-5 md:px-12 max-w-6xl mx-auto font-sans relative ${isRtl ? 'rtl' : 'ltr'}`}
    >
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-primary/3 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Modern Compact Header */}
      <motion.header variants={fadeInUp} className="mb-12 md:mb-20 space-y-8">
        <div className="flex items-center justify-between pb-6 border-b border-foreground/5">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-all group"
          >
            <ArrowLeft
              className={`w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 ${isRtl ? 'rotate-180 group-hover:translate-x-1' : ''}`}
            />
            <span>{t('reports')}</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-primary/5 border border-accent-primary/10 shadow-sm transition-transform hover:scale-105">
              <ShieldQuestion className="w-3.5 h-3.5 text-accent-primary" />
              <span className="text-[10px] font-black text-accent-primary uppercase tracking-wider">
                {confidenceScore}%
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <ShareLinkButton
                label={commonT('share')}
                copiedLabel={commonT('copied')}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground/60 hover:text-foreground transition-all bg-foreground/5 hover:bg-foreground/10 px-4 h-8 rounded-full border-none shadow-sm"
              />
              <ReportContentButton
                contentType="report"
                contentId={report.id}
                className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground/60 hover:text-foreground transition-all bg-foreground/5 hover:bg-foreground/10 px-4 h-8 rounded-full border-none shadow-sm group"
              >
                <Flag size={16} className="group-hover:text-red-500 transition-colors" />
                <span>{commonT('report')}</span>
              </ReportContentButton>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <motion.h1
            className={`text-3xl md:text-6xl lg:text-7xl font-black text-foreground max-w-5xl leading-[1.15] md:leading-tight ${isRtl ? 'leading-normal' : 'tracking-tight'}`}
          >
            {title}
          </motion.h1>

          {/* Quick Meta Info Mobiles Only */}
          <div className="flex flex-wrap gap-4 md:hidden">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground/40 bg-foreground/5 px-3 py-1.5 rounded-full border border-foreground/5">
              <Calendar className="w-3 h-3 text-accent-primary/60" />
              <span>{displayDate}</span>
            </div>
            {report.incidentLocation && (
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground/40 bg-foreground/5 px-3 py-1.5 rounded-full border border-foreground/5">
                <MapPin className="w-3 h-3 text-accent-primary/60" />
                <span className="truncate max-w-[150px]">
                  {isRtl
                    ? report.incidentLocation
                    : report.incidentLocationEn || report.incidentLocation}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20 items-start">
        {/* Sidebar - Now first on mobile */}
        <motion.aside
          variants={fadeInUp}
          className="lg:col-span-4 space-y-10 lg:sticky lg:top-32 order-1"
        >
          {/* Voting section - Minimalist (Hidden on mobile as it's in the FAB) */}
          <div className="hidden md:block pt-4">
            <VotingButtons
              reportId={report.id}
              initialUpvoteCount={report.upvoteCount}
              initialDownvoteCount={report.downvoteCount}
              isAnonymous={isAnonymous}
            />
          </div>

          {/* Author info & Metadata Desktop */}
          <section className="space-y-10 px-2 lg:px-4">
            {/* Subject and Reporter Metadata */}
            <div className="flex flex-col gap-6 pt-4">
              {/* Subjects */}
              {report.reportLinks && report.reportLinks.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/20">
                    {t('report_subject')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {report.reportLinks.map(link => {
                      const shareableUuid = link.individual?.shareableUuid;
                      const hasIndividual = !!shareableUuid;
                      const Wrapper = hasIndividual ? Link : 'div';
                      const wrapperProps = hasIndividual
                        ? {
                            href: `/person/${shareableUuid}`,
                            className: 'flex items-center gap-2 group',
                          }
                        : { className: 'flex items-center gap-2' };

                      return (
                        // @ts-ignore
                        <Wrapper key={link.id} {...wrapperProps}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border border-foreground/5 bg-foreground/[0.03] text-foreground/40 transition-all group-hover:border-accent-primary/20 group-hover:text-accent-primary shrink-0 overflow-hidden">
                            {link.individual?.profileImageUrl ? (
                              <img
                                src={link.individual.profileImageUrl}
                                alt={link.individual.fullName || 'Person'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              link.individual?.fullName?.[0] || 'P'
                            )}
                          </div>
                          <span className="text-sm font-bold text-foreground/70 group-hover:text-accent-primary transition-colors">
                            {isRtl
                              ? link.individual?.fullName
                              : link.individual?.fullNameEn || link.individual?.fullName}
                          </span>
                        </Wrapper>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reporter */}
              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/20">
                  {t('reporter')}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-foreground/[0.02] flex items-center justify-center text-[8px] font-black text-foreground/30 border border-foreground/5">
                    {report.user?.displayName?.[0] || 'A'}
                  </div>
                  <span className="text-xs font-medium text-foreground/40">
                    {report.user?.displayName || t('anonymous_reporter')}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </motion.aside>

        {/* Dynamic Content Body */}
        <div className="lg:col-span-8 space-y-16 order-2">
          <motion.div variants={fadeInUp} className="group relative">
            <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:text-lg prose-p:md:text-2xl prose-p:leading-[1.6] prose-p:md:leading-relaxed prose-p:text-foreground/80 prose-p:font-medium transition-colors group-hover:prose-p:text-foreground">
              <p className="whitespace-pre-wrap">{content}</p>
            </div>
          </motion.div>

          {/* Media Attachments Section - Tightened */}
          {report.media && report.media.length > 0 && (
            <motion.section
              variants={fadeInUp}
              className="space-y-4 pt-10 border-t border-foreground/5"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/20">
                {t('media_attachments')}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {report.media.map(item => {
                  const mediaUrl = item.url || getS3PublicUrl(item.s3Key, item.s3Bucket);
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelectMedia(item)}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-foreground/[0.03] border border-foreground/5 transition-all focus:outline-none hover:border-foreground/20"
                    >
                      {item.mediaType === 'image' && (
                        <img
                          src={mediaUrl}
                          alt="Evidence"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      )}
                      {item.mediaType === 'video' && (
                        <div className="w-full h-full flex items-center justify-center bg-black/5">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transition-transform group-hover:scale-110">
                            <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                      )}
                      {item.mediaType === 'audio' && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-5 h-5 text-foreground/20" />
                        </div>
                      )}
                      {item.mediaType === 'document' && (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                          <FileText className="w-5 h-5 text-foreground/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </motion.button>
                  );
                })}
              </div>
            </motion.section>
          )}
        </div>
      </div>

      {/* Mobile Floating Action Bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden w-[90%] max-w-sm pointer-events-none"
      >
        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-lg border border-white/10 p-2 px-4 rounded-full pointer-events-auto liquid-glass">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-transparent hover:bg-foreground/5 transition-colors border-none shadow-none text-foreground/40 hover:text-foreground"
            >
              <Menu size={20} />
            </button>
            <ShareLinkButton
              label=""
              copiedLabel=""
              hideLabelOnMobile
              className="w-10 h-10 flex items-center justify-center rounded-full bg-transparent hover:bg-foreground/5 transition-colors border-none shadow-none"
            />
          </div>

          <div className="w-px h-6 bg-foreground/10" />

          <div className="flex-1 flex justify-center">
            <VotingButtons
              reportId={report.id}
              initialUpvoteCount={report.upvoteCount}
              initialDownvoteCount={report.downvoteCount}
              isAnonymous={isAnonymous}
              compact
            />
          </div>
        </div>
      </motion.div>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        contentType="report"
        contentId={report.id}
      />

      {/* Lightbox / Dialog */}
      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-[100] w-full h-full bg-background/98 backdrop-blur-3xl p-0 m-0 border-0 overflow-hidden"
        onClick={handleCloseMedia}
        onKeyDown={e => e.key === 'Escape' && handleCloseMedia()}
      >
        <AnimatePresence>
          {selectedMedia && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-12"
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleCloseMedia}
                className="absolute top-6 right-6 md:top-8 md:right-8 p-3 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-all border border-foreground/10 z-[110]"
              >
                <CloseIcon size={20} />
              </button>

              <div className="w-full max-w-6xl max-h-[80vh] flex items-center justify-center">
                {selectedMedia.mediaType === 'image' && (
                  <motion.img
                    layoutId={`media-${selectedMedia.id}`}
                    src={
                      selectedMedia.url ||
                      getS3PublicUrl(selectedMedia.s3Key, selectedMedia.s3Bucket)
                    }
                    alt="Evidence Evidence"
                    className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl border border-foreground/10"
                  />
                )}
                {selectedMedia.mediaType === 'video' && (
                  <video
                    src={
                      selectedMedia.url ||
                      getS3PublicUrl(selectedMedia.s3Key, selectedMedia.s3Bucket)
                    }
                    controls
                    autoPlay
                    className="max-w-full max-h-full rounded-[2rem] shadow-2xl border border-foreground/10 bg-black"
                  >
                    <track kind="captions" />
                  </video>
                )}
                {/* Fallback for other types in lightbox if needed */}
                {(selectedMedia.mediaType === 'audio' ||
                  selectedMedia.mediaType === 'document') && (
                  <div className="flex flex-col items-center gap-6 p-12 rounded-[3rem] bg-foreground/5 border border-foreground/10">
                    {selectedMedia.mediaType === 'audio' ? (
                      <Music size={64} className="text-foreground/20" />
                    ) : (
                      <FileText size={64} className="text-foreground/20" />
                    )}
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-foreground/40">
                      {selectedMedia.originalFilename}
                    </p>
                  </div>
                )}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 flex items-center gap-6"
              >
                <a
                  href={
                    selectedMedia.url || getS3PublicUrl(selectedMedia.s3Key, selectedMedia.s3Bucket)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-10 py-4 rounded-full bg-foreground text-background text-xs font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-2xl active:scale-95"
                >
                  {commonT('open')}
                </a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </dialog>
    </motion.div>
  );
}
