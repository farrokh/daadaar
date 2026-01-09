'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import { Handle, Position } from 'reactflow';

import { Edit2, ExternalLink, Network, User } from 'lucide-react';
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
  memberCount?: number;
  onExpand?: () => void;
  childCount?: number;
  onToggleChildren?: () => void;
  isExpanded?: boolean;
  toggleOnLeft?: boolean;
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
  memberCount,
  onExpand,
  childCount,
  onToggleChildren,
  isExpanded,
  toggleOnLeft,
}: BaseNodeCardProps) {
  const t = useTranslations('graph');
  const expandLabel = t('sub_toggle_expand_label');
  const collapseLabel = t('sub_toggle_collapse_label');

  const expansionIndicator =
    childCount !== undefined && childCount > 0 ? (
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          onToggleChildren?.();
        }}
        className={cn(
          toggleOnLeft ? 'mr-3' : 'ml-3',
          'flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-lg transition-all duration-300 border backdrop-blur-xl',
          isExpanded
            ? 'bg-accent-secondary/20 text-accent-secondary border-accent-secondary/30 shadow-lg'
            : 'bg-background/60 text-accent-secondary border-accent-secondary/20 hover:bg-accent-secondary/10 hover:border-accent-secondary/30 hover:shadow-md'
        )}
        onMouseDown={e => e.stopPropagation()}
        aria-label={isExpanded ? collapseLabel : expandLabel}
        title={isExpanded ? collapseLabel : expandLabel}
      >
        <Network
          className={cn(
            'w-4 h-4 transition-transform duration-300',
            isExpanded ? 'rotate-90' : 'rotate-0'
          )}
        />
        <span className="text-xs font-bold">{childCount}</span>
        <span className="text-[9px] font-medium whitespace-nowrap">
          {isExpanded ? t('sub_toggle_hide') : t('sub_toggle_show')}
        </span>
      </button>
    ) : null;

  return (
    <div
      className={cn(
        'group relative flex items-center gap-0 z-10',
        isDetailView ? 'min-w-[280px] max-w-[360px]' : 'min-w-[240px] max-w-[320px]'
      )}
    >
      {toggleOnLeft && expansionIndicator}
      <div className="relative flex-1">
        <div
          className={cn(
            'absolute -inset-0.5 bg-gradient-to-r rounded-xl opacity-20 group-hover:opacity-40 blur transition duration-500',
            glowGradientClassName
          )}
        />
        <div className="relative px-5 py-4 bg-background/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl transition-transform">
          {onEdit && (
            <button
              type="button"
              onClick={e => {
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

          <Handle
            type="source"
            position={Position.Right}
            id="right"
            className="!w-3 !h-3 !opacity-0"
          />
          <Handle
            type="target"
            position={Position.Right}
            id="right"
            className="!w-3 !h-3 !opacity-0"
          />
          <Handle
            type="source"
            position={Position.Left}
            id="left"
            className="!w-3 !h-3 !opacity-0"
          />
          <Handle
            type="target"
            position={Position.Left}
            id="left"
            className="!w-3 !h-3 !opacity-0"
          />

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
                    // biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable region must be focusable
                    tabIndex={0}
                    aria-label="Description"
                  >
                    {displayDescription}
                  </section>
                )}
                <div className="flex items-center justify-between pt-2">
                  {shareUrl && (
                    <Link
                      href={shareUrl}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-2 text-xs font-medium text-foreground/50 hover:text-foreground transition-colors p-2 rounded-md hover:bg-foreground/5 w-fit"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {shareUrlLabel || 'View Profile'}
                    </Link>
                  )}
                  {memberCount !== undefined && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        if (memberCount > 0) onExpand?.();
                      }}
                      disabled={memberCount === 0 || !onExpand}
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all duration-300 border',
                        memberCount > 0 && onExpand
                          ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/20 hover:bg-accent-primary/20 hover:scale-105 active:scale-95 cursor-pointer'
                          : 'bg-muted/50 text-muted-foreground border-transparent cursor-default'
                      )}
                    >
                      <User className="w-3 h-3" />
                      {memberCount}
                    </button>
                  )}
                </div>
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
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                  {displayName}
                </div>
                {displayDescription && (
                  <div className="text-xs text-foreground/50 mt-1.5 line-clamp-2 leading-relaxed">
                    {displayDescription}
                  </div>
                )}
                {memberCount !== undefined && (
                  <div className="mt-3 flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        if (memberCount > 0) onExpand?.();
                      }}
                      disabled={memberCount === 0 || !onExpand}
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all duration-300 border',
                        memberCount > 0 && onExpand
                          ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/20 hover:bg-accent-primary/20 hover:scale-105 active:scale-95 cursor-pointer'
                          : 'bg-muted/50 text-muted-foreground border-transparent cursor-default'
                      )}
                      onMouseDown={e => e.stopPropagation()}
                    >
                      <User className="w-3 h-3" />
                      {memberCount}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {!toggleOnLeft && expansionIndicator}
    </div>
  );
}

export default memo(BaseNodeCard);
