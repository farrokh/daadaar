'use client';

import { format } from 'date-fns';
import { enUS, faIR } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { GitCommit, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface Commit {
  hash: string;
  date: string;
  message: string | { en: string; fa: string };
  author: string;
  type?: string;
}

interface UpdateDay {
  date: string;
  technical: Commit[];
  public: Commit[];
}

interface UpdatesFeedProps {
  updates: UpdateDay[];
  locale: string;
}

export function UpdatesFeed({ updates, locale }: UpdatesFeedProps) {
  const t = useTranslations('updates');
  const [view, setView] = useState<'public' | 'technical'>('public');
  const dateLocale = locale === 'fa' ? faIR : enUS;
  const isRtl = locale === 'fa';
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const scrollToDate = (date: string) => {
    const element = document.getElementById(`update-${date}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="pt-32 pb-32 px-6 md:px-12 max-w-5xl mx-auto font-sans relative">
      {/* Minimap - Hidden on small screens */}
      {!isRtl && (
        <div className="fixed left-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-0.5 py-4 z-50">
          {updates.map(day => {
            // Skip days that are empty in the current view
            if (
              (view === 'public' && day.public.length === 0) ||
              (view === 'technical' && day.technical.length === 0)
            )
              return null;

            const isHovered = hoveredDate === day.date;

            return (
              <motion.button
                key={day.date}
                layout
                onClick={() => scrollToDate(day.date)}
                onHoverStart={() => setHoveredDate(day.date)}
                onHoverEnd={() => setHoveredDate(null)}
                className="relative group outline-none py-2 w-12 flex items-center justify-start"
              >
                {/* The Dash/Dot */}
                <motion.div
                  layoutId={`dash-${day.date}`}
                  className={`rounded-full bg-foreground/20 group-hover:bg-foreground/80 transition-colors duration-300 ${isHovered ? 'w-6 h-1' : 'w-3 h-1'}`}
                />

                {/* Date Tooltip */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 20 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-full top-1/2 -translate-y-1/2 whitespace-nowrap bg-foreground/90 backdrop-blur text-background text-xs font-medium px-2 py-1 rounded"
                    >
                      {format(new Date(day.date), 'MMM d', { locale: dateLocale })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* RTL Minimap */}
      {isRtl && (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-0.5 py-4 z-50 items-end">
          {updates.map(day => {
            if (
              (view === 'public' && day.public.length === 0) ||
              (view === 'technical' && day.technical.length === 0)
            )
              return null;
            const isHovered = hoveredDate === day.date;
            return (
              <motion.button
                key={day.date}
                layout
                onClick={() => scrollToDate(day.date)}
                onHoverStart={() => setHoveredDate(day.date)}
                onHoverEnd={() => setHoveredDate(null)}
                className="relative group outline-none py-2 w-12 flex items-center justify-end"
              >
                <motion.div
                  layoutId={`dash-${day.date}`}
                  className={`rounded-full bg-foreground/20 group-hover:bg-foreground/80 transition-colors duration-300 ${isHovered ? 'w-6 h-1' : 'w-3 h-1'}`}
                />
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: -20 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-full top-1/2 -translate-y-1/2 whitespace-nowrap bg-foreground/90 backdrop-blur text-background text-xs font-medium px-2 py-1 rounded"
                    >
                      {format(new Date(day.date), 'MMM d', { locale: dateLocale })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Header Section */}
      <section className="mb-24 space-y-12">
        <header className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-foreground/10 pb-4">
            <h1
              className={`text-sm font-medium uppercase text-foreground/50 ${
                isRtl ? '' : 'tracking-[0.2em]'
              }`}
            >
              {t('title')}
            </h1>

            {/* Toggle Switches - Styled minimally */}
            <div className="flex bg-foreground/5 p-1 rounded-full border border-foreground/10">
              <button
                type="button"
                onClick={() => setView('public')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                  view === 'public'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                {t('public_view')}
              </button>
              <button
                type="button"
                onClick={() => setView('technical')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                  view === 'technical'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                {t('technical_view')}
              </button>
            </div>
          </div>

          <p
            className={`text-4xl md:text-5xl font-bold text-foreground max-w-3xl ${
              isRtl ? 'leading-normal' : 'tracking-tight leading-[1.1]'
            }`}
          >
            {t('description')}
          </p>
        </header>
      </section>

      {/* Updates Stream */}
      <div className="relative">
        {/* Continuous Line */}
        <div
          className={`absolute top-0 bottom-0 w-px bg-foreground/10 ${isRtl ? 'right-[27px] md:right-auto md:left-1/2' : 'left-[27px] md:left-1/2'}`}
        />

        <div className="space-y-16">
          {updates.length === 0 && (
            <div className="text-center py-24 text-foreground/40 font-light text-lg">
              {t('no_updates')}
            </div>
          )}

          {updates.map((day, index) => {
            const commits = view === 'public' ? day.public : day.technical;
            if (commits.length === 0) return null;

            return (
              <div id={`update-${day.date}`} key={day.date} className="relative group scroll-mt-40">
                {/* Date Marker (Center) */}
                <div
                  className={`absolute top-0 flex items-center justify-center w-14 h-14 bg-background border border-foreground/10 rounded-full z-10 transition-transform duration-300 group-hover:scale-110 ${isRtl ? 'right-0 md:right-auto md:left-1/2 md:-translate-x-1/2' : 'left-0 md:left-1/2 md:-translate-x-1/2'}`}
                >
                  <div className="flex flex-col items-center justify-center leading-none">
                    <span className="text-[10px] uppercase font-bold text-foreground/40">
                      {format(new Date(day.date), 'MMM', { locale: dateLocale })}
                    </span>
                    <span className="text-lg font-bold text-foreground/80">
                      {format(new Date(day.date), 'd', { locale: dateLocale })}
                    </span>
                  </div>
                </div>

                {/* Content Card (Alternating) */}
                <div
                  className={`
                            pl-20 md:pl-0 md:w-1/2
                            ${index % 2 === 0 ? (isRtl ? 'md:mr-auto md:pl-16' : 'md:ml-auto md:pl-16') : isRtl ? 'md:ml-auto md:pr-16 md:pl-0' : 'md:mr-auto md:pr-16 md:pl-0 text-right'}
                        `}
                >
                  <div
                    className={`
                                p-6 border border-foreground/5 bg-foreground/[0.02] rounded-xl hover:bg-foreground/[0.04] transition-colors duration-300
                                ${view === 'technical' ? 'font-mono text-sm' : ''}
                             `}
                  >
                    {/* Summary Header for Card */}
                    <div
                      className={`flex items-center gap-3 mb-6 pb-4 border-b border-foreground/5 ${index % 2 !== 0 && !isRtl ? 'md:flex-row-reverse' : ''}`}
                    >
                      <h3 className="text-lg font-medium text-foreground/90">
                        {format(new Date(day.date), 'PPPP', { locale: dateLocale })}
                      </h3>
                      <span className="text-xs px-2 py-1 rounded-md bg-foreground/5 text-foreground/60">
                        {commits.length}{' '}
                        {commits.length === 1
                          ? locale === 'fa'
                            ? 'تغییر'
                            : 'Change'
                          : locale === 'fa'
                            ? 'تغییر'
                            : 'Changes'}
                      </span>
                    </div>

                    <ul className="space-y-4">
                      {commits.map(commit => (
                        <li
                          key={commit.hash}
                          className={`flex flex-col gap-1 ${index % 2 !== 0 && !isRtl ? 'md:items-end' : ''}`}
                        >
                          <div
                            className={`flex items-start gap-3 ${index % 2 !== 0 && !isRtl ? 'md:flex-row-reverse' : ''}`}
                          >
                            {/* Type Indicator */}
                            <div
                              className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                                commit.type === 'feature'
                                  ? 'bg-emerald-500/70 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                  : commit.type === 'fix'
                                    ? 'bg-rose-500/70 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                                    : commit.type === 'performance'
                                      ? 'bg-amber-500/70 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                                      : commit.type === 'ui'
                                        ? 'bg-violet-500/70 shadow-[0_0_8px_rgba(139,92,246,0.3)]'
                                        : 'bg-foreground/20'
                              }`}
                            />

                            <div
                              className={`flex-1 ${index % 2 !== 0 && !isRtl ? 'md:text-right' : ''}`}
                            >
                              <p className="text-foreground/80 leading-relaxed font-light">
                                {typeof commit.message === 'string'
                                  ? commit.message
                                  : locale === 'fa'
                                    ? commit.message.fa
                                    : commit.message.en}
                              </p>

                              {view === 'technical' && (
                                <div
                                  className={`mt-2 flex items-center gap-3 text-xs text-foreground/40 font-mono tracking-wide ${index % 2 !== 0 && !isRtl ? 'md:justify-end' : ''}`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    <GitCommit className="w-3 h-3" />
                                    {commit.hash.substring(0, 7)}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <User className="w-3 h-3" />
                                    {commit.author}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
