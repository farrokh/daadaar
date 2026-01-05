'use client';

import { Button } from '@/components/ui/button';
import { Building2, FileText, Plus, RefreshCw, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface GraphToolbarProps {
  onAddOrganization: () => void;
  onAddPerson?: () => void;
  onAddReport?: () => void;
  onRefresh: () => void;
  viewMode: 'organizations' | 'people' | 'reports';
  isLoading?: boolean;
}

export function GraphToolbar({
  onAddOrganization,
  onAddPerson,
  onAddReport,
  onRefresh,
  viewMode,
  isLoading = false,
  compact = false,
  className,
}: GraphToolbarProps & { compact?: boolean; className?: string }) {
  const t = useTranslations('graph');

  const content = (
    <>
      {/* Refresh Button */}
      <Button
        variant="ghost"
        size={compact ? 'icon' : 'sm'}
        onClick={onRefresh}
        disabled={isLoading}
        className={
          compact
            ? 'rounded-full'
            : 'h-9 w-9 p-0 rounded-xl hover:bg-foreground/5 text-foreground/80 hover:text-foreground transition-all'
        }
        title={t('refresh')}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>

      {/* Add Organization Button - Only show in organizations view */}
      {viewMode === 'organizations' && (
        <Button
          variant={compact ? 'primary' : 'primary'}
          size={compact ? 'icon' : 'sm'}
          onClick={onAddOrganization}
          disabled={isLoading}
          className={
            compact
              ? 'rounded-xl shadow-sm'
              : 'h-9 rounded-xl shadow-lg shadow-primary/20 transition-all font-medium px-4'
          }
          title={compact ? t('add_organization') : undefined}
        >
          <Building2 className="h-4 w-4" />
          {!compact && <span className="ml-2">{t('add_organization')}</span>}
        </Button>
      )}

      {/* Add Person Button - Only show in people view */}
      {viewMode === 'people' && onAddPerson && (
        <Button
          variant={compact ? 'secondary' : 'secondary'}
          size={compact ? 'icon' : 'sm'}
          onClick={onAddPerson}
          disabled={isLoading}
          className={
            compact
              ? 'rounded-xl shadow-sm'
              : 'h-9 rounded-xl shadow-lg shadow-secondary/20 transition-all font-medium px-4'
          }
          title={compact ? t('add_person') : undefined}
        >
          <User className="h-4 w-4" />
          {!compact && <span className="ml-2">{t('add_person')}</span>}
        </Button>
      )}

      {/* Add Report Button - Only show in reports view */}
      {viewMode === 'reports' && onAddReport && (
        <Button
          variant={compact ? 'default' : 'default'}
          size={compact ? 'icon' : 'sm'}
          onClick={onAddReport}
          disabled={isLoading}
          className={
            compact
              ? 'rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm'
              : 'h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20 transition-all font-medium px-4'
          }
          title={compact ? t('add_report') : undefined}
        >
          <FileText className="h-4 w-4" />
          {!compact && <span className="ml-2">{t('add_report')}</span>}
        </Button>
      )}
    </>
  );

  if (compact) {
    return <div className={`flex items-center gap-1 ${className || ''}`}>{content}</div>;
  }

  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 p-1.5 bg-background/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
      {content}
    </div>
  );
}

export default GraphToolbar;
