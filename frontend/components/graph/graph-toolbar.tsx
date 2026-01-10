'use client';

import { Button } from '@/components/ui/button';
import { Building2, FileText, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ViewMode } from './config';

interface GraphToolbarProps {
  onAddOrganization: () => void;
  onAddPerson?: () => void;
  onAddReport?: () => void;
  viewMode: ViewMode;
  isLoading?: boolean;
}

export function GraphToolbar({
  onAddOrganization,
  onAddPerson,
  onAddReport,
  viewMode,
  isLoading = false,
  compact = false,
  className,
}: GraphToolbarProps & { compact?: boolean; className?: string }) {
  const t = useTranslations('graph');

  const content = (
    <div className="flex items-center gap-3">
      {/* Add Organization Button - Only show in organizations view */}
      {viewMode === 'organizations' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddOrganization}
          disabled={isLoading}
          className="group h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
          title={t('add_organization')}
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">
              {t('add_organization')}
            </span>
          </div>
        </Button>
      )}

      {/* Add Person Button - Only show in people view */}
      {viewMode === 'people' && onAddPerson && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddPerson}
          disabled={isLoading}
          className="group h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
          title={t('add_person')}
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">
              {t('add_person')}
            </span>
          </div>
        </Button>
      )}

      {/* Add Report Button - Only show in reports view */}
      {viewMode === 'reports' && onAddReport && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddReport}
          disabled={isLoading}
          className="group h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
          title={t('add_report')}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">
              {t('add_report')}
            </span>
          </div>
        </Button>
      )}
    </div>
  );

  if (compact) {
    return <div className={`flex items-center ${className || ''}`}>{content}</div>;
  }

  return (
    <div className="absolute top-4 right-4 z-10 flex items-center p-1.5 bg-background/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
      {content}
    </div>
  );
}

export default GraphToolbar;
