'use client';

import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { ContentReport, ContentReportStatus } from '@/shared/types';
import { format } from 'date-fns';
import { enUS, faIR } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

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
    return <div className="p-8 text-center text-foreground/50">{commonT('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('content_reports_title')}</h2>

        <div className="flex gap-2">
          {['', 'pending', 'reviewing', 'resolved', 'dismissed'].map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className="capitalize"
            >
              {s === '' ? t('all') : t(`status_${s}`)}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left rtl:text-right">
          <thead className="text-xs uppercase bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4">{t('col_content')}</th>
              <th className="px-6 py-4">{t('col_reason')}</th>
              <th className="px-6 py-4">{t('col_reporter')}</th>
              <th className="px-6 py-4">{t('col_date')}</th>
              <th className="px-6 py-4">{t('col_status')}</th>
              <th className="px-6 py-4">{t('col_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-sm">
            {reports?.reports.map(report => (
              <tr key={report.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm">
                      {report.contentDetails?.title || `${report.contentType} #${report.contentId}`}
                    </span>
                    <div className="flex items-center gap-2 text-xs opacity-50">
                      <span className="font-mono bg-white/5 px-1.5 rounded uppercase text-[10px]">
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
                <td className="px-6 py-4">
                  <div className="font-medium">{t(`reason_${report.reason}`)}</div>
                  {report.description && (
                    <div
                      className="text-xs opacity-50 truncate max-w-[200px]"
                      title={report.description}
                    >
                      {report.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {report.reporter ? (
                    <div className="flex flex-col">
                      <span>{report.reporter.displayName || report.reporter.username}</span>
                      <span className="text-[10px] opacity-40">Registered User</span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="opacity-60">{commonT('anonymous')}</span>
                      <span className="text-[10px] opacity-30 font-mono">
                        {report.reporterSessionId?.slice(0, 8)}...
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 opacity-70">
                  {format(new Date(report.createdAt), 'PPp', { locale: dateLocale })}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                      getStatusColor(report.status)
                    )}
                  >
                    {t(`status_${report.status}`)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {report.status === 'pending' && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleUpdateStatus(report.id, 'reviewing')}
                      >
                        {t('action_review')}
                      </Button>
                    )}
                    {(report.status === 'pending' || report.status === 'reviewing') && (
                      <>
                        <Button
                          size="xs"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleUpdateStatus(report.id, 'resolved')}
                        >
                          {t('action_resolve')}
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                        >
                          {t('action_dismiss')}
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {reports?.reports.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center opacity-50 italic">
                  {t('no_reports_found')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {reports && reports.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            {commonT('previous')}
          </Button>
          <span className="text-sm opacity-50">
            {t('pagination_page', { current: page, total: reports.pagination.totalPages })}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page === reports.pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            {commonT('next')}
          </Button>
        </div>
      )}
    </div>
  );
}
