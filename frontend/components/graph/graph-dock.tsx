// ... imports
import { Button } from '@/components/ui/button';
import { FluidGlassFilters } from '@/components/ui/fluid-glass-filters';
import { cn } from '@/lib/utils';
import { Calendar, Map as MapIcon, Plus, RefreshCw, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';

type ToolType = 'timeline' | 'add' | 'search' | null;

interface GraphDockProps {
  // Timeline Props
  timelineContent?: ReactNode;

  // Add Controls Props
  addContent?: ReactNode;

  // Map Controls
  showMiniMap: boolean;
  onToggleMiniMap: () => void;

  // Global Controls
  onRefresh?: () => void;

  className?: string;
}

export function GraphDock({
  timelineContent,
  addContent,
  showMiniMap,
  onToggleMiniMap,
  onRefresh,
  className,
}: GraphDockProps) {
  const t = useTranslations('graph');

  // Default active tool to 'add' as requested
  const [activeTool, setActiveTool] = useState<ToolType>('add');

  const toggleTool = (tool: ToolType) => {
    setActiveTool(current => (current === tool ? null : tool));
  };

  return (
    <>
      <FluidGlassFilters />
      <div
        className={cn(
          'flex items-center gap-2 liquid-glass bg-white/5 backdrop-blur-lg rounded-full p-2 h-16 transition-all duration-500 ease-out',
          className
        )}
      >
        {/* Left Triggers */}
        <div className="flex items-center gap-2 px-1">
          {/* Refresh Trigger */}
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              className="rounded-full w-12 h-12 hover:bg-transparent hover:scale-110 active:scale-95 transition-all duration-300"
              title={t('refresh')}
            >
              <RefreshCw className="w-5 h-5 text-foreground/60 hover:text-foreground transition-all duration-300" />
            </Button>
          )}

          {/* Map Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMiniMap}
            className="rounded-full w-12 h-12 hover:bg-transparent hover:scale-110 active:scale-95 transition-all duration-300"
            title={showMiniMap ? t('hide_minimap') : t('show_minimap')}
          >
            <MapIcon
              className={cn(
                'w-5 h-5 transition-all duration-300',
                showMiniMap
                  ? 'text-accent-primary drop-shadow-[0_0_8px_rgba(var(--accent-primary),0.5)] scale-110'
                  : 'text-foreground/60 hover:text-foreground'
              )}
            />
          </Button>

          {/* Search Trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleTool('search')}
            className="rounded-full w-12 h-12 hover:bg-transparent hover:scale-110 active:scale-95 transition-all duration-300"
            title={t('search')}
          >
            <Search
              className={cn(
                'w-5 h-5 transition-all duration-300',
                activeTool === 'search'
                  ? 'text-accent-primary drop-shadow-[0_0_8px_rgba(var(--accent-primary),0.5)] scale-110'
                  : 'text-foreground/60 hover:text-foreground'
              )}
            />
          </Button>

          {/* Add Trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleTool('add')}
            className="rounded-full w-12 h-12 hover:bg-transparent hover:scale-110 active:scale-95 transition-all duration-300"
            title={t('add_item')}
          >
            <Plus
              className={cn(
                'w-5 h-5 transition-all duration-300',
                activeTool === 'add'
                  ? 'text-accent-primary drop-shadow-[0_0_8px_rgba(var(--accent-primary),0.5)] scale-110'
                  : 'text-foreground/60 hover:text-foreground'
              )}
            />
          </Button>

          {/* Timeline Trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleTool('timeline')}
            className="rounded-full w-12 h-12 hover:bg-transparent hover:scale-110 active:scale-95 transition-all duration-300"
            title={t('timeline')}
          >
            <Calendar
              className={cn(
                'w-5 h-5 transition-all duration-300',
                activeTool === 'timeline'
                  ? 'text-accent-primary drop-shadow-[0_0_8px_rgba(var(--accent-primary),0.5)] scale-110'
                  : 'text-foreground/60 hover:text-foreground'
              )}
            />
          </Button>
        </div>

        {/* Content Divider */}
        {activeTool && (
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-foreground/20 to-transparent mx-1 animate-in fade-in zoom-in duration-300" />
        )}

        {/* Right Content Area */}
        <div
          className={cn(
            'flex items-center overflow-hidden transition-all duration-500 ease-out',
            activeTool
              ? 'opacity-100 max-w-[800px] translate-x-0'
              : 'opacity-0 max-w-0 -translate-x-4'
          )}
        >
          {activeTool === 'timeline' && timelineContent && (
            <div className="px-3 animate-in slide-in-from-left-4 fade-in duration-300">
              {timelineContent}
            </div>
          )}

          {activeTool === 'add' && addContent && (
            <div className="px-3 animate-in slide-in-from-left-4 fade-in duration-300">
              {addContent}
            </div>
          )}

          {activeTool === 'search' && (
            <div className="px-6 py-2 text-sm text-foreground/60 font-medium animate-in slide-in-from-left-4 fade-in duration-300 whitespace-nowrap">
              {t('search_coming_soon') || 'Search functionality coming soon...'}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
