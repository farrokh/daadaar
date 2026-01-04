'use client';

import { memo } from 'react';
import { Handle, type NodeProps, Position } from 'reactflow';
import type { PersonNodeData } from './types';

function PersonNode({ data }: NodeProps<PersonNodeData>) {
  return (
    <div className="px-4 py-3 bg-background border-2 border-purple-500 rounded-lg shadow-lg min-w-[200px] max-w-[300px] relative">
      {/* Source handle (right side - for outgoing edges to reports) */}
      <Handle type="source" position={Position.Right} className="!bg-purple-500 !w-3 !h-3" />
      {/* Target handle (left side - for incoming edges from organization) */}
      <Handle type="target" position={Position.Left} className="!bg-purple-500 !w-3 !h-3" />
      <div className="font-semibold text-lg text-foreground">{data.name}</div>
      {data.biography && (
        <div className="text-sm text-foreground/60 mt-1 line-clamp-2">
          {data.biography}
        </div>
      )}
    </div>
  );
}

export default memo(PersonNode);
