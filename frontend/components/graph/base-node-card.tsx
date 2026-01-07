'use client';

import { cn } from '@/lib/utils';
import { memo } from 'react';
import { Handle, Position } from 'reactflow';

export interface BaseNodeCardProps {
  displayName: string;
  displayDescription?: string | null;
  imageUrl?: string | null;
  isDetailView?: boolean;
  fallbackIcon: React.ReactNode;
  iconBgClassName: string;
  glowGradientClassName: string;
}

function BaseNodeCard({
  displayName,
  displayDescription,
  imageUrl,
  isDetailView,
  fallbackIcon,
  iconBgClassName,
  glowGradientClassName,
}: BaseNodeCardProps) {
  return (
    <div
      className={cn(
        'group relative',
        isDetailView ? 'min-w-[280px] max-w-[360px]' : 'min-w-[240px] max-w-[320px]'
      )}
    >
      {/* Glow Effect */}
      <div
        className={cn(
          'absolute -inset-0.5 bg-gradient-to-r rounded-xl opacity-20 group-hover:opacity-40 blur transition duration-500',
          glowGradientClassName
        )}
      />

      {/* Card Content */}
      <div className="relative px-5 py-4 bg-background/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl transition-transform">
        {/* Source handle (right side - for outgoing edges) */}
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !opacity-0" />

        {/* Target handle (left side - for incoming edges) */}
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !opacity-0" />

        {isDetailView ? (
          <div className="space-y-4">
            <div
              className={cn(
                'relative w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center',
                iconBgClassName
              )}
            >
              {imageUrl ? (
                <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-10 h-10">{fallbackIcon}</div>
              )}
            </div>
            <div className="space-y-2">
              <div className="font-bold text-lg text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                {displayName}
              </div>
              {displayDescription && (
                <div
                  className="text-sm text-foreground/60 leading-relaxed max-h-32 overflow-y-auto pr-2"
                  tabIndex={0}
                  role="region"
                  aria-label="Description"
                >
                  {displayDescription}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'relative w-10 h-10 rounded-lg shrink-0 overflow-hidden flex items-center justify-center',
                iconBgClassName
              )}
            >
              {imageUrl ? (
                <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-5 h-5">{fallbackIcon}</div>
              )}
            </div>
            <div>
              <div className="font-bold text-base text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                {displayName}
              </div>
              {displayDescription && (
                <div className="text-xs text-foreground/50 mt-1.5 line-clamp-2 leading-relaxed">
                  {displayDescription}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(BaseNodeCard);
