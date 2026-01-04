'use client';

import { memo } from 'react';
import { Handle, type NodeProps, Position } from 'reactflow';
import type { ReportNodeData } from './types';

function ReportNode({ data }: NodeProps<ReportNodeData>) {
  return (
    <div className="px-4 py-3 bg-background border-2 border-green-500 rounded-lg shadow-lg min-w-[250px] max-w-[350px] relative">
      {/* Target handle (left side - for incoming edges from person) */}
      <Handle type="target" position={Position.Left} className="!bg-green-500 !w-3 !h-3" />
      <div className="font-semibold text-base text-foreground line-clamp-2">
        {data.title}
      </div>
      {data.content && (
        <div className="text-sm text-foreground/60 mt-1 line-clamp-2">
          {data.content}
        </div>
      )}
      <div className="flex gap-4 mt-2 text-xs text-foreground/40">
        <span>👍 {data.upvoteCount}</span>
        <span>👎 {data.downvoteCount}</span>
      </div>
    </div>
  );
}

export default memo(ReportNode);
