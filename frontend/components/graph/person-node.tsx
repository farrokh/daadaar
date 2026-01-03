'use client';

import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import type { PersonNodeData } from './types';

function PersonNode({ data }: NodeProps<PersonNodeData>) {
  return (
    <div className="px-4 py-3 bg-white dark:bg-gray-800 border-2 border-purple-500 rounded-lg shadow-lg min-w-[200px] max-w-[300px]">
      <div className="font-semibold text-lg text-gray-900 dark:text-white">
        {data.name}
      </div>
      {data.biography && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
          {data.biography}
        </div>
      )}
    </div>
  );
}

export default memo(PersonNode);

