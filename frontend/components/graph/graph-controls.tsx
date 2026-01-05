'use client';

import { Button } from '@/components/ui/button';
import { Maximize, Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useReactFlow } from 'reactflow';

export function GraphControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const t = useTranslations('graph');

  return (
    <div className="absolute bottom-32 left-6 z-10 flex flex-col gap-2 p-1.5 bg-background/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => zoomIn()}
        className="h-9 w-9 p-0 rounded-xl hover:bg-foreground/5 text-foreground/80 hover:text-foreground transition-all"
        title={t('zoom_in')}
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => zoomOut()}
        className="h-9 w-9 p-0 rounded-xl hover:bg-foreground/5 text-foreground/80 hover:text-foreground transition-all"
        title={t('zoom_out')}
      >
        <Minus className="h-4 w-4" />
      </Button>

      <div className="h-px w-4 bg-foreground/10 mx-auto" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => fitView({ duration: 800, padding: 0.2 })}
        className="h-9 w-9 p-0 rounded-xl hover:bg-foreground/5 text-foreground/80 hover:text-foreground transition-all"
        title={t('fit_view')}
      >
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
}
