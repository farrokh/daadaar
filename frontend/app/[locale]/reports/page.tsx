'use client';

import { ReportCard } from '@/components/reports/report-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchApi } from '@/lib/api';
import type { ReportWithDetails } from '@/shared/types';
import { useLocale, useTranslations } from 'next-intl';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

export default function ReportsPage() {
  const locale = useLocale();
  const t = useTranslations('report');
  const commonT = useTranslations('common');
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(
    async (pageNum: number, searchQuery = '') => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchApi<{
          reports: ReportWithDetails[];
          pagination: { totalPages: number };
        }>(`/reports?page=${pageNum}&limit=12&search=${encodeURIComponent(searchQuery)}`);

        if (response.success && response.data) {
          if (pageNum === 1) {
            setReports(response.data.reports);
          } else {
            setReports(prev => [...prev, ...(response.data?.reports || [])]);
          }
          setTotalPages(response.data.pagination.totalPages);
        } else {
          setError(response.error?.message || t('error_fetching'));
        }
      } catch (_err) {
        setError(t('error_fetching'));
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    fetchReports(1, '');
  }, [fetchReports]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReports(1, search);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReports(nextPage, search);
  };

  const isRtl = locale === 'fa';

  return (
    <div
      className={`min-h-screen bg-transparent pt-16 pb-20 px-4 sm:px-6 lg:px-8 ${isRtl ? 'rtl' : 'ltr'}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
              {t('list_title')}
            </h1>
            <p className="text-foreground/60 text-lg max-w-2xl">{t('all_reports')}</p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-grow md:w-80">
              <Input
                type="text"
                placeholder={t('search_placeholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-foreground/5 border-foreground/10 text-foreground placeholder:text-foreground/30 focus:border-accent-primary/50"
              />
            </div>
            <Button
              type="submit"
              className="bg-accent-primary hover:bg-accent-primary/80 text-white font-bold rounded-2xl"
            >
              {commonT('search')}
            </Button>
          </form>
        </div>

        {/* Filters Placeholder (Coming soon) */}
        <div className="flex flex-wrap gap-3 mb-12">
          <span className="text-xs text-foreground/40 uppercase tracking-widest font-bold mb-2 w-full">
            {commonT('filter')}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="bg-foreground/5 border-foreground/10 text-foreground/60 hover:text-foreground hover:bg-foreground/10 rounded-full text-xs"
          >
            {t('filter_by_individual')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-foreground/5 border-foreground/10 text-foreground/60 hover:text-foreground hover:bg-foreground/10 rounded-full text-xs"
          >
            {t('filter_by_organization')}
          </Button>
        </div>

        {/* Content Section */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl mb-12 flex items-center justify-center">
            <p>{error}</p>
          </div>
        )}

        {reports.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {reports.map(report => (
                <div key={report.id} className="h-full">
                  <ReportCard report={report} />
                </div>
              ))}
            </div>

            {page < totalPages && (
              <div className="mt-16 flex justify-center">
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  variant="outline"
                  className="px-8 py-6 rounded-2xl border-foreground/10 text-foreground hover:bg-foreground/5 font-bold transition-all duration-300"
                >
                  {loading ? commonT('loading') : t('load_more')}
                </Button>
              </div>
            )}
          </>
        ) : !loading ? (
          <div className="text-center py-20 bg-foreground/5 border border-dashed border-foreground/10 rounded-3xl">
            <p className="text-foreground/40 text-lg mb-4">{t('no_reports_found')}</p>
            <Button
              variant="ghost"
              onClick={() => {
                setSearch('');
                fetchReports(1, '');
              }}
              className="text-accent-primary font-bold"
            >
              {commonT('refresh')}
            </Button>
          </div>
        ) : null}

        {/* Skeleton Loading State */}
        {loading && reports.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-foreground/5 border border-foreground/10 rounded-2xl h-96 animate-pulse"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
