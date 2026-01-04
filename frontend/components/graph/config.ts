import type { DefaultEdgeOptions, NodeTypes } from 'reactflow';
import OrganizationNode from './organization-node';
import PersonNode from './person-node';
import ReportNode from './report-node';

// Define node types
export const nodeTypes: NodeTypes = {
  organization: OrganizationNode,
  individual: PersonNode,
  report: ReportNode,
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
  organizationName?: string;
  individualId?: number;
  individualName?: string;
};
