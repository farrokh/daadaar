'use client';

import { cn } from '@/lib/utils';
import { memo } from 'react';
import { Handle, Position } from 'reactflow';

import { Edit2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export interface BaseNodeCardProps {
  displayName: string;
  displayDescription?: string | null;
  imageUrl?: string | null;
  shareUrl?: string;
  shareUrlLabel?: string;
  isDetailView?: boolean;
  fallbackIcon: React.ReactNode;
  iconBgClassName: string;
  glowGradientClassName: string;
  onEdit?: () => void;
}

function BaseNodeCard({
  displayName,
  displayDescription,
  imageUrl,
  shareUrl,
  shareUrlLabel,
  isDetailView,
  fallbackIcon,
  iconBgClassName,
  glowGradientClassName,
  onEdit,
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
        {/* Edit Button - Only shown if onEdit is provided */}
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 border border-foreground/10 opacity-0 group-hover:opacity-100 hover:bg-foreground/5 hover:border-foreground/20 transition-all duration-200 z-10"
            aria-label="Edit"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5 text-foreground/60" />
          </button>
        )}

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
                <section
                  className="text-sm text-foreground/60 leading-relaxed max-h-32 overflow-y-auto pr-2 outline-none focus-visible:ring-1 ring-primary/50 rounded-sm"
                  // biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable region needs keyboard access
                  tabIndex={0}
                  aria-label="Description"
                >
                  {displayDescription}
                </section>
              )}
              {shareUrl && (
                <div className="pt-2">
                  <Link
                    href={shareUrl}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-2 text-xs font-medium text-foreground/50 hover:text-foreground transition-colors p-2 rounded-md hover:bg-foreground/5 w-fit"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {shareUrlLabel || 'View Profile'}
                  </Link>
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
