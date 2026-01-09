'use client';

import { fetchApi } from '@/lib/api';
import type { Individual, Organization, ReportWithDetails } from '@/shared/types';
import { Loader2, Search, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SearchResultType = 'report' | 'individual' | 'organization';

interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  url: string;
}

const SEARCH_LIMIT = 3;

const formatReportSubtitle = (
  report: ReportWithDetails & { shareableUuid: string },
  formatter: Intl.DateTimeFormat
) => {
  const segments: string[] = [];
  const currentLocale = formatter.resolvedOptions().locale;
  const isEnglish = currentLocale.startsWith('en');

  const location = isEnglish
    ? report.incidentLocationEn || report.incidentLocation
    : report.incidentLocation || report.incidentLocationEn;

  if (location) {
    segments.push(location);
  }
  if (report.incidentDate) {
    const parsed = new Date(report.incidentDate);
    if (!Number.isNaN(parsed.getTime())) {
      segments.push(formatter.format(parsed));
    }
  }
  return segments.length ? segments.join(' • ') : undefined;
};

const formatIndividualSubtitle = (
  person: Individual & { currentRole?: string | null; currentOrganization?: string | null }
) => {
  const parts: string[] = [];
  if (person.currentRole) {
    parts.push(person.currentRole);
  }
  if (person.currentOrganization) {
    parts.push(person.currentOrganization);
  }
  return parts.length ? parts.join(' • ') : undefined;
};

export function GraphSearchPanel() {
  const graphT = useTranslations('graph');
  const commonT = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partialFailure, setPartialFailure] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const fetchIdRef = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale || 'en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [locale]
  );

  const runSearch = useCallback(
    async (term: string) => {
      const encoded = encodeURIComponent(term);
      const requests = await Promise.allSettled([
        fetchApi<{
          reports: (ReportWithDetails & { shareableUuid: string })[];
        }>(`/reports?page=1&limit=${SEARCH_LIMIT}&search=${encoded}`),
        fetchApi<
          (Individual & {
            shareableUuid: string;
            currentRole?: string | null;
            currentOrganization?: string | null;
          })[]
        >(`/individuals?q=${encoded}&limit=${SEARCH_LIMIT}`),
        fetchApi<(Organization & { shareableUuid: string })[]>(
          `/organizations?q=${encoded}&limit=${SEARCH_LIMIT}`
        ),
      ]);

      const aggregated: SearchResult[] = [];
      let failureCount = 0;

      const [reportsRes, individualsRes, organizationsRes] = requests;
      const currentLocale = formatter.resolvedOptions().locale;
      const isEnglish = currentLocale.startsWith('en');

      if (
        reportsRes.status === 'fulfilled' &&
        reportsRes.value.success &&
        Array.isArray(reportsRes.value.data?.reports)
      ) {
        aggregated.push(
          ...reportsRes.value.data.reports.map(report => ({
            id: `${report.shareableUuid}-report`,
            type: 'report' as SearchResultType,
            title: isEnglish
              ? report.titleEn || report.title || ''
              : report.title || report.titleEn || '',
            subtitle: formatReportSubtitle(report, formatter),
            url: `/reports/${report.shareableUuid}`,
          }))
        );
      } else {
        failureCount += 1;
      }

      if (individualsRes.status === 'fulfilled' && individualsRes.value.success) {
        const individuals = Array.isArray(individualsRes.value.data)
          ? individualsRes.value.data
          : [];
        aggregated.push(
          ...individuals.map(person => ({
            id: `${person.shareableUuid}-individual`,
            type: 'individual' as SearchResultType,
            title: isEnglish
              ? person.fullNameEn || person.fullName || ''
              : person.fullName || person.fullNameEn || '',
            subtitle: formatIndividualSubtitle(person),
            url: `/person/${person.shareableUuid}`,
          }))
        );
      } else {
        failureCount += 1;
      }

      if (organizationsRes.status === 'fulfilled' && organizationsRes.value.success) {
        const organizations = Array.isArray(organizationsRes.value.data)
          ? organizationsRes.value.data
          : [];
        aggregated.push(
          ...organizations.map(org => ({
            id: `${org.shareableUuid}-organization`,
            type: 'organization' as SearchResultType,
            title: isEnglish ? org.nameEn || org.name || '' : org.name || org.nameEn || '',
            subtitle: isEnglish
              ? org.descriptionEn || org.description || undefined
              : org.description || org.descriptionEn || undefined,
            url: `/org/${org.shareableUuid}`,
          }))
        );
      } else {
        failureCount += 1;
      }

      // Track search performed - anonymized to protect user privacy
      if (aggregated.length > 0) {
        try {
          posthog.capture('search_performed', {
            // Anonymized: send query length instead of actual query text
            queryLength: term.length,
            resultsCount: aggregated.length,
            reportResults: aggregated.filter(r => r.type === 'report').length,
            individualResults: aggregated.filter(r => r.type === 'individual').length,
            organizationResults: aggregated.filter(r => r.type === 'organization').length,
            hadPartialFailure: failureCount > 0 && failureCount < 3,
          });
        } catch (error) {
          // Silently fail - analytics should never break search
          console.warn('PostHog capture failed:', error);
        }
      }

      return {
        results: aggregated,
        hadError: failureCount === 3,
        partialFailure: failureCount > 0 && failureCount < 3,
      };
    },
    [formatter]
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      fetchIdRef.current += 1;
      setResults([]);
      setLoading(false);
      setError(null);
      setPartialFailure(false);
      setHighlightedIndex(-1);
      return;
    }

    setError(null);

    const timeoutId = window.setTimeout(() => {
      const currentFetchId = ++fetchIdRef.current;
      setLoading(true);

      runSearch(trimmed)
        .then(({ results: fetched, hadError, partialFailure: isPartial }) => {
          if (currentFetchId !== fetchIdRef.current) return;
          if (hadError) {
            setResults([]);
            setPartialFailure(false);
            setHighlightedIndex(-1);
            setError(graphT('search_error'));
          } else {
            setResults(fetched);
            setError(null);
            setPartialFailure(isPartial);
            setHighlightedIndex(fetched.length > 0 ? 0 : -1);
          }
        })
        .catch(() => {
          if (currentFetchId !== fetchIdRef.current) return;
          setResults([]);
          setPartialFailure(false);
          setHighlightedIndex(-1);
          setError(graphT('search_error'));
        })
        .finally(() => {
          if (currentFetchId !== fetchIdRef.current) return;
          setLoading(false);
        });
    }, 320);

    return () => window.clearTimeout(timeoutId);
  }, [graphT, query, runSearch]);

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
    [router, query]
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
          className="w-full rounded-full border border-foreground/10 bg-white/90 px-12 py-3 text-sm text-foreground outline-none transition focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/40 focus:ring-offset-0"
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
