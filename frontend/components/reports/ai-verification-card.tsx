'use client';

import type { AiVerification } from '@/shared/types';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

interface AiVerificationCardProps {
  verification: AiVerification;
}

export function AiVerificationCard({ verification }: AiVerificationCardProps) {
  const locale = useLocale();
  const t = useTranslations('ai_verification');
  const isRtl = locale === 'fa';
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse flags from JSON string
  let flags: string[] = [];
  try {
    const rawFlags = isRtl ? verification.flags : verification.flagsEn || verification.flags;

    if (rawFlags) {
      flags = JSON.parse(rawFlags);
    }
  } catch (e) {
    console.error('Failed to parse AI flags', e);
  }

  const summary = isRtl
    ? verification.factCheckSummary
    : verification.factCheckSummaryEn || verification.factCheckSummary;

  // Determine overall status color/icon
  const getStatusColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 50) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  const StatusIcon =
    verification.confidenceScore >= 80
      ? ShieldCheck
      : verification.confidenceScore >= 50
        ? Shield
        : ShieldAlert;

  const statusColorClass = getStatusColor(verification.confidenceScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-3xl overflow-hidden border border-foreground/10 bg-background/50 backdrop-blur-xl relative group"
    >
      {/* Header / Summary Strip */}
      <div className="p-1 absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="p-6 md:p-8">
        <div className="space-y-8">
          {/* AI Disclaimer */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[11px] md:text-xs text-amber-500/70 italic">
            <Info size={14} className="shrink-0 mt-0.5" />
            <p>{t('ai_disclaimer')}</p>
          </div>
          {/* Header Row: Title & Status Icon */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xl md:text-2xl font-black text-foreground flex items-center flex-wrap gap-3">
                {t('ai_analysis_title')}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border tracking-widest font-black uppercase ${statusColorClass}`}
                >
                  {verification.modelUsed || 'AI'}
                </span>
              </h3>
            </div>
            <div className={`p-3 rounded-2xl ${statusColorClass} shrink-0`}>
              <StatusIcon size={32} strokeWidth={1.5} />
            </div>
          </div>

          {/* Scores Row */}
          <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <ScorePill label={t('confidence')} value={verification.confidenceScore} icon={Shield} />
            {verification.credibilityScore !== null && (
              <ScorePill
                label={t('credibility')}
                value={verification.credibilityScore}
                icon={CheckCircle2}
              />
            )}
            {verification.consistencyScore !== null && (
              <ScorePill
                label={t('consistency')}
                value={verification.consistencyScore}
                icon={Info}
              />
            )}
          </div>

          {/* Summary Section (Full Width) */}
          <div className="prose prose-sm md:prose-base max-w-none text-foreground/80 leading-relaxed font-medium">
            <p className="whitespace-pre-wrap">{summary || t('no_summary_available')}</p>
          </div>
        </div>

        {/* Expand/Collapse Toggle for Flags */}
        {flags.length > 0 && (
          <div className="mt-6 pt-6 border-t border-foreground/10">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-all w-full md:w-auto"
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>
                {t('analysis_details')} ({flags.length} {t('flags')})
              </span>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {flags.map((flag, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl bg-foreground/[0.03] border border-foreground/5 text-sm text-foreground/70"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ScorePill({
  label,
  value,
  icon: Icon,
}: { label: string; value: number; icon: React.ElementType }) {
  const getColor = (v: number) => {
    if (v >= 80) return 'text-emerald-500';
    if (v >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 w-24 h-24 rounded-2xl bg-foreground/[0.03] border border-foreground/5">
      <Icon size={18} className={`mb-2 ${getColor(value)}`} />
      <span className="text-2xl font-black text-foreground">{value}%</span>
      <span className="text-[10px] uppercase font-bold text-foreground/30 text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
