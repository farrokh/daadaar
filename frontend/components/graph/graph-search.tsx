'use client';

import { fetchApi } from '@/lib/api';
import type { Individual, Organization, ReportWithDetails } from '@/shared/types';
import { Loader2, Search, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type SearchResult, type SearchResultType, useSearch } from '@/hooks/use-search';

export function GraphSearchPanel() {
  const graphT = useTranslations('graph');
  const commonT = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    results,
    loading,
    error,
    partialFailure,
    runSearch,
    setResults,
    setError,
    setPartialFailure,
  } = useSearch(locale);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setHighlightedIndex(-1);
      return;
    }

    const timeoutId = setTimeout(() => {
      runSearch(trimmed);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, runSearch, setResults]);

  useEffect(() => {
    if (results.length > 0) {
      setHighlightedIndex(0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [results]);

  const handleSelect = useCallback(
    (url: string, result?: SearchResult) => {
      // Track search result selection - wrapped to prevent navigation failure
      if (result) {
        try {
          posthog.capture('search_result_selected', {
            queryLength: query.length, // Anonymized query
            resultType: result.type,
            resultUrl: result.url,
            // Removed: resultTitle (PII - contains names)
          });
        } catch (error) {
          // Silently fail - analytics should never break navigation
          console.warn('PostHog capture failed:', error);
        }
      }

      // Navigation always succeeds regardless of analytics
      router.push(url);
      setQuery('');
      setResults([]);
      setError(null);
      setHighlightedIndex(-1);
      setPartialFailure(false);
    },
    [router, query, setResults, setError, setPartialFailure]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex(prev => (results.length > 0 ? (prev + 1) % results.length : -1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex(prev =>
        results.length > 0 ? (prev - 1 + results.length) % results.length : -1
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selected = results[highlightedIndex] || results[0];
      if (selected) {
        handleSelect(selected.url, selected);
      }
    } else if (event.key === 'Escape') {
      setResults([]);
      setError(null);
      setHighlightedIndex(-1);
    }
  };

  const typeLabels: Record<SearchResultType, string> = {
    report: graphT('reports'),
    individual: graphT('people'),
    organization: graphT('organizations'),
  };

  const showDropdown = Boolean(query.trim()) || loading;
  const inputId = 'graph-search-input';
  const getItemId = (index: number) => `search-item-${index}`;

  return (
    <div className="w-[420px] min-w-[280px] relative">
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-4 flex items-center text-foreground/50 pointer-events-none">
          <Search className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={query}
          role="combobox"
          onChange={event => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={graphT('search_placeholder')}
          className="w-full rounded-full border border-foreground/10 bg-background/80 backdrop-blur-xl px-12 py-3 text-sm text-foreground placeholder:text-foreground/50 outline-none transition focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/40 focus:ring-offset-0"
          aria-label={graphT('search')}
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-controls="search-results-list"
          aria-activedescendant={highlightedIndex >= 0 ? getItemId(highlightedIndex) : undefined}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setError(null);
              setHighlightedIndex(-1);
              setPartialFailure(false);
            }}
            className="absolute inset-y-0 right-4 flex items-center justify-center text-foreground/50 hover:text-foreground transition"
            aria-label={commonT('close')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 bottom-full z-40 mb-3 rounded-3xl border border-foreground/10 bg-background/95 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div
            id="search-results-list"
            // biome-ignore lint/a11y/useSemanticElements: Custom listbox implementation not suitable for native select
            role="listbox"
            tabIndex={-1}
            className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-foreground/5"
          >
            {loading && (
              <div className="flex items-center gap-2 px-4 py-3 text-xs text-foreground/40">
                <Loader2 className="w-4 h-4 animate-spin" />
                {commonT('loading')}
              </div>
            )}

            {error && !loading && (
              <div className="px-4 py-3 text-xs text-destructive font-semibold" role="alert">
                {error}
              </div>
            )}

            {partialFailure && !loading && !error && (
              <div className="px-4 py-2 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-500 border-b border-foreground/5 px-4 font-medium">
                {graphT('search_partial_error')}
              </div>
            )}

            {!loading && !error && results.length === 0 && (
              <div className="px-4 py-3 text-xs text-foreground/50 text-center">
                {graphT('search_no_results')}
              </div>
            )}

            {results.map((result, index) => (
              <div key={result.id}>
                <button
                  id={getItemId(index)}
                  type="button"
                  // biome-ignore lint/a11y/useSemanticElements: Interactive option using button for best accessibility in custom control
                  role="option"
                  aria-selected={index === highlightedIndex}
                  tabIndex={-1}
                  onClick={() => handleSelect(result.url, result)}
                  className={`w-full px-4 py-3 text-left transition ${
                    index === highlightedIndex ? 'bg-foreground/10' : 'hover:bg-foreground/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-foreground truncate">{result.title}</p>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
                      {typeLabels[result.type]}
                    </span>
                  </div>
                  {result.subtitle && (
                    <p className="mt-1 text-[11px] text-foreground/60 truncate">
                      {result.subtitle}
                    </p>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
