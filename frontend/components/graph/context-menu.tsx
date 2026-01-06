'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ContextMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  className?: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  className?: string;
}

export function ContextMenu({ x, y, items, onClose, className }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ top: y, left: x }}
      className={cn(
        'absolute z-50 min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-background/80 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200',
        className
      )}
    >
      <div className="p-1.5 flex flex-col gap-0.5">
        {items.map(item => (
          <button
            key={item.label}
            type="button"
            onClick={e => {
              e.stopPropagation();
              item.onClick();
              onClose();
            }}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left text-foreground/80 hover:text-foreground hover:bg-white/10',
              item.className
            )}
          >
            {item.icon && <item.icon className="w-4 h-4 text-foreground/60" />}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
