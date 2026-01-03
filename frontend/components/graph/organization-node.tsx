'use client';

import { memo } from 'react';
import { Handle, type NodeProps, Position } from 'reactflow';
import type { OrganizationNodeData } from './types';

/**
 * Render a styled organization node for React Flow that shows a name and an optional description.
 *
 * @param data - Node data containing `name` and optional `description`. `name` is rendered prominently; `description`, if present, is displayed below and clamped to two lines.
 * @returns The JSX element for an organization node including left (target) and right (source) handles.
 */
function OrganizationNode({ data }: NodeProps<OrganizationNodeData>) {
  return (
    <div className="px-4 py-3 bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-lg shadow-lg min-w-[200px] max-w-[300px] relative">
      {/* Source handle (right side - for outgoing edges to children) */}
      <Handle type="source" position={Position.Right} className="!bg-blue-500 !w-3 !h-3" />
      {/* Target handle (left side - for incoming edges from parent) */}
      <Handle type="target" position={Position.Left} className="!bg-blue-500 !w-3 !h-3" />
      <div className="font-semibold text-lg text-gray-900 dark:text-white">{data.name}</div>
      {data.description && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
          {data.description}
        </div>
      )}
    </div>
  );
}

export default memo(OrganizationNode);