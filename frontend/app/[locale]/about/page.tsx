'use client';

import { ArrowUpRight, Check, Github, Lock, Network, Share2, Shield } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

export default function AboutPage() {
  const t = useTranslations('aboutPage');
  const locale = useLocale();
  const isRtl = locale === 'fa';
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const steps = [
    {
      title: t('how_it_works_step1_title'),
      description: t('how_it_works_step1_body'),
      icon: Shield,
    },
    {
      title: t('how_it_works_step2_title'),
      description: t('how_it_works_step2_body'),
      icon: Lock,
    },
    {
      title: t('how_it_works_step3_title'),
      description: t('how_it_works_step3_body'),
      icon: Network,
    },
  ];

  return (
    <div className="min-h-screen pt-32 pb-32 px-6 md:px-12 max-w-5xl mx-auto font-sans">
      {/* Introduction */}
      <section className="mb-24 space-y-12">
        <header className="space-y-6">
          <h1
            className={`text-sm font-medium uppercase text-foreground/50 border-b border-foreground/10 pb-4 ${
              isRtl ? '' : 'tracking-[0.2em]'
            }`}
          >
            {t('title')}
          </h1>
          <p
            className={`text-4xl md:text-6xl font-bold text-foreground max-w-4xl ${
              isRtl ? 'leading-normal' : 'tracking-tight leading-[1.1]'
            }`}
          >
            {t('subtitle')}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <h2 className="text-xl font-medium">{t('intro_title')}</h2>
          </div>
          <div className="md:col-span-8 space-y-8">
            <p className="text-lg leading-relaxed text-foreground/80 font-light">
              {t('intro_body')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-foreground/10 pt-12">
          <div className="md:col-span-4">
            <h2 className="text-xl font-medium">{t('context_title')}</h2>
          </div>
          <div className="md:col-span-8">
            <p className="text-lg leading-relaxed text-foreground/80 font-light">
              {t('context_body')}
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-24">
        <div className="flex items-center gap-4 mb-16">
          <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-foreground/50">
            {t('how_it_works_title')}
          </h3>
          <div className="h-px flex-1 bg-foreground/10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, _idx) => (
            <div key={step.title} className="space-y-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-foreground/5 text-foreground/80 mb-6">
                <step.icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h4 className="text-xl font-medium">{step.title}</h4>
              <p className="text-foreground/60 leading-relaxed text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technical & Privacy (Split) */}
      <section className="mb-24 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="p-8 md:p-10 bg-foreground/[0.02] border border-foreground/[0.05] rounded-xl space-y-6">
          <h3 className="text-2xl font-medium">{t('tech_title')}</h3>
          <p className="text-foreground/70 leading-relaxed font-light">{t('tech_body')}</p>
        </div>

        <div className="p-8 md:p-10 bg-foreground/5 border border-foreground/10 rounded-xl space-y-6">
          <h3 className="text-2xl font-medium">{t('privacy_title')}</h3>
          <p className="text-foreground/70 leading-relaxed font-light">{t('privacy_body')}</p>
        </div>
      </section>

      {/* Call to Action & Footer */}
      <section className="border-t border-foreground/10 pt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-6">
            <h3 className="text-2xl font-light text-foreground/90">{t('join_us_title')}</h3>
            <p className="text-foreground/60 leading-relaxed">{t('join_us_body')}</p>
            <div className="pt-4 flex items-center gap-6">
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/70 transition-colors bg-transparent border-none cursor-pointer"
                onClick={handleShare}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                {copied ? t('copied') : t('share_initiative')}
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between space-y-8 md:text-right">
            <div className="space-y-2">
              <h3 className="text-xl font-medium">{t('opensource_title')}</h3>
              <p className="text-foreground/60 text-sm">{t('opensource_desc')}</p>
            </div>

            <div className="flex md:justify-end">
              <a
                href="https://github.com/farrokh/daadaar"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 px-6 py-3 bg-foreground text-background rounded-lg font-medium transition-all hover:bg-foreground/90 active:scale-[0.98]"
              >
                <Github className="w-4 h-4" />
                <span>View on GitHub</span>
                <ArrowUpRight className="w-3 h-3 opacity-50 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
