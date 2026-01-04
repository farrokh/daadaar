'use client';

import { Button } from '@/components/ui/button';
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
}: TimelineFilterProps) {
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

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-background/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow-2xl border border-foreground/10 z-10 transition-all hover:bg-background/90">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-accent-primary/10 rounded-lg">
            <svg
              className="w-4 h-4 text-accent-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-label="Clock icon"
              role="img"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold tracking-tight">{t('timeline')}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono bg-accent-primary/10 text-accent-primary px-2.5 py-1 rounded-full border border-accent-primary/20">
            {localRange[0]} — {localRange[1]}
          </span>
          <Button variant="secondary" size="sm" onClick={resetAllTime} className="h-7 text-xs px-3">
            {t('all_time')}
          </Button>
        </div>
      </div>

      <div className="relative h-6 flex items-center">
        {/* Sliders Container with its own relative positioning for internal alignment */}
        <div className="relative w-full h-full flex items-center mx-2">
          {/* Track Background */}
          <div className="absolute left-0 right-0 h-1.5 bg-foreground/10 rounded-full" />

          {/* Active range highlight */}
          <div
            className="absolute h-1.5 bg-accent-primary rounded-full transition-all shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            style={{
              left: `calc(${((localRange[0] - minYear) / (maxYear - minYear)) * 100}% + ${
                10 - ((localRange[0] - minYear) / (maxYear - minYear)) * 20
              }px)`,
              right: `calc(${
                (1 - (localRange[1] - minYear) / (maxYear - minYear)) * 100
              }% + ${10 - (1 - (localRange[1] - minYear) / (maxYear - minYear)) * 20}px)`,
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

      <div className="flex justify-between mt-3 px-1 text-[10px] text-foreground/40 font-medium tracking-wider">
        <span>{minYear}</span>
        <div className="flex gap-4">
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
