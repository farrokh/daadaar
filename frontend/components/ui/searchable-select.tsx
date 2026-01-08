'use client';

import { Check, ChevronDown, Search, X } from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SearchableSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  value?: string | number | null;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  options: SelectOption[];
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  emptyMessage?: string;
}

const SearchableSelect = React.memo(
  React.forwardRef<HTMLDivElement, SearchableSelectProps>(
    (
      {
        className = '',
        label,
        error,
        helperText,
        placeholder,
        value,
        onChange,
        onSearch,
        options,
        loading = false,
        disabled,
        id,
        emptyMessage = 'No results found',
      },
      _ref
    ) => {
      const [isOpen, setIsOpen] = useState(false);
      const [searchTerm, setSearchTerm] = useState('');
      const containerRef = useRef<HTMLDivElement>(null);
      const dropdownRef = useRef<HTMLDivElement>(null);
      const buttonRef = useRef<HTMLButtonElement>(null);
      const inputRef = useRef<HTMLInputElement>(null);
      const selectId = id || React.useId();
      const listId = `${selectId}-list`;

      // Debounce search
      useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => {
          onSearch?.(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
      }, [searchTerm, onSearch, isOpen]);

      // Handle outside click
      useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
          if (!containerRef.current?.contains(event.target as Node)) {
            setIsOpen(false);
          }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, [isOpen]);

      // Focus input when opened
      useEffect(() => {
        if (isOpen && inputRef.current) {
          setTimeout(() => inputRef.current?.focus(), 10);
        }
      }, [isOpen]);

      const handleSelect = useCallback(
        (optionValue: string | number) => {
          onChange?.(String(optionValue));
          setIsOpen(false);
          setSearchTerm('');
        },
        [onChange]
      );

      const handleClear = useCallback(
        (e: React.MouseEvent) => {
          e.stopPropagation();
          onChange?.('');
        },
        [onChange]
      );

      const handleToggle = useCallback(() => {
        if (!disabled) {
          setIsOpen(prev => !prev);
        }
      }, [disabled]);

      const selectedOption = options.find(opt => String(opt.value) === String(value));

      return (
        <div className={`w-full relative ${isOpen ? 'mb-80' : ''}`} ref={containerRef}>
          {label && (
            <label
              htmlFor={selectId}
              className="block text-sm font-medium text-foreground/60 mb-1.5"
            >
              {label}
            </label>
          )}
          <div className="relative">
            <button
              ref={buttonRef}
              type="button"
              id={selectId}
              onClick={handleToggle}
              disabled={disabled}
              className={`
              w-full rounded-xl border px-4 py-2.5 text-left
              flex items-center justify-between
              transition-all duration-300 ease-out
              liquid-glass bg-black/5 dark:bg-white/5 backdrop-blur-lg border-black/5 dark:border-white/10
              hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/20
              focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
              disabled:cursor-not-allowed disabled:opacity-50
              ${error ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''}
              ${isOpen ? 'ring-2 ring-primary/50 border-primary/50' : ''}
              ${className}
            `}
              aria-expanded={isOpen}
              aria-controls={listId}
              aria-invalid={error ? 'true' : 'false'}
            >
              <span
                className={
                  !selectedOption && !value ? 'text-foreground/40' : 'text-foreground truncate'
                }
              >
                {selectedOption
                  ? selectedOption.label
                  : value || placeholder || 'Select an option'}
              </span>
              <div className="flex items-center gap-1">
                {value && !disabled && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-0.5 rounded-full hover:bg-foreground/10 text-foreground/40 hover:text-foreground transition-colors mr-1"
                    aria-label="Clear selection"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <ChevronDown
                  className={`w-4 h-4 opacity-70 transition-transform duration-300 ease-in-out ${
                    isOpen
                      ? 'transform rotate-180 text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                      : 'text-foreground/70'
                  }`}
                />
              </div>
            </button>

            {isOpen && (
              <div
                ref={dropdownRef}
                className="absolute z-[100] w-full mt-2 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#020617] backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 origin-top flex flex-col overflow-hidden"
              >
                {/* Search Input */}
                <div className="p-2 border-b border-foreground/5 bg-foreground/[0.02]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40" />
                    <input
                      ref={inputRef}
                      type="text"
                      className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-foreground/10 rounded-lg focus:border-primary/30 focus:ring-1 focus:ring-primary/30 focus:outline-none transition-all placeholder:text-foreground/30"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                </div>

                {/* Options List */}
                <div className="relative max-h-60 overflow-y-auto custom-scrollbar" id={listId}>
                  <ul className="p-1 pb-20">
                    {loading && options.length === 0 ? (
                      <li className="px-4 py-8 text-sm text-foreground/50 text-center flex flex-col items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-primary/50 border-t-transparent rounded-full animate-spin" />
                        Loading...
                      </li>
                    ) : options.length === 0 ? (
                      <li className="px-4 py-8 text-sm text-foreground/40 text-center italic">
                        {emptyMessage}
                      </li>
                    ) : (
                      <>
                        {loading && (
                          <li className="px-2 py-1.5 text-xs text-center text-primary/70 animate-pulse bg-primary/5 mb-1 rounded">
                            Updating results...
                          </li>
                        )}
                        {options.map(option => {
                          const isSelected = String(option.value) === String(value);
                          return (
                            <li key={String(option.value)}>
                              <button
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={`
                                w-full flex items-center justify-between px-3 py-2.5 my-0.5 text-sm rounded-lg text-left transition-all duration-200
                                ${
                                  isSelected
                                    ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                                    : 'text-foreground/80 hover:bg-foreground/5 hover:text-foreground border border-transparent'
                                }
                              `}
                                aria-selected={isSelected}
                              >
                                <span className="truncate mr-2">{option.label}</span>
                                {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                              </button>
                            </li>
                          );
                        })}
                      </>
                    )}
                  </ul>
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
  )
);

SearchableSelect.displayName = 'SearchableSelect';

export { SearchableSelect };
