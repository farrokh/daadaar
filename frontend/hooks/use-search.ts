'use client';

import { fetchApi } from '@/lib/api';
import type { Individual, Organization, ReportWithDetails } from '@/shared/types';
import { useCallback, useMemo, useState } from 'react';

export type SearchResultType = 'report' | 'individual' | 'organization';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  url: string;
}

const SEARCH_LIMIT = 5;

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

export function useSearch(locale: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partialFailure, setPartialFailure] = useState(false);

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
      if (!term.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);
      setPartialFailure(false);

      try {
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
        let successCount = 0;

        const [reportsRes, individualsRes, organizationsRes] = requests;
        const currentLocale = formatter.resolvedOptions().locale;
        const isEnglish = currentLocale.startsWith('en');

        if (
          reportsRes.status === 'fulfilled' &&
          reportsRes.value.success &&
          Array.isArray(reportsRes.value.data?.reports)
        ) {
          successCount++;
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
        }

        if (individualsRes.status === 'fulfilled' && individualsRes.value.success) {
          successCount++;
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
        }

        if (organizationsRes.status === 'fulfilled' && organizationsRes.value.success) {
          successCount++;
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
        }

        if (successCount === 0 && term.trim().length > 0) {
          setError('Search failed');
        }

        if (successCount > 0 && successCount < 3) {
          setPartialFailure(true);
        } else if (successCount === 3) {
          setPartialFailure(false);
        }

        setResults(aggregated);
      } catch (err) {
        setError('Search encountered an error');
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    },
    [formatter]
  );

  return {
    results,
    loading,
    error,
    partialFailure,
    runSearch,
    setResults,
    setError,
    setPartialFailure,
  };
}
