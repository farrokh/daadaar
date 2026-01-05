'use client';

import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface TimelineFilterProps {
  minYear: number;
  maxYear: number;
  selectedRange: [number, number];
  onRangeChange: (range: [number, number]) => void;
  isVisible: boolean;
}

export function TimelineFilter({
  minYear,
  maxYear,
  selectedRange,
  onRangeChange,
  isVisible,
  compact = false,
  className,
}: TimelineFilterProps & { compact?: boolean; className?: string }) {
  const t = useTranslations('graph');
  const [localRange, setLocalRange] = useState<[number, number]>(selectedRange);

  useEffect(() => {
    setLocalRange(selectedRange);
  }, [selectedRange]);

  if (!isVisible || minYear === maxYear) return null;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseInt(e.target.value, 10);
    const newRange: [number, number] = [Math.min(val, localRange[1]), localRange[1]];
    setLocalRange(newRange);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseInt(e.target.value, 10);
    const newRange: [number, number] = [localRange[0], Math.max(val, localRange[0])];
    setLocalRange(newRange);
  };

  const handleMouseUp = () => {
    onRangeChange(localRange);
  };

  const resetAllTime = () => {
    onRangeChange([minYear, maxYear]);
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-4 w-64 md:w-80 ${className || ''}`}>
        <span className="text-xs font-mono font-medium text-foreground/60 whitespace-nowrap hidden md:block">
          {localRange[0]}
        </span>

        <div className="relative h-6 flex-1 flex items-center">
          {/* Track */}
          <div className="absolute left-0 right-0 h-1 bg-foreground/10 rounded-full" />
          {/* Active Range */}
          <div
            className="absolute h-1 bg-primary rounded-full"
            style={{
              left: `calc( ${((localRange[0] - minYear) / (maxYear - minYear)) * 100}% )`,
              right: `calc( ${(1 - (localRange[1] - minYear) / (maxYear - minYear)) * 100}% )`,
            }}
          />
          {/* Inputs */}
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={localRange[0]}
            onChange={handleMinChange}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            className="absolute w-full appearance-none bg-transparent pointer-events-none z-20 
              [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none 
              [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
              [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary 
              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm"
          />
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={localRange[1]}
            onChange={handleMaxChange}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            className="absolute w-full appearance-none bg-transparent pointer-events-none z-30
              [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none 
              [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
              [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary 
              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm"
          />
        </div>

        <span className="text-xs font-mono font-medium text-foreground/60 whitespace-nowrap hidden md:block">
          {localRange[1]}
        </span>
      </div>
    );
  }

  // Original Card Layout (preserved but wrapped in className logic removal if needed, but for now we keep it as fallback)
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-background/60 backdrop-blur-xl px-6 py-5 rounded-3xl shadow-2xl border border-white/10 z-10 transition-all hover:bg-background/80 group">
      {/* ... existing card content ... */}
      {/* I will only replace the return block and keep the logic above */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-primary/10 rounded-xl text-accent-primary group-hover:scale-110 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground/90">
            {t('timeline')}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono bg-accent-primary/5 text-accent-primary border border-accent-primary/20 px-3 py-1 rounded-full font-medium shadow-sm">
            {localRange[0]} — {localRange[1]}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetAllTime}
            className="h-7 text-xs px-3 hover:bg-accent-primary/10 hover:text-accent-primary rounded-full transition-colors"
          >
            {t('all_time')}
          </Button>
        </div>
      </div>

      <div className="relative h-6 flex items-center mb-1">
        {/* Sliders Container with its own relative positioning for internal alignment */}
        <div className="relative w-full h-full flex items-center mx-2">
          {/* Track Background */}
          <div className="absolute left-0 right-0 h-1.5 bg-foreground/5 rounded-full" />

          {/* Active range highlight */}
          <div
            className="absolute h-1.5 bg-accent-primary rounded-full transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            style={{
              left: `calc( ${((localRange[0] - minYear) / (maxYear - minYear)) * 100}% )`,
              right: `calc( ${(1 - (localRange[1] - minYear) / (maxYear - minYear)) * 100}% )`,
            }}
          />

          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={localRange[0]}
            onChange={handleMinChange}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            className="absolute w-full appearance-none bg-transparent pointer-events-none z-20 
              [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none 
              [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full 
              [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent-primary 
              [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
          />
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={localRange[1]}
            onChange={handleMaxChange}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            className="absolute w-full appearance-none bg-transparent pointer-events-none z-30
              [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none 
              [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full 
              [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent-primary 
              [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
          />
        </div>
      </div>

      <div className="flex justify-between mt-3 px-1 text-[10px] text-foreground/40 font-medium tracking-wider uppercase">
        <span>{minYear}</span>
        <div className="flex gap-8 opacity-50">
          {/* Add some intermediate markers if range is large */}
          {maxYear - minYear > 4 && (
            <>
              <span>{Math.floor(minYear + (maxYear - minYear) * 0.25)}</span>
              <span>{Math.floor(minYear + (maxYear - minYear) * 0.5)}</span>
              <span>{Math.floor(minYear + (maxYear - minYear) * 0.75)}</span>
            </>
          )}
        </div>
        <span>{maxYear}</span>
      </div>
    </div>
  );
}

export default TimelineFilter;
