'use client';

import { ReportCard } from '@/components/reports/report-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchApi } from '@/lib/api';
import type { ReportWithDetails } from '@/shared/types';
import { Filter, Loader2, RefreshCw, Search } from 'lucide-react';
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
      className={`min-h-[calc(100vh-4rem)] relative bg-background pt-12 pb-20 px-4 sm:px-6 lg:px-8 ${isRtl ? 'rtl' : 'ltr'}`}
    >
      {/* Decorative Background Elements */}

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Modern Header Section */}
        <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-foreground bg-clip-text">
              {t('list_title')}
            </h1>
            <p className="text-xl text-foreground/60 max-w-2xl mx-auto leading-relaxed">
              {t('all_reports')}
            </p>
          </div>

          {/* Slick Search Bar */}
          {/* Slick Search Bar */}
          <form onSubmit={handleSearch} className="w-full max-w-2xl relative group">
            <div className="relative flex items-center bg-foreground/5 backdrop-blur-md border border-foreground/10 p-1 rounded-full transition-all duration-300 focus-within:ring-1 focus-within:ring-foreground/20 h-16">
              <div className="pl-6 pr-4 text-foreground/40 transition-colors group-focus-within:text-foreground/70">
                <Search className="w-6 h-6" />
              </div>
              <Input
                type="text"
                placeholder={t('search_placeholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-grow bg-transparent border-none text-lg text-foreground placeholder:text-foreground/30 focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-full font-light"
              />
              <Button
                type="submit"
                variant="ghost"
                className="rounded-full px-8 h-12 text-foreground/70 hover:text-foreground hover:bg-transparent hover:scale-105 active:scale-95 transition-all duration-300 mr-2 ml-1.5"
              >
                {commonT('search')}
              </Button>
            </div>
          </form>

          {/* Modern Filters */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-foreground/5 rounded-full text-xs font-bold text-foreground/40 uppercase tracking-widest mr-2">
              <Filter className="w-3 h-3" />
              {commonT('filter')}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-dashed border-foreground/20 text-foreground/60 hover:border-accent-primary hover:text-accent-primary hover:bg-accent-primary/5 transition-all"
            >
              {t('filter_by_individual')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-dashed border-foreground/20 text-foreground/60 hover:border-accent-secondary hover:text-accent-secondary hover:bg-accent-secondary/5 transition-all"
            >
              {t('filter_by_organization')}
            </Button>
          </div>
        </div>

        {/* Content Section */}
        {error && (
          <div className="bg-red-500/5 border border-red-500/10 text-red-500 p-8 rounded-3xl text-center backdrop-blur-sm">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {reports.length > 0 ? (
          <div className="space-y-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {reports.map((report, index) => (
                <div
                  key={report.id}
                  className="h-full"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ReportCard report={report} />
                </div>
              ))}
            </div>

            {page < totalPages && (
              <div className="flex justify-center pb-8">
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  variant="outline"
                  size="lg"
                  className="group relative px-10 py-6 rounded-full overflow-hidden border-foreground/10 text-foreground font-bold hover:border-transparent transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? commonT('loading') : t('load_more')}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
              </div>
            )}
          </div>
        ) : !loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 bg-foreground/5 rounded-full flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-foreground/20" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{t('no_reports_found')}</h3>
            <p className="text-foreground/40 mb-8 max-w-sm">
              We couldn't find any reports matching your search criteria. Try different keywords.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                fetchReports(1, '');
              }}
              className="gap-2 rounded-xl"
            >
              <RefreshCw className="w-4 h-4" />
              {commonT('refresh')}
            </Button>
          </div>
        ) : null}

        {/* Enhanced Skeleton Loading State */}
        {loading && reports.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-card-bg border border-card-border rounded-3xl h-[400px] animate-pulse flex flex-col p-6"
              >
                <div className="w-full h-48 bg-foreground/5 rounded-2xl mb-6" />
                <div className="h-4 bg-foreground/5 rounded w-1/4 mb-4" />
                <div className="h-8 bg-foreground/5 rounded w-3/4 mb-4" />
                <div className="h-4 bg-foreground/5 rounded w-full mb-2" />
                <div className="h-4 bg-foreground/5 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
