'use client';

import { format } from 'date-fns';
import { enUS, faIR } from 'date-fns/locale';
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  RotateCw,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { AiVerification } from '@/shared/types';

interface ReportWithAI {
  id: number;
  title: string;
  createdAt: string;
  aiVerification: AiVerification | null;
  user: {
    username: string;
    displayName: string | null;
  } | null;
}

interface ReportsResponse {
  reports: ReportWithAI[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function ReportManagementPanel() {
  const t = useTranslations('admin');
  const commonT = useTranslations('common');
  const locale = useLocale();
  const dateLocale = locale === 'fa' ? faIR : enUS;

  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [triggeringId, setTriggeringId] = useState<number | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const response = await fetchApi<ReportsResponse>(`/admin/reports?page=${page}&limit=10`);
    if (response.success && response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleTriggerAI = async (id: number) => {
    setTriggeringId(id);
    const response = await fetchApi(`/admin/reports/${id}/verify`, {
      method: 'POST',
    });

    if (response.success) {
      // Refresh after a short delay or just show success
      setTimeout(() => {
        fetchReports();
        setTriggeringId(null);
      }, 1000);
    } else {
      setTriggeringId(null);
      alert('Failed to trigger AI verification');
    }
  };

  if (loading && !data) {
    return <div className="p-12 text-center text-foreground/40 italic">{commonT('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-medium tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-foreground/40" />
          {t('incident_reports_title')}
        </h2>
      </div>

      <div className="rounded-xl border border-foreground/[0.05] overflow-x-auto">
        <table className="w-full text-left rtl:text-right min-w-[800px]">
          <thead className="text-xs uppercase bg-foreground/[0.02] text-foreground/50 font-medium">
            <tr>
              <th className="px-6 py-3 tracking-wider">{t('col_report_title')}</th>
              <th className="px-6 py-3 tracking-wider">{t('col_author')}</th>
              <th className="px-6 py-3 tracking-wider">{t('col_date')}</th>
              <th className="px-6 py-3 tracking-wider">{t('col_ai_status')}</th>
              <th className="px-6 py-3 text-right tracking-wider w-[150px]">{t('col_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/[0.05] text-sm">
            {data?.reports.map(report => (
              <tr key={report.id} className="hover:bg-foreground/[0.01] transition-colors group">
                <td className="px-6 py-3 font-medium text-foreground/90">{report.title}</td>
                <td className="px-6 py-3 text-foreground/60">
                  {report.user?.displayName || report.user?.username || commonT('anonymous')}
                </td>
                <td className="px-6 py-3 text-foreground/40 text-xs">
                  {format(new Date(report.createdAt), 'MMM d, yyyy', { locale: dateLocale })}
                </td>
                <td className="px-6 py-3">
                  {report.aiVerification ? (
                    <div className="flex items-center gap-2 text-emerald-500">
                      <ShieldCheck size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {report.aiVerification.confidenceScore}% Confidence
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-500/50 italic">
                      <AlertCircle size={16} />
                      <span className="text-[10px] uppercase tracking-wider">Missing</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        'h-8 px-2 text-[10px] font-bold uppercase tracking-widest gap-2',
                        report.aiVerification
                          ? 'text-foreground/20'
                          : 'text-blue-500 hover:bg-blue-500/10'
                      )}
                      onClick={() => handleTriggerAI(report.id)}
                      disabled={triggeringId === report.id}
                    >
                      {triggeringId === report.id ? (
                        <RotateCw size={14} className="animate-spin" />
                      ) : (
                        <RotateCw size={14} />
                      )}
                      {report.aiVerification ? 'Re-Verify' : 'Verify Now'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm mt-4">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-foreground/40 px-2">
            {page} / {data.pagination.totalPages}
          </span>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={page === data.pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
