'use client';

import { Link, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeTypes,
  type DefaultEdgeOptions,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { fetchApi } from '@/lib/api';
import { SubmitReportModal } from '../reports/submit-report-modal';
import { AddOrganizationModal } from './add-organization-modal';
import { AddPersonModal } from './add-person-modal';
import { GraphToolbar } from './graph-toolbar';
import OrganizationNode from './organization-node';
import PersonNode from './person-node';
import ReportNode from './report-node';
import TimelineFilter from './timeline-filter';
import type { OrganizationNodeData, PersonNodeData, ReportNodeData } from './types';

// Define node types
const nodeTypes: NodeTypes = {
  organization: OrganizationNode,
  individual: PersonNode,
  report: ReportNode,
};

// Default edge options with arrow markers
const defaultEdgeOptions: DefaultEdgeOptions = {
  animated: false,
  style: { strokeWidth: 2, stroke: '#94a3b8' },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#94a3b8',
  },
};

export type ViewMode = 'organizations' | 'people' | 'reports';
export type ViewContext = {
  mode: ViewMode;
  organizationId?: number;
  organizationName?: string;
  individualId?: number;
  individualName?: string;
};

interface GraphCanvasProps {
  initialView?: ViewContext;
}

// API response types
interface OrganizationsResponse {
  nodes: Node[];
  edges: Edge[];
}

interface OrganizationPeopleResponse {
  organization: {
    id: number;
    name: string;
    nameEn?: string | null;
    description?: string | null;
  };
  nodes: Node[];
  edges: Edge[];
}

interface IndividualReportsResponse {
  individual: {
    id: number;
    fullName: string;
    fullNameEn?: string | null;
    biography?: string | null;
  };
  nodes: Node[];
  edges: Edge[];
}

export default function GraphCanvas({ initialView }: GraphCanvasProps) {
  const router = useRouter();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewContext, setViewContext] = useState<ViewContext>(
    initialView || { mode: 'organizations' }
  );
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState(false);
  const [isSubmitReportModalOpen, setIsSubmitReportModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<[number, number]>([2000, new Date().getFullYear()]);
  const [timeRangeLimit, setTimeRangeLimit] = useState<[number, number]>([
    2000,
    new Date().getFullYear(),
  ]);

  const t = useTranslations('graph');
  const tOrg = useTranslations('organization');
  const tPerson = useTranslations('person');

  // Layout algorithm: simple grid layout
  const layoutNodes = useCallback((nodes: Node[], edges: Edge[]) => {
    if (nodes.length === 0) return nodes;

    const visited = new Set<string>();
    const levels: string[][] = [];

    // Find root nodes (nodes with no incoming edges)
    const rootNodes = nodes.filter(node => !edges.some(edge => edge.target === node.id));

    // If no root nodes found, use all nodes as roots (handles disconnected graphs)
    const startNodes = rootNodes.length > 0 ? rootNodes : nodes;

    // BFS to assign levels
    const queue: { id: string; level: number }[] = startNodes.map(n => ({
      id: n.id,
      level: 0,
    }));

    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) continue;
      const { id, level } = item;
      if (visited.has(id)) continue;
      visited.add(id);

      if (!levels[level]) levels[level] = [];
      levels[level].push(id);

      // Add children
      for (const e of edges.filter(e => e.source === id)) {
        if (!visited.has(e.target)) {
          queue.push({ id: e.target, level: level + 1 });
        }
      }
    }

    // Add any unvisited nodes to level 0
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (!levels[0]) levels[0] = [];
        levels[0].push(node.id);
      }
    }

    // Position nodes in grid
    const positionedNodes = nodes.map(node => {
      const level = levels.findIndex(l => l?.includes(node.id));
      const indexInLevel = levels[level]?.indexOf(node.id) || 0;
      const nodesInLevel = levels[level]?.length || 1;

      const x = level * 400;
      const y = (indexInLevel - nodesInLevel / 2) * 180;

      return {
        ...node,
        position: { x, y },
      };
    });

    return positionedNodes;
  }, []);

  // Fetch organizations graph
  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await fetchApi<OrganizationsResponse>('/graph/organizations');

    if (response.success && response.data) {
      const positionedNodes = layoutNodes(response.data.nodes, response.data.edges);
      setNodes(positionedNodes);
      setEdges(response.data.edges);

      // Update time range limits based on reports if any
      const reportYears = response.data.nodes
        .filter(n => n.type === 'report')
        .map(n => (n.data as ReportNodeData).incidentDate)
        .filter((d): d is string => !!d)
        .map(d => new Date(d).getFullYear());

      if (reportYears.length > 0) {
        const min = Math.min(...reportYears);
        const max = Math.max(...reportYears);
        setTimeRangeLimit([min, max]);
        setDateRange([min, max]);
      }

      setViewContext({ mode: 'organizations' });
    } else {
      setError(response.error?.message || tOrg('error_create_failed')); // Using error message from API if available
    }

    setLoading(false);
  }, [layoutNodes, tOrg]);

  // Fetch people in organization
  const fetchOrganizationPeople = useCallback(
    async (organizationId: number, _organizationName?: string) => {
      setLoading(true);
      setError(null);

      const response = await fetchApi<OrganizationPeopleResponse>(
        `/graph/organization/${organizationId}/people`
      );

      if (response.success && response.data) {
        const { organization, nodes: peopleNodes, edges: peopleEdges } = response.data;

        // Create organization node as root with actual data
        const orgNode: Node = {
          id: `org-${organization.id}`,
          type: 'organization',
          data: {
            id: organization.id,
            name: organization.name,
            nameEn: organization.nameEn,
            description: organization.description,
          },
          position: { x: 0, y: 0 },
        };

        const allNodes = [orgNode, ...peopleNodes];
        const positionedNodes = layoutNodes(allNodes, peopleEdges);
        setNodes(positionedNodes);
        setEdges(peopleEdges);
        setViewContext({
          mode: 'people',
          organizationId: organization.id,
          organizationName: organization.name,
        });

        // People view might also have reports or activities with dates in the future
        // For now, let's reset or calculate based on occupancy if we had those dates
      } else {
        setError(response.error?.message || tPerson('error_create_failed'));
      }

      setLoading(false);
    },
    [layoutNodes, tPerson]
  );

  // Fetch reports for individual
  const fetchIndividualReports = useCallback(
    async (individualId: number, _individualName?: string) => {
      setLoading(true);
      setError(null);

      const response = await fetchApi<IndividualReportsResponse>(
        `/graph/individual/${individualId}/reports`
      );

      if (response.success && response.data) {
        const { individual, nodes: reportNodes, edges: reportEdges } = response.data;

        // Create individual node as root with actual data
        const individualNode: Node = {
          id: `individual-${individual.id}`,
          type: 'individual',
          data: {
            id: individual.id,
            name: individual.fullName,
            nameEn: individual.fullNameEn,
            biography: individual.biography,
          },
          position: { x: 0, y: 0 },
        };

        const allNodes = [individualNode, ...reportNodes];
        const positionedNodes = layoutNodes(allNodes, reportEdges);
        setNodes(positionedNodes);
        setEdges(reportEdges);
        setViewContext({
          mode: 'reports',
          individualId: individual.id,
          individualName: individual.fullName,
        });

        // Update time range limits based on reports
        const reportYears = reportNodes
          .map(n => (n.data as ReportNodeData).incidentDate)
          .filter((d): d is string => !!d)
          .map(d => new Date(d).getFullYear());

        if (reportYears.length > 0) {
          const min = Math.min(...reportYears);
          const max = Math.max(...reportYears);
          setTimeRangeLimit([min, max]);
          setDateRange([min, max]);
        }
      } else {
        setError(response.error?.message || tPerson('error_create_failed'));
      }

      setLoading(false);
    },
    [layoutNodes, tPerson]
  );

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
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    changes => setEdges(eds => applyEdgeChanges(changes, eds)),
    []
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

  // Handle successful organization creation
  const handleOrganizationCreated = useCallback(() => {
    // Refresh the organizations view
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Handle successful person creation
  const handlePersonCreated = useCallback(() => {
    // Refresh the people view
    if (viewContext.organizationId) {
      fetchOrganizationPeople(viewContext.organizationId, viewContext.organizationName);
    }
  }, [viewContext.organizationId, viewContext.organizationName, fetchOrganizationPeople]);

  // Handle successful report creation
  const handleReportCreated = useCallback(() => {
    // Refresh the reports view
    if (viewContext.individualId) {
      fetchIndividualReports(viewContext.individualId, viewContext.individualName);
    }
  }, [viewContext.individualId, viewContext.individualName, fetchIndividualReports]);

  // Load initial data
  // biome-ignore lint/correctness/useExhaustiveDependencies: This effect should only run once on mount, adding dependencies would cause infinite loops
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
  const visibleNodes = nodes.filter((node) => {
    if (node.type === 'report') {
      const data = node.data as ReportNodeData;
      if (!data.incidentDate) return true;
      const year = new Date(data.incidentDate).getFullYear();
      return year >= dateRange[0] && year <= dateRange[1];
    }
    // Individual and Organization nodes are always visible for now, 
    // but they might be filtered by edges later.
    return true;
  });

  const visibleEdges = edges.filter((edge) => {
    // Check if the edge itself has temporal data (e.g., role occupancy)
    if (edge.data?.startDate) {
      const startYear = new Date(edge.data.startDate).getFullYear();
      const endYear = edge.data.endDate 
        ? new Date(edge.data.endDate).getFullYear() 
        : new Date().getFullYear();
      
      // Keep edge if there is ANY overlap between [startYear, endYear] and [dateRange[0], dateRange[1]]
      const hasOverlap = Math.max(startYear, dateRange[0]) <= Math.min(endYear, dateRange[1]);
      if (!hasOverlap) return false;
    }

    const sourceVisible = visibleNodes.some((n) => n.id === edge.source);
    const targetVisible = visibleNodes.some((n) => n.id === edge.target);
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
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={node => {
            if (node.type === 'organization') return '#3b82f6';
            if (node.type === 'individual') return '#a855f7';
            if (node.type === 'report') return '#22c55e';
            return '#6b7280';
          }}
          className="!bg-background !border-foreground/10"
        />
      </ReactFlow>

      {/* Toolbar */}
      <GraphToolbar
        onAddOrganization={() => setIsAddOrgModalOpen(true)}
        onAddPerson={() => setIsAddPersonModalOpen(true)}
        onAddReport={() => setIsSubmitReportModalOpen(true)}
        onRefresh={handleRefresh}
        viewMode={viewContext.mode}
        isLoading={loading}
      />

      {/* Add Organization Modal */}
      <AddOrganizationModal
        isOpen={isAddOrgModalOpen}
        onClose={() => setIsAddOrgModalOpen(false)}
        onSuccess={handleOrganizationCreated}
      />

      {/* Add Person Modal */}
      {viewContext.organizationId && (
        <AddPersonModal
          isOpen={isAddPersonModalOpen}
          onClose={() => setIsAddPersonModalOpen(false)}
          onSuccess={handlePersonCreated}
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
          onSuccess={handleReportCreated}
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
            </>
          )}
          {viewContext.mode === 'reports' && viewContext.individualName && (
            <>
              <span className="text-foreground/40">/</span>
              <span className="text-foreground font-medium">{viewContext.individualName}</span>
            </>
          )}
        </div>
      </div>

      {/* Help tooltip */}
      <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-lg border border-foreground/10 z-10 text-xs text-foreground/40">
        <p>{t('click_to_drill_down')}</p>
        <p>
          {t('scroll_to_zoom')} • {t('drag_to_pan')}
        </p>
      </div>

      {/* Timeline Filter */}
      <TimelineFilter
        minYear={timeRangeLimit[0]}
        maxYear={timeRangeLimit[1]}
        selectedRange={dateRange}
        onRangeChange={setDateRange}
        isVisible={true}
      />
    </div>
  );
}
