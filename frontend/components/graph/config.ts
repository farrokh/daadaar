import type { DefaultEdgeOptions, EdgeTypes, NodeTypes } from 'reactflow';
import OrganizationNode from './organization-node';
import PersonNode from './person-node';
import ReportNode from './report-node';

// Define node types
export const nodeTypes: NodeTypes = {
  organization: OrganizationNode,
  individual: PersonNode,
  report: ReportNode,
};

// Edge types - React Flow will use default bezier edges for any unrecognized type
// Empty object means all edge types will fall back to the default rendering
export const edgeTypes: EdgeTypes = {};

// Default edge options with modern styling
export const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'default', // Bezier edges route better around nodes
  animated: false, // Disable animation to reduce visual noise
  style: {
    strokeWidth: 1.2,
    stroke: '#94a3b8',
    opacity: 0.4, // More subtle edges
  },
  markerEnd: 'edge-circle',
  // Add z-index to ensure edges stay behind nodes
  zIndex: -1,
};

export type ViewMode = 'organizations' | 'people' | 'reports';

export type ViewContext = {
  mode: ViewMode;
  organizationId?: number;
  organizationUuid?: string;
  organizationName?: string;
  individualId?: number;
  individualUuid?: string;
  individualName?: string;
};
