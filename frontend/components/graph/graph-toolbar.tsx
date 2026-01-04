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
}: GraphToolbarProps) {
  const t = useTranslations('graph');

  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 p-1.5 bg-background/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
      {/* Refresh Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        className="h-9 w-9 p-0 rounded-xl hover:bg-foreground/5 text-foreground/80 hover:text-foreground transition-all"
        title={t('refresh')}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>

      <div className="w-px h-4 bg-foreground/10 mx-1" />

      {/* Add Organization Button - Only show in organizations view */}
      {viewMode === 'organizations' && (
        <Button
          variant="default" // Assuming 'primary' was mapped to default or creating custom variant
          size="sm"
          onClick={onAddOrganization}
          disabled={isLoading}
          className="h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all font-medium px-4"
        >
          <Building2 className="h-4 w-4 mr-2" />
          {t('add_organization')}
        </Button>
      )}

      {/* Add Person Button - Only show in people view */}
      {viewMode === 'people' && onAddPerson && (
        <Button
          variant="default"
          size="sm"
          onClick={onAddPerson}
          disabled={isLoading}
          className="h-9 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 transition-all font-medium px-4"
        >
          <User className="h-4 w-4 mr-2" />
          {t('add_person')}
        </Button>
      )}

      {/* Add Report Button - Only show in reports view */}
      {viewMode === 'reports' && onAddReport && (
        <Button
          variant="default"
          size="sm"
          onClick={onAddReport}
          disabled={isLoading}
          className="h-9 rounded-xl bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20 transition-all font-medium px-4"
        >
          <FileText className="h-4 w-4 mr-2" />
          {t('add_report')}
        </Button>
      )}
    </div>
  );
}

export default GraphToolbar;
