import { type DefaultEdgeOptions, type EdgeTypes, type NodeTypes, SmoothStepEdge } from 'reactflow';
import OrganizationNode from './organization-node';
import PersonNode from './person-node';
import ReportNode from './report-node';

// Define node types
export const nodeTypes: NodeTypes = {
  organization: OrganizationNode,
  individual: PersonNode,
  report: ReportNode,
};

// Define edge types to handle backend types and silence warnings
export const edgeTypes: EdgeTypes = {
  hierarchy: SmoothStepEdge,
  occupies: SmoothStepEdge,
  linked_to: SmoothStepEdge,
};

// Default edge options with modern styling
export const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { strokeWidth: 1.5, stroke: '#94a3b8' },
  markerEnd: 'edge-circle',
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
