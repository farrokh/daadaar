'use client';

import { FileText, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useLocale } from 'next-intl';
import { memo } from 'react';
import { Handle, type NodeProps, Position } from 'reactflow';
import type { ReportNodeData } from './types';

function ReportNode({ data }: NodeProps<ReportNodeData>) {
  const locale = useLocale();
  const displayTitle = locale === 'en' ? (data.titleEn || data.title) : data.title;
  const displayContent = locale === 'en' ? (data.contentEn || data.content) : data.content;

  return (
    <div className="group relative min-w-[280px] max-w-[360px]">
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl opacity-20 group-hover:opacity-40 blur transition duration-500" />

      {/* Card Content */}
      <div className="relative px-5 py-4 bg-background/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl transition-transform">
        {/* Target handle (left side - for incoming edges from person) */}
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !opacity-0" />

        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-green-500/10 rounded-lg shrink-0">
            <FileText className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-base text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80 line-clamp-2">
              {displayTitle}
            </div>
            {displayContent && (
              <div className="text-xs text-foreground/50 mt-1.5 line-clamp-2 leading-relaxed">
                {displayContent}
              </div>
            )}

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-foreground/5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/60">
                <ThumbsUp className="w-3.5 h-3.5 text-green-500" />
                <span>{data.upvoteCount}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/60">
                <ThumbsDown className="w-3.5 h-3.5 text-red-500" />
                <span>{data.downvoteCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ReportNode);
