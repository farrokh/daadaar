'use client';

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
import { AddOrganizationModal } from './add-organization-modal';
import { AddPersonModal } from './add-person-modal';
import { GraphToolbar } from './graph-toolbar';
import OrganizationNode from './organization-node';
import PersonNode from './person-node';
import ReportNode from './report-node';
import type { OrganizationNodeData, PersonNodeData } from './types';

// Define node types
const nodeTypes: NodeTypes = {
  organization: OrganizationNode,
  person: PersonNode,
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

/**
 * Render an interactive graph canvas with drill-down views for organizations, people, and reports.
 *
 * Renders a React Flow-based graph with custom node types, a toolbar, modals for creating organizations
 * and people, breadcrumb navigation, and a minimap. The component loads data on mount according to
 * the optional initial view and supports drilling down by clicking nodes, refreshing the current view,
 * and creating new entities which refresh the relevant view.
 *
 * @param initialView - Optional view context to load on mount; when omitted the organizations view is loaded.
 * @returns The React element that displays the interactive graph UI with controls, modals, and navigation.
 */
export default function GraphCanvas({ initialView }: GraphCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewContext, setViewContext] = useState<ViewContext>(
    initialView || { mode: 'organizations' }
  );
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState(false);

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
      setViewContext({ mode: 'organizations' });
    } else {
      setError(response.error?.message || 'Failed to load organizations');
    }

    setLoading(false);
  }, [layoutNodes]);

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
      } else {
        setError(response.error?.message || 'Failed to load people');
      }

      setLoading(false);
    },
    [layoutNodes]
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

        // Create person node as root with actual data
        const personNode: Node = {
          id: `person-${individual.id}`,
          type: 'person',
          data: {
            id: individual.id,
            name: individual.fullName,
            nameEn: individual.fullNameEn,
            biography: individual.biography,
          },
          position: { x: 0, y: 0 },
        };

        const allNodes = [personNode, ...reportNodes];
        const positionedNodes = layoutNodes(allNodes, reportEdges);
        setNodes(positionedNodes);
        setEdges(reportEdges);
        setViewContext({
          mode: 'reports',
          individualId: individual.id,
          individualName: individual.fullName,
        });
      } else {
        setError(response.error?.message || 'Failed to load reports');
      }

      setLoading(false);
    },
    [layoutNodes]
  );

  // Handle node click
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === 'organization') {
        const data = node.data as OrganizationNodeData;
        fetchOrganizationPeople(data.id, data.name);
      } else if (node.type === 'person') {
        const data = node.data as PersonNodeData;
        fetchIndividualReports(data.id, data.name);
      }
      // Report nodes don't navigate further
    },
    [fetchOrganizationPeople, fetchIndividualReports]
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
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <div className="text-gray-500 dark:text-gray-400">Loading graph...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="text-red-500 text-lg">{error}</div>
          <button
            type="button"
            onClick={fetchOrganizations}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
            if (node.type === 'person') return '#a855f7';
            if (node.type === 'report') return '#22c55e';
            return '#6b7280';
          }}
        />
      </ReactFlow>

      {/* Toolbar */}
      <GraphToolbar
        onAddOrganization={() => setIsAddOrgModalOpen(true)}
        onAddPerson={() => setIsAddPersonModalOpen(true)}
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

      {/* Navigation breadcrumb */}
      <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg z-10">
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={fetchOrganizations}
            className={`hover:underline ${
              viewContext.mode === 'organizations'
                ? 'text-gray-900 dark:text-white font-medium'
                : 'text-blue-600 dark:text-blue-400'
            }`}
          >
            Organizations
          </button>
          {viewContext.mode === 'people' && viewContext.organizationName && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {viewContext.organizationName}
              </span>
            </>
          )}
          {viewContext.mode === 'reports' && viewContext.individualName && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {viewContext.individualName}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Help tooltip */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg z-10 text-xs text-gray-500 dark:text-gray-400">
        <p>Click on a node to drill down</p>
        <p>Scroll to zoom • Drag to pan</p>
      </div>
    </div>
  );
}