'use client';

import { User } from 'lucide-react';
import { memo } from 'react';
import { Handle, type NodeProps, Position } from 'reactflow';
import type { PersonNodeData } from './types';

function PersonNode({ data }: NodeProps<PersonNodeData>) {
  return (
    <div className="group relative min-w-[240px] max-w-[320px]">
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary to-pink-500 rounded-xl opacity-20 group-hover:opacity-60 blur transition duration-500" />

      {/* Card Content */}
      <div className="relative px-5 py-4 bg-background/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl transition-transform hover:-translate-y-1">
        {/* Source handle (right side - for outgoing edges to reports) */}
        <Handle type="source" position={Position.Right} className="!w-3 !h-3 !opacity-0" />

        {/* Target handle (left side - for incoming edges from organization) */}
        <Handle type="target" position={Position.Left} className="!w-3 !h-3 !opacity-0" />

        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-secondary/10 rounded-lg shrink-0">
            <User className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <div className="font-bold text-base text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
              {data.name}
            </div>
            {data.biography && (
              <div className="text-xs text-foreground/50 mt-1.5 line-clamp-2 leading-relaxed">
                {data.biography}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PersonNode);
