'use client';

import { useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  MiniMap,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useGraphData } from '@/hooks/use-graph-data';
import { type ViewContext, defaultEdgeOptions, nodeTypes } from './config';
import { GraphControls } from './graph-controls';
import { GraphDock } from './graph-dock';
import { GraphMarkers } from './graph-markers';
import { GraphToolbar } from './graph-toolbar';
import TimelineFilter from './timeline-filter';

import { SubmitReportModal } from '../reports/submit-report-modal';
import { AddOrganizationModal } from './add-organization-modal';
import { AddPersonModal } from './add-person-modal';
import type { OrganizationNodeData, PersonNodeData, ReportNodeData } from './types';

import { useToolContext } from '@/components/providers/tool-provider';
import { Button } from '@/components/ui/button';
import { ReportContentButton } from '@/components/ui/report-content-button';
import { Map as MapIcon } from 'lucide-react';

// Custom MiniMap Node (Dot)
// biome-ignore lint/suspicious/noExplicitAny: ReactFlow types for MiniMapNodeProps are generic
const MiniMapNode = ({ x, y, width, height, color }: any) => {
  return <circle cx={x + width / 2} cy={y + height / 2} r={24} fill={color} />;
};

interface GraphCanvasProps {
  initialView?: ViewContext;
}

export default function GraphCanvas({ initialView }: GraphCanvasProps) {
  const router = useRouter();
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState(false);
  const [isSubmitReportModalOpen, setIsSubmitReportModalOpen] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);

  const locale = useLocale();
  const t = useTranslations('graph');
  const tOrg = useTranslations('organization');
  const tPerson = useTranslations('person');

  const {
    nodes,
    edges,
    loading,
    error,
    viewContext,
    dateRange,
    timeRangeLimit,
    setNodes,
    setEdges,
    setDateRange,
    fetchOrganizations,
    fetchOrganizationPeople,
    fetchIndividualReports,
  } = useGraphData({
    initialView,
    tOrg,
    tPerson,
    locale,
  });

  // Handle node click
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === 'organization') {
        const data = node.data as OrganizationNodeData;
        fetchOrganizationPeople(data.id, data.name);
      } else if (node.type === 'individual') {
        const data = node.data as PersonNodeData;
        fetchIndividualReports(data.id, data.name);
      } else if (node.type === 'report') {
        const data = node.data as ReportNodeData;
        router.push(`/reports/${data.id}`);
      }
    },
    [fetchOrganizationPeople, fetchIndividualReports, router]
  );

  // Handle node changes
  const onNodesChange: OnNodesChange = useCallback(
    changes => setNodes(nds => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    changes => setEdges(eds => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  // Handle refresh based on current view
  const handleRefresh = useCallback(() => {
    if (viewContext.mode === 'organizations') {
      fetchOrganizations();
    } else if (viewContext.mode === 'people' && viewContext.organizationId) {
      fetchOrganizationPeople(viewContext.organizationId, viewContext.organizationName);
    } else if (viewContext.mode === 'reports' && viewContext.individualId) {
      fetchIndividualReports(viewContext.individualId, viewContext.individualName);
    }
  }, [viewContext, fetchOrganizations, fetchOrganizationPeople, fetchIndividualReports]);

  const { setTools } = useToolContext();

  // Push tools to the navbar
  useEffect(() => {
    setTools(
      <GraphDock
        showMiniMap={showMiniMap}
        onToggleMiniMap={() => setShowMiniMap(prev => !prev)}
        timelineContent={
          <TimelineFilter
            minYear={timeRangeLimit[0]}
            maxYear={timeRangeLimit[1]}
            selectedRange={dateRange}
            onRangeChange={setDateRange}
            isVisible={true}
            compact
          />
        }
        addContent={
          <GraphToolbar
            onAddOrganization={() => setIsAddOrgModalOpen(true)}
            onAddPerson={() => setIsAddPersonModalOpen(true)}
            onAddReport={() => setIsSubmitReportModalOpen(true)}
            onRefresh={handleRefresh}
            viewMode={viewContext.mode}
            isLoading={loading}
            compact
          />
        }
      />
    );

    return () => setTools(null);
  }, [
    timeRangeLimit,
    dateRange,
    setDateRange,
    viewContext.mode,
    loading,
    handleRefresh,
    setTools,
    showMiniMap,
  ]);

  // Load initial data
  // biome-ignore lint/correctness/useExhaustiveDependencies: This effect should only run once on mount
  useEffect(() => {
    if (initialView) {
      if (initialView.mode === 'organizations') {
        fetchOrganizations();
      } else if (initialView.mode === 'people' && initialView.organizationId) {
        fetchOrganizationPeople(initialView.organizationId);
      } else if (initialView.mode === 'reports' && initialView.individualId) {
        fetchIndividualReports(initialView.individualId);
      }
    } else {
      fetchOrganizations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
          <div className="text-foreground/40">{t('loading')}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="text-red-500 text-lg">{error}</div>
          <button
            type="button"
            onClick={fetchOrganizations}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            {t('try_again')}
          </button>
        </div>
      </div>
    );
  }

  // Filter nodes and edges based on date range
  const visibleNodes = nodes.filter(node => {
    if (node.type === 'report') {
      const data = node.data as ReportNodeData;
      if (!data.incidentDate) return true;
      const year = new Date(data.incidentDate).getFullYear();
      return year >= dateRange[0] && year <= dateRange[1];
    }
    return true;
  });

  const visibleEdges = edges.filter(edge => {
    if (edge.data?.startDate) {
      const startYear = new Date(edge.data.startDate).getFullYear();
      const endYear = edge.data.endDate
        ? new Date(edge.data.endDate).getFullYear()
        : new Date().getFullYear();

      const hasOverlap = Math.max(startYear, dateRange[0]) <= Math.min(endYear, dateRange[1]);
      if (!hasOverlap) return false;
    }

    const sourceVisible = visibleNodes.some(n => n.id === edge.source);
    const targetVisible = visibleNodes.some(n => n.id === edge.target);
    return sourceVisible && targetVisible;
  });

  return (
    <div className="w-full h-full text-foreground bg-background">
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        attributionPosition="bottom-left"
        className="bg-background"
      >
        <GraphMarkers />
        <Background
          color="currentColor"
          gap={24}
          size={1}
          className="text-foreground/5 opacity-50"
        />
        <GraphControls />

        {/* Type casting MiniMapNode to any to avoid strict type issues with ReactFlow version mismatches or generic complexity */}
        {showMiniMap && (
          <MiniMap
            nodeComponent={MiniMapNode}
            nodeColor={node => {
              if (node.type === 'organization') return '#3b82f6';
              if (node.type === 'individual') return '#a855f7';
              if (node.type === 'report') return '#22c55e';
              return '#6b7280';
            }}
            className="!bg-white/5 !backdrop-blur-2xl liquid-glass !border-none !rounded-2xl !bottom-20 !right-6 !m-0 !w-[200px] !h-[150px]"
            maskColor="transparent"
          />
        )}
      </ReactFlow>

      {/* Add Organization Modal */}
      <AddOrganizationModal
        isOpen={isAddOrgModalOpen}
        onClose={() => setIsAddOrgModalOpen(false)}
        onSuccess={() => fetchOrganizations()}
      />

      {/* Add Person Modal */}
      {viewContext.organizationId && (
        <AddPersonModal
          isOpen={isAddPersonModalOpen}
          onClose={() => setIsAddPersonModalOpen(false)}
          onSuccess={() => {
            if (viewContext.organizationId) {
              fetchOrganizationPeople(viewContext.organizationId, viewContext.organizationName);
            }
          }}
          organizationId={viewContext.organizationId}
          organizationName={viewContext.organizationName}
        />
      )}

      {/* Submit Report Modal */}
      {viewContext.individualId && (
        <SubmitReportModal
          isOpen={isSubmitReportModalOpen}
          onClose={() => setIsSubmitReportModalOpen(false)}
          individualId={viewContext.individualId}
          individualName={viewContext.individualName || ''}
          apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}
          onSuccess={() => {
            if (viewContext.individualId) {
              fetchIndividualReports(viewContext.individualId, viewContext.individualName);
            }
          }}
        />
      )}

      {/* Navigation breadcrumb */}
      <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-lg border border-foreground/10 z-10">
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={fetchOrganizations}
            className={`hover:underline ${
              viewContext.mode === 'organizations'
                ? 'text-foreground font-medium'
                : 'text-accent-primary'
            }`}
          >
            {t('organizations')}
          </button>
          {viewContext.mode === 'people' && viewContext.organizationName && (
            <>
              <span className="text-foreground/40">/</span>
              <span className="text-foreground font-medium">{viewContext.organizationName}</span>
              {viewContext.organizationId && (
                <ReportContentButton
                  contentType="organization"
                  contentId={viewContext.organizationId}
                  className="ml-1"
                />
              )}
            </>
          )}
          {viewContext.mode === 'reports' && viewContext.individualName && (
            <>
              <span className="text-foreground/40">/</span>
              <span className="text-foreground font-medium">{viewContext.individualName}</span>
              {viewContext.individualId && (
                <ReportContentButton
                  contentType="individual"
                  contentId={viewContext.individualId}
                  className="ml-1"
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Help tooltip */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/60 backdrop-blur-xl px-4 py-2 rounded-full shadow-sm border border-white/10 z-10 text-xs font-medium text-foreground/60 pointer-events-none select-none">
        <p className="flex items-center gap-2">
          <span>{t('click_to_drill_down')}</span>
          <span className="w-px h-3 bg-foreground/10" />
          <span>
            {t('scroll_to_zoom')} • {t('drag_to_pan')}
          </span>
        </p>
      </div>
    </div>
  );
}
