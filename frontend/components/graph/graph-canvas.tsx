'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { useAuth } from '@/components/auth/auth-provider';
import { useGraphData } from '@/hooks/use-graph-data';
import { type ViewContext, defaultEdgeOptions, edgeTypes, nodeTypes } from './config';
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
import { Building2, FileText, Info, Map as MapIcon, Share2, User } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { ContextMenu } from './context-menu';

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState(false);
  const [isSubmitReportModalOpen, setIsSubmitReportModalOpen] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [isHelpCollapsed, setIsHelpCollapsed] = useState(false);
  const hasInitialLoadCompleted = useRef(false);

  const locale = useLocale();

  // Check if user is admin
  const isAdmin = currentUser?.type === 'registered' && currentUser.role === 'admin';

  // Memoize config objects to satisfy React Flow warning (references must be stable)
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, []);
  const memoizedEdgeOptions = useMemo(() => defaultEdgeOptions, []);

  const t = useTranslations('graph');
  const commonT = useTranslations('common');
  const tOrg = useTranslations('organization');
  const tPerson = useTranslations('person');

  const {
    nodes,
    edges,
    loading,
    error,
    viewContext,
    organizationPath,
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
        router.push(`/reports/${data.shareableUuid}`);
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

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  }, []);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyError(false);
      setShowCopyToast(true);
      window.setTimeout(() => setShowCopyToast(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      setCopyError(true);
      setShowCopyToast(true);
      window.setTimeout(() => {
        setShowCopyToast(false);
        setCopyError(false);
      }, 2000);
    }
  }, []);

  const onPaneClick = useCallback(() => {
    if (contextMenu) setContextMenu(null);
  }, [contextMenu]);

  const { setTools } = useToolContext();

  // Auto-collapse help tooltip after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHelpCollapsed(true);
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  // Push tools to the navbar
  useEffect(() => {
    setTools(
      <GraphDock
        showMiniMap={showMiniMap}
        onToggleMiniMap={() => setShowMiniMap(prev => !prev)}
        onRefresh={handleRefresh}
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

  useEffect(() => {
    // Skip URL sync while still loading initial data to prevent overwriting URL params
    if (loading) {
      return;
    }

    // Mark that initial load is complete
    if (!hasInitialLoadCompleted.current) {
      hasInitialLoadCompleted.current = true;
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    params.set('view', viewContext.mode);

    if (viewContext.mode === 'people' && viewContext.organizationUuid) {
      params.set('organizationUuid', viewContext.organizationUuid);
      params.delete('individualUuid');
      // Clean up old numeric params for backward compatibility
      params.delete('organizationId');
      params.delete('individualId');
    } else if (viewContext.mode === 'reports' && viewContext.individualUuid) {
      params.set('individualUuid', viewContext.individualUuid);
      params.delete('organizationUuid');
      // Clean up old numeric params for backward compatibility
      params.delete('organizationId');
      params.delete('individualId');
    } else {
      params.delete('organizationUuid');
      params.delete('individualUuid');
      params.delete('organizationId');
      params.delete('individualId');
    }

    const nextSearch = params.toString();
    const currentSearch = searchParams.toString();

    if (nextSearch === currentSearch) return;

    const nextUrl = nextSearch ? `${pathname}?${nextSearch}` : pathname;
    router.replace(nextUrl);
  }, [pathname, router, searchParams, viewContext, loading]);

  // Load initial data
  // Track if we have done the initial data fetch
  const hasPerformedInitialFetch = useRef(false);

  // Load initial data and sync with external URL changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: We only want this to run when external props change
  useEffect(() => {
    // Determine target view from initialView (props)
    const targetMode = initialView?.mode || 'organizations';
    const targetOrgId = initialView?.organizationId;
    const targetIndId = initialView?.individualId;

    // Get current internal state
    const currentMode = viewContext.mode;
    const currentOrgId = viewContext.organizationId;
    const currentIndId = viewContext.individualId;

    // Check if internal state already matches target
    const isMatched =
      targetMode === currentMode && targetOrgId === currentOrgId && targetIndId === currentIndId;

    // If matches, normally we skip. BUT on first load, we must fetch because data is empty!
    if (isMatched && hasPerformedInitialFetch.current) return;

    hasPerformedInitialFetch.current = true;

    // Fetch target data
    if (targetMode === 'organizations') {
      fetchOrganizations();
    } else if (targetMode === 'people' && targetOrgId) {
      if (typeof initialView?.organizationId === 'number') {
        fetchOrganizationPeople(initialView.organizationId);
      }
    } else if (targetMode === 'reports' && targetIndId) {
      if (typeof initialView?.individualId === 'number') {
        fetchIndividualReports(initialView.individualId);
      }
    }
    // We intentionally omit fetchers and viewContext from dependencies.
    // We only want this to run when the *external* props (initialView) change.
    // If viewContext changes (internal navigation), we do NOT want this to run/revert.
  }, [initialView?.mode, initialView?.organizationId, initialView?.individualId]);

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

  // Filter nodes and edges based on date range and inject admin edit callbacks
  const visibleNodes = nodes
    .filter(node => {
      if (node.type === 'report') {
        const data = node.data as ReportNodeData;
        if (!data.incidentDate) return true;
        const year = new Date(data.incidentDate).getFullYear();
        return year >= dateRange[0] && year <= dateRange[1];
      }
      return true;
    })
    .map(node => {
      // Inject onEdit callback for admin users
      if (isAdmin && (node.type === 'organization' || node.type === 'individual')) {
        return {
          ...node,
          data: {
            ...node.data,
            onEdit: () => {
              // Navigate to admin panel with appropriate tab
              const tab = node.type === 'organization' ? 'organizations' : 'individuals';
              router.push(`/admin?tab=${tab}`);
            },
          },
        };
      }
      return node;
    });

  const visibleEdges = edges
    .filter(edge => {
      // Always show edges, but we'll modify their type based on whether they're current or former
      const sourceVisible = visibleNodes.some(n => n.id === edge.source);
      const targetVisible = visibleNodes.some(n => n.id === edge.target);
      return sourceVisible && targetVisible;
    })
    .map(edge => {
      // Check if this is a former occupancy (ended in the past)
      if (edge.type === 'occupies' && edge.data?.endDate) {
        const endDate = new Date(edge.data.endDate);
        const now = new Date();

        // If the role ended in the past, mark it as a former occupancy
        if (endDate < now) {
          return {
            ...edge,
            type: 'occupies_former',
            animated: true,
            style: {
              strokeWidth: 0.7,
              opacity: 0.3, // More faded
            },
          };
        }
      }

      return edge;
    });

  // Calculate context menu items based on view mode
  const contextMenuItems = [
    ...(viewContext.mode === 'organizations'
      ? [
          {
            label: t('add_organization'),
            icon: Building2,
            onClick: () => setIsAddOrgModalOpen(true),
          },
        ]
      : []),
    ...(viewContext.mode === 'people' && viewContext.organizationId
      ? [
          {
            label: t('add_person'),
            icon: User,
            onClick: () => setIsAddPersonModalOpen(true),
          },
        ]
      : []),
    ...(viewContext.mode === 'reports' && viewContext.individualId
      ? [
          {
            label: t('add_report'),
            icon: FileText,
            onClick: () => setIsSubmitReportModalOpen(true),
          },
        ]
      : []),
    {
      label: commonT('share'),
      icon: Share2,
      onClick: handleShare,
    },
  ];

  return (
    <div className="w-full h-full text-foreground bg-background" onContextMenu={handleContextMenu}>
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={memoizedNodeTypes}
        edgeTypes={memoizedEdgeTypes}
        defaultEdgeOptions={memoizedEdgeOptions}
        fitView
        minZoom={0.1}
        maxZoom={4}
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

      {/* Context Menu */}
      {contextMenu && contextMenuItems.length > 0 && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}

      {showCopyToast && (
        <output
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-2 fade-in"
          aria-live="polite"
        >
          <div
            className={`px-4 py-2 rounded-full shadow-lg text-sm font-medium ${
              copyError
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-foreground text-background'
            }`}
          >
            {copyError ? commonT('error_generic') : commonT('link_copied')}
          </div>
        </output>
      )}

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
          {/* Organization path for people view */}
          {viewContext.mode === 'people' && organizationPath.length > 0 && (
            <>
              {(() => {
                // Filter out the current organization from the path as it matches the current view title
                const path = organizationPath.filter(
                  item => item.id !== viewContext.organizationId
                );

                if (path.length === 0) return null;

                const displayPath: Array<(typeof path)[0] | 'ellipsis'> = [];

                // If more than 3 items, show first 1, ellipsis, and last 2
                if (path.length > 3) {
                  displayPath.push(
                    path[0],
                    'ellipsis',
                    path[path.length - 2],
                    path[path.length - 1]
                  );
                } else {
                  displayPath.push(...path);
                }

                return displayPath.map((item, index) => (
                  <span
                    key={item === 'ellipsis' ? `ellipsis-${index}` : `org-${item.id}`}
                    className="flex items-center gap-2"
                  >
                    {index > 0 && <span className="text-foreground/40">/</span>}
                    {item === 'ellipsis' ? (
                      <span className="text-foreground/60">...</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fetchOrganizationPeople(item.id, item.name)}
                        className="text-accent-primary hover:underline"
                      >
                        {locale === 'en' ? item.nameEn || item.name : item.name}
                      </button>
                    )}
                  </span>
                ));
              })()}

              {organizationPath.filter(item => item.id !== viewContext.organizationId).length >
                0 && <span className="text-foreground/40">/</span>}
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

          {/* Organization path for reports view */}
          {viewContext.mode === 'reports' && organizationPath.length > 0 && (
            <>
              {(() => {
                const path = organizationPath;
                const displayPath: Array<(typeof path)[0] | 'ellipsis'> = [];

                // If more than 3 items, show first 1, ellipsis, and last 2
                if (path.length > 3) {
                  displayPath.push(
                    path[0],
                    'ellipsis',
                    path[path.length - 2],
                    path[path.length - 1]
                  );
                } else {
                  displayPath.push(...path);
                }

                return displayPath.map((item, index) => (
                  <span
                    key={item === 'ellipsis' ? `ellipsis-${index}` : `org-${item.id}`}
                    className="flex items-center gap-2"
                  >
                    {index > 0 && <span className="text-foreground/40">/</span>}
                    {item === 'ellipsis' ? (
                      <span className="text-foreground/60">...</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fetchOrganizationPeople(item.id, item.name)}
                        className="text-accent-primary hover:underline"
                      >
                        {locale === 'en' ? item.nameEn || item.name : item.name}
                      </button>
                    )}
                  </span>
                ));
              })()}

              {viewContext.individualName && (
                <>
                  {organizationPath.length > 0 && <span className="text-foreground/40">/</span>}
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
            </>
          )}
        </div>
      </div>

      {/* Help tooltip */}
      {/* Help tooltip */}
      <div
        className={`fixed top-6 right-44 z-40 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg liquid-glass rounded-full transition-all duration-500 ease-in-out cursor-default select-none overflow-hidden flex items-center h-9 ${
          isHelpCollapsed ? 'w-9 justify-center' : 'max-w-[400px]'
        }`}
        onMouseEnter={() => setIsHelpCollapsed(false)}
        onMouseLeave={() => setIsHelpCollapsed(true)}
      >
        <div
          className={`flex items-center flex-row-reverse transition-all duration-500 ease-in-out ${
            isHelpCollapsed ? 'gap-0 px-0' : 'gap-2 px-2'
          }`}
        >
          {/* Icon always visible and stays on the right */}
          <Info className="w-4 h-4 text-foreground/80 shrink-0" />

          {/* Text expands to the left */}
          <div
            className={`flex items-center whitespace-nowrap overflow-hidden transition-all duration-500 ease-in-out ${
              isHelpCollapsed ? 'max-w-0 opacity-0' : 'max-w-[300px] opacity-100'
            }`}
          >
            <span className="text-xs font-medium text-foreground/80 mr-2">
              {t('click_to_drill_down')}
            </span>
            <span className="w-px h-3 bg-foreground/10 mr-2" />
            <span className="text-xs font-medium text-foreground/80">
              {t('scroll_to_zoom')} • {t('drag_to_pan')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
