'use client';

import { format } from 'date-fns';
import { enUS, faIR } from 'date-fns/locale';
import {
  Archive,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flag,
  ShieldAlert,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { ContentReport, ContentReportStatus } from '@/shared/types';

interface ContentReportsResponse {
  reports: (ContentReport & {
    reporter?: { id: number; username: string; displayName: string | null };
    reviewer?: { id: number; username: string; displayName: string | null };
    contentDetails?: { title: string; subtitle?: string } | null;
  })[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function ContentReportsList() {
  const t = useTranslations('admin');
  const commonT = useTranslations('common');
  const locale = useLocale();
  const dateLocale = locale === 'fa' ? faIR : enUS;

  const [reports, setReports] = useState<ContentReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      limit: '20',
      ...(statusFilter && { status: statusFilter }),
    });

    const response = await fetchApi<ContentReportsResponse>(
      `/admin/content-reports?${query.toString()}`
    );
    if (response.success && response.data) {
      setReports(response.data);
    }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdateStatus = async (id: number, status: ContentReportStatus) => {
    const response = await fetchApi(`/admin/content-reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (response.success) {
      fetchReports();
    }
  };

  const getStatusColor = (status: ContentReportStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'reviewing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'resolved':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'dismissed':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading && !reports) {
    return <div className="p-12 text-center text-foreground/40 italic">{commonT('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-medium tracking-tight flex items-center gap-2">
          <Flag className="w-5 h-5 text-foreground/40" />
          {t('content_reports_title')}
        </h2>

        <div className="flex gap-1 p-1 bg-foreground/5 rounded-lg">
          {['', 'pending', 'reviewing', 'resolved', 'dismissed'].map(s => (
            <button
              type="button"
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                statusFilter === s
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
              )}
            >
              {s === '' ? t('all') : t(`status_${s}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-foreground/[0.05] overflow-x-auto">
        <table className="w-full text-left rtl:text-right min-w-[1000px]">
          <thead className="text-xs uppercase bg-foreground/[0.02] text-foreground/50 font-medium">
            <tr>
              <th className="px-6 py-3 tracking-wider">{t('col_content')}</th>
              <th className="px-6 py-3 tracking-wider">{t('col_reason')}</th>
              <th className="px-6 py-3 tracking-wider">{t('col_reporter')}</th>
              <th className="px-6 py-3 tracking-wider">{t('col_date')}</th>
              <th className="px-6 py-3 tracking-wider">{t('col_status')}</th>
              <th className="px-6 py-3 text-right tracking-wider w-[120px]">{t('col_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/[0.05] text-sm">
            {reports?.reports.map(report => (
              <tr key={report.id} className="hover:bg-foreground/[0.01] transition-colors group">
                <td className="px-6 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground/90">
                      {report.contentDetails?.title || `${report.contentType} #${report.contentId}`}
                    </span>
                    <div className="flex items-center gap-2 text-xs opacity-50">
                      <span className="font-mono bg-foreground/5 px-1.5 rounded uppercase text-[10px]">
                        {report.contentType} #{report.contentId}
                      </span>
                      {report.contentDetails?.subtitle && (
                        <span className="truncate max-w-[150px]">
                          {report.contentDetails.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <div className="font-medium text-foreground/80">
                    {t(`reason_${report.reason}`)}
                  </div>
                  {report.description && (
                    <div
                      className="text-xs text-foreground/50 truncate max-w-[200px]"
                      title={report.description}
                    >
                      {report.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-3">
                  {report.reporter ? (
                    <div className="flex flex-col">
                      <span className="text-foreground/80 text-sm">
                        {report.reporter.displayName || report.reporter.username}
                      </span>
                      <span className="text-[10px] text-foreground/40">Registered User</span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-foreground/60">{commonT('anonymous')}</span>
                      <span className="text-[10px] text-foreground/30 font-mono">
                        {report.reporterSessionId?.slice(0, 8)}...
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-3 text-foreground/60 text-xs text-nowrap">
                  {format(new Date(report.createdAt), 'MMM d, yyyy', { locale: dateLocale })}
                </td>
                <td className="px-6 py-3">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit',
                      getStatusColor(report.status)
                    )}
                  >
                    {report.status === 'resolved' && <CheckCircle className="w-3 h-3" />}
                    {report.status === 'dismissed' && <Archive className="w-3 h-3" />}
                    {report.status === 'reviewing' && <Eye className="w-3 h-3" />}
                    {report.status === 'pending' && <ShieldAlert className="w-3 h-3" />}
                    {t(`status_${report.status}`)}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {report.status === 'pending' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-foreground/50 hover:text-blue-500 hover:bg-blue-500/10"
                        title={t('action_review')}
                        onClick={() => handleUpdateStatus(report.id, 'reviewing')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    {(report.status === 'pending' || report.status === 'reviewing') && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-foreground/50 hover:text-green-500 hover:bg-green-500/10"
                          title={t('action_resolve')}
                          onClick={() => handleUpdateStatus(report.id, 'resolved')}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-foreground/50 hover:text-foreground hover:bg-foreground/5"
                          title={t('action_dismiss')}
                          onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {reports?.reports.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-foreground/40 italic">
                  {t('no_reports_found')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {reports && reports.pagination.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <span className="text-foreground/40 mr-2">
            {t('pagination_page', { current: page, total: reports.pagination.totalPages })}
          </span>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={page === reports.pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
