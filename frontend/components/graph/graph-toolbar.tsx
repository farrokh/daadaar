'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface GraphToolbarProps {
  onAddOrganization: () => void;
  onAddPerson?: () => void;
  onRefresh: () => void;
  viewMode: 'organizations' | 'people' | 'reports';
  isLoading?: boolean;
}

export function GraphToolbar({
  onAddOrganization,
  onAddPerson,
  onRefresh,
  viewMode,
  isLoading = false,
}: GraphToolbarProps) {
  const t = useTranslations('graph');

  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
      {/* Refresh Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        className="shadow-lg"
        title={t('refresh')}
      >
        <svg
          className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          aria-label="Refresh icon"
          role="img"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </Button>

      {/* Add Organization Button - Only show in organizations view */}
      {viewMode === 'organizations' && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAddOrganization}
          disabled={isLoading}
          className="shadow-lg"
        >
          <svg
            className="h-4 w-4 mr-1.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            aria-label="Plus icon"
            role="img"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('add_organization')}
        </Button>
      )}

      {/* Add Person Button - Only show in people view */}
      {viewMode === 'people' && onAddPerson && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAddPerson}
          disabled={isLoading}
          className="shadow-lg"
        >
          <svg
            className="h-4 w-4 mr-1.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            aria-label="Plus icon"
            role="img"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('add_person')}
        </Button>
      )}

      {/* Add Report Button - Only show in reports view */}
      {viewMode === 'reports' && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            // TODO: Navigate to submit report page
          }}
          disabled={isLoading}
          className="shadow-lg opacity-50 cursor-not-allowed"
          title={t('coming_soon')}
        >
          <svg
            className="h-4 w-4 mr-1.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            aria-label="Plus icon"
            role="img"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t('add_report')}
        </Button>
      )}
    </div>
  );
}

export default GraphToolbar;
