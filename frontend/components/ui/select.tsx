'use client';

import { Check, ChevronDown } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string | number;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      className = '',
      label,
      error,
      helperText,
      options,
      placeholder,
      value,
      onChange,
      disabled,
      id,
    },
    _ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectId = id || React.useId();

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const selectedOption = options.find(opt => String(opt.value) === String(value));

    const handleSelect = (optionValue: string | number) => {
      onChange?.(String(optionValue));
      setIsOpen(false);
    };

    return (
      <div className={`w-full ${className}`} ref={containerRef}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-foreground/60 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <button
            type="button"
            id={selectId}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`
              w-full rounded-xl border px-4 py-2.5 text-left
              flex items-center justify-between
              transition-all duration-300 ease-out
              liquid-glass bg-white/5 backdrop-blur-lg border-white/10
              hover:bg-white/10 hover:border-white/20
              focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
              disabled:cursor-not-allowed disabled:opacity-50
              ${error ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''}
              ${isOpen ? 'ring-2 ring-primary/50 border-primary/50' : ''}
              ${className}
            `}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
            }
          >
            <span className={!selectedOption ? 'text-foreground/40' : 'text-foreground'}>
              {selectedOption ? selectedOption.label : placeholder || 'Select an option'}
            </span>
            <ChevronDown
              className={`w-4 h-4 opacity-70 transition-transform duration-300 ease-in-out ${
                isOpen
                  ? 'transform rotate-180 text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                  : 'text-foreground/70'
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute z-50 w-full mt-2 p-1.5 rounded-xl border border-white/10 bg-[#020617]/60 backdrop-blur-xl shadow-2xl liquid-glass animate-in fade-in zoom-in-95 duration-200 origin-top">
              <div
                className="max-h-60 overflow-auto custom-scrollbar px-1"
                role="listbox"
                tabIndex={-1}
              >
                {options.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-foreground/50 text-center italic">
                    No options available
                  </div>
                ) : (
                  options.map(option => {
                    const isSelected = String(option.value) === String(value);
                    return (
                      <button
                        key={String(option.value)}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2.5 my-0.5 text-sm rounded-lg text-left transition-all duration-200
                          ${
                            isSelected
                              ? 'bg-primary/20 text-primary font-medium shadow-[0_0_10px_rgba(59,130,246,0.3)] border border-primary/20'
                              : 'text-foreground/80 hover:bg-white/10 hover:text-foreground hover:pl-4 border border-transparent'
                          }
                        `}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span className="truncate mr-2">{option.label}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-primary shrink-0 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-sm text-red-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
export default Select;
