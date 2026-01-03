'use client';

import { memo } from 'react';
import { Handle, type NodeProps, Position } from 'reactflow';
import type { ReportNodeData } from './types';

/**
 * Renders a React Flow node representing a report with title, optional content, and vote counts.
 *
 * @param data - Node data containing the report fields used to populate the node:
 *               `title` (string), optional `content` (string), `upvoteCount` (number), and `downvoteCount` (number).
 * @returns A JSX element styled as a Report node including a left-side target handle, title, optional content, and upvote/downvote counts.
 */
function ReportNode({ data }: NodeProps<ReportNodeData>) {
  return (
    <div className="px-4 py-3 bg-white dark:bg-gray-800 border-2 border-green-500 rounded-lg shadow-lg min-w-[250px] max-w-[350px] relative">
      {/* Target handle (left side - for incoming edges from person) */}
      <Handle type="target" position={Position.Left} className="!bg-green-500 !w-3 !h-3" />
      <div className="font-semibold text-base text-gray-900 dark:text-white line-clamp-2">
        {data.title}
      </div>
      {data.content && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
          {data.content}
        </div>
      )}
      <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>👍 {data.upvoteCount}</span>
        <span>👎 {data.downvoteCount}</span>
      </div>
    </div>
  );
}

export default memo(ReportNode);