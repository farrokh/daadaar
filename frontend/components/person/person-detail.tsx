'use client';

import { MobileMenu } from '@/components/layout/mobile-menu';
import { SubmitReportModal } from '@/components/reports/submit-report-modal';
import { PillButton } from '@/components/ui/pill-button';
import { cn } from '@/lib/utils';
import type { Individual } from '@/shared/types';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  FileText,
  Menu,
  Network,
  Share2,
  ThumbsDown,
  ThumbsUp,
  User,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PersonDetailProps {
  person: Individual;
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

export default function PersonDetail({ person }: PersonDetailProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('person');
  const commonT = useTranslations('common');
  const orgT = useTranslations('organization');
  const tGraph = useTranslations('graph');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitReportModalOpen, setIsSubmitReportModalOpen] = useState(false);

  const isRtl = locale === 'fa';
  const name = isRtl ? person.fullName : person.fullNameEn || person.fullName;
  const biography = isRtl ? person.biography : person.biographyEn || person.biography;
  const createdDate = new Date(person.createdAt).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="min-h-screen pt-20 pb-32 md:pt-32 md:pb-32 px-5 md:px-12 max-w-5xl mx-auto font-sans"
    >
      {/* Header */}
      <motion.header variants={fadeInUp} className="mb-12 space-y-8">
        <div className="flex items-center justify-between gap-6 border-b border-foreground/5 pb-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/${locale}`)}
              className="flex items-center gap-2 text-sm font-semibold text-foreground/40 hover:text-foreground transition-all group"
            >
              <ArrowLeft
                className={`w-4 h-4 transition-transform group-hover:-translate-x-1 ${isRtl ? 'rotate-180 group-hover:translate-x-1' : ''}`}
              />
              <span className="hidden md:inline">{commonT('home')}</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <PillButton
              href={`/${locale}/?view=people&individualId=${person.id}`}
              label={t('view_on_graph')}
              icon={Network}
            />

            <PillButton
              action="share"
              label={commonT('share')}
              copiedLabel={commonT('copied')}
              icon={Share2}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          {/* Profile Image */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-foreground/[0.02] to-foreground/[0.08] backdrop-blur-sm flex items-center justify-center shrink-0 border border-foreground/10 shadow-sm overflow-hidden"
          >
            {person.profileImageUrl ? (
              <img src={person.profileImageUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-foreground/20" />
            )}
          </motion.div>

          <div className="space-y-3">
            <motion.h1
              className={`text-4xl md:text-6xl font-black text-foreground tracking-tight ${isRtl ? 'leading-normal' : 'leading-none'}`}
            >
              {name}
            </motion.h1>
            <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest text-foreground/40">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {orgT('added_on')} {createdDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8 space-y-16">
          {/* Biography */}
          <motion.section variants={fadeInUp} className="space-y-6">
            <h2 className="text-[10px] font-black uppercase text-accent-primary tracking-[0.3em]">
              {t('biography')}
            </h2>
            <p className="text-lg md:text-xl leading-relaxed text-foreground/80 font-medium whitespace-pre-wrap">
              {biography || t('no_biography')}
            </p>
          </motion.section>

          {/* Associated Reports */}
          <motion.section
            variants={fadeInUp}
            className="space-y-8 pt-12 border-t border-foreground/5"
          >
            <h2 className="text-[10px] font-black uppercase text-foreground/30 tracking-[0.3em]">
              {t('associated_reports')}
            </h2>
            {person.reports && person.reports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {person.reports.map(report => {
                  const coverImage = report.media?.find(m => m.mediaType === 'image');
                  return (
                    <Link
                      href={`/${locale}/reports/${report.shareableUuid}`}
                      key={report.id}
                      className="group flex flex-col h-full rounded-[1.5rem] bg-foreground/[0.02] border border-foreground/5 overflow-hidden hover:bg-foreground/[0.04] hover:border-foreground/10 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    >
                      {/* Cover Image Area */}
                      <div className="h-48 w-full bg-foreground/5 relative overflow-hidden">
                        {coverImage?.url ? (
                          <img
                            src={coverImage.url}
                            alt={report.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground/10 group-hover:text-accent-primary/20 transition-colors">
                            <FileText className="w-12 h-12" />
                          </div>
                        )}

                        {/* Status / Category badge usually goes here, simplified for now */}
                      </div>

                      {/* Content Area */}
                      <div className="p-5 flex-1 flex flex-col gap-4">
                        <div className="space-y-2 flex-1">
                          <h3 className="text-lg font-bold leading-snug group-hover:text-accent-primary transition-colors line-clamp-2">
                            {isRtl ? report.title : report.titleEn || report.title}
                          </h3>

                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(report.incidentDate || report.createdAt).toLocaleDateString(
                                locale,
                                {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                }
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Footer: Votes */}
                        <div className="flex items-center gap-3 pt-4 border-t border-foreground/5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/60 bg-foreground/5 px-2.5 py-1 rounded-full">
                            <ThumbsUp className="w-3 h-3" />
                            <span>{report.upvoteCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/60 bg-foreground/5 px-2.5 py-1 rounded-full">
                            <ThumbsDown className="w-3 h-3" />
                            <span>{report.downvoteCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-foreground/40 text-sm font-medium italic">{t('no_reports')}</p>
            )}
          </motion.section>
        </div>

        {/* Sidebar */}
        <motion.aside variants={fadeInUp} className="lg:col-span-4 space-y-12">
          {/* Career History */}
          <section className="space-y-8">
            <h2 className="text-[10px] font-black uppercase text-foreground/30 tracking-[0.3em]">
              {t('career_history')}
            </h2>
            {person.history && person.history.length > 0 ? (
              <div className="space-y-4">
                {person.history.map((record, index) => {
                  const isPresent = !record.endDate;
                  return (
                    <div
                      key={record.id}
                      className="group relative flex items-start gap-4 p-4 rounded-2xl hover:bg-foreground/[0.02] transition-colors border border-transparent hover:border-foreground/5"
                    >
                      {/* Timeline Line */}
                      {index !== (person.history?.length || 0) - 1 && (
                        <div className="absolute left-[27px] top-10 bottom-0 w-px bg-foreground/5 group-hover:bg-foreground/10 transition-colors" />
                      )}

                      {/* Icon / Dot */}
                      <div
                        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border ${isPresent ? 'bg-accent-primary/10 border-accent-primary/20 text-accent-primary' : 'bg-foreground/5 border-foreground/5 text-foreground/20'}`}
                      >
                        <Briefcase className="w-3 h-3" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-sm font-bold text-foreground leading-snug">
                            {isRtl ? record.roleTitle : record.roleTitleEn || record.roleTitle}
                          </h3>
                          {isPresent && (
                            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary text-[9px] font-black uppercase tracking-widest">
                              {t('present')}
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/${locale}/org/${record.organizationUuid}`}
                          className="text-xs font-semibold text-foreground/60 hover:text-accent-primary transition-colors block truncate"
                        >
                          {isRtl
                            ? record.organizationName
                            : record.organizationNameEn || record.organizationName}
                        </Link>

                        <time className="text-[10px] font-medium text-foreground/30 block">
                          {new Date(record.startDate).toLocaleDateString(locale, {
                            year: 'numeric',
                            month: 'short',
                          })}
                          {' — '}
                          {record.endDate
                            ? new Date(record.endDate).toLocaleDateString(locale, {
                                year: 'numeric',
                                month: 'short',
                              })
                            : t('present')}
                        </time>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-foreground/40 text-sm font-medium italic">{t('no_history')}</p>
            )}
          </section>
        </motion.aside>
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
            <PillButton
              action="share"
              label=""
              icon={Share2}
              className="w-10 h-10 min-w-[2.5rem] p-0 flex items-center justify-center rounded-full bg-transparent hover:bg-foreground/5 transition-colors border-none shadow-none text-foreground/40 hover:text-foreground"
            />
          </div>

          <div className="w-px h-6 bg-foreground/10" />

          <div className="flex-1 flex justify-center">
            <div className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">
              {commonT('person')}
            </div>
          </div>
        </div>
      </motion.div>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        contentType="individual"
        contentId={person.id}
        customActions={[
          {
            label: tGraph('add_report'),
            icon: <FileText size={20} className="text-foreground/80" />,
            onClick: () => setIsSubmitReportModalOpen(true),
          },
        ]}
      />

      <SubmitReportModal
        isOpen={isSubmitReportModalOpen}
        onClose={() => setIsSubmitReportModalOpen(false)}
        individualId={person.id}
        individualName={name || 'Unknown'}
        apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </motion.div>
  );
}
