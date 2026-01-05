'use client';

import { getS3PublicUrl } from '@/lib/utils';
import { Building2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { memo } from 'react';
import { Handle, type NodeProps, Position } from 'reactflow';
import type { OrganizationNodeData } from './types';

function OrganizationNode({ data }: NodeProps<OrganizationNodeData>) {
  const locale = useLocale();
  const displayName = locale === 'en' ? data.nameEn || data.name : data.name;
  const displayDescription =
    locale === 'en' ? data.descriptionEn || data.description : data.description;

  const imageUrl = data.url || (data.s3Key ? getS3PublicUrl(data.s3Key) : null);

  return (
    <div className="group relative min-w-[240px] max-w-[320px]">
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent-secondary rounded-xl opacity-20 group-hover:opacity-40 blur transition duration-500" />

      {/* Card Content */}
      <div className="relative px-5 py-4 bg-background/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl transition-transform">
        {/* Source handle (right side - for outgoing edges to children) */}
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !opacity-0" />

        {/* Target handle (left side - for incoming edges from parent) */}
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !opacity-0" />

        <div className="flex items-start gap-4">
          <div className="relative w-10 h-10 rounded-lg shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-5 h-5 text-primary" />
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
      </div>
    </div>
  );
}

export default memo(OrganizationNode);
