'use client';

import { FileText } from 'lucide-react';
import { AlertCircle, Monitor, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function MobileNotReady() {
  const t = useTranslations('mobile');
  const [acknowledged, setAcknowledged] = useState(false);

  if (acknowledged) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/98 backdrop-blur-md p-6 text-center lg:hidden">
      <div className="flex flex-col items-center max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="relative flex items-center justify-center">
          <div className="absolute -left-8 -top-8 text-primary/10 animate-pulse delay-75">
            <Smartphone size={80} strokeWidth={1.5} />
          </div>
          <div className="bg-primary/10 p-6 rounded-3xl ring-1 ring-primary/20 shadow-2xl shadow-primary/10">
            <Monitor size={48} className="text-primary" strokeWidth={1.5} />
          </div>
          <div className="absolute -right-2 -bottom-2 bg-background rounded-full p-1.5 shadow-lg ring-1 ring-border">
            <AlertCircle size={24} className="text-amber-500" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t('not_ready_title')}
          </h2>

          <p className="text-muted-foreground text-base leading-relaxed">
            {t('not_ready_message')}
          </p>
        </div>

        <div className="pt-8 border-t border-border/50 w-full px-8 space-y-4">
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-sm text-secondary-foreground font-medium flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              {t('coming_soon')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAcknowledged(true)}
            className="w-full py-3 px-4 rounded-xl bg-foreground/5 text-foreground/70 hover:text-foreground hover:bg-foreground/10 text-sm font-medium transition-colors border border-foreground/10"
          >
            {t('proceed_anyway')}
          </button>
        </div>
      </div>
    </div>
  );
}
