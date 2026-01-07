'use client';

import { cn, getS3PublicUrl } from '@/lib/utils';
import { User } from 'lucide-react';
import { useLocale } from 'next-intl';
import { memo } from 'react';
import { Handle, type NodeProps, Position } from 'reactflow';
import type { PersonNodeData } from './types';

function PersonNode({ data }: NodeProps<PersonNodeData>) {
  const locale = useLocale();
  const displayName = locale === 'en' ? data.nameEn || data.name : data.name;
  const displayBiography = locale === 'en' ? data.biographyEn || data.biography : data.biography;

  const imageUrl = data.url || (data.s3Key ? getS3PublicUrl(data.s3Key) : null);
  const isDetailView = data.isDetailView;

  return (
    <div
      className={cn(
        'group relative',
        isDetailView ? 'min-w-[280px] max-w-[360px]' : 'min-w-[240px] max-w-[320px]'
      )}
    >
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary to-pink-500 rounded-xl opacity-20 group-hover:opacity-40 blur transition duration-500" />

      {/* Card Content */}
      <div className="relative px-5 py-4 bg-background/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl transition-transform">
        {/* Source handle (right side - for outgoing edges to reports) */}
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !opacity-0" />

        {/* Target handle (left side - for incoming edges from organization) */}
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !opacity-0" />

        {isDetailView ? (
          <div className="space-y-4">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-secondary/10 flex items-center justify-center">
              {imageUrl ? (
                <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-secondary" />
              )}
            </div>
            <div className="space-y-2">
              <div className="font-bold text-lg text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                {displayName}
              </div>
              {displayBiography && (
                <div className="text-sm text-foreground/60 leading-relaxed max-h-32 overflow-y-auto pr-2">
                  {displayBiography}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="relative w-10 h-10 rounded-lg shrink-0 overflow-hidden bg-secondary/10 flex items-center justify-center">
              {imageUrl ? (
                <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-secondary" />
              )}
            </div>
            <div>
              <div className="font-bold text-base text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                {displayName}
              </div>
              {displayBiography && (
                <div className="text-xs text-foreground/50 mt-1.5 line-clamp-2 leading-relaxed">
                  {displayBiography}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(PersonNode);
