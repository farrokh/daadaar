import type { Edge, Node } from 'reactflow';
import { calculateGridLayout } from './graph-layout';

/**
 * Layout for organization people view
 * Center: Organization node
 * Left: Sub-organizations (hierarchy edges)
 * Right: Members (occupies edges)
 */
export const calculateOrganizationPeopleLayout = (nodes: Node[], edges: Edge[]): Node[] => {
  if (nodes.length === 0) return nodes;

  // Find the organization node (should be only one)
  const orgNode = nodes.find(n => n.type === 'organization');
  if (!orgNode) return calculateGridLayout(nodes, edges);

  const verticalSpacing = 220;
  const horizontalOffset = 500;

  const positionedNodes: Node[] = [
    {
      ...orgNode,
      position: { x: 0, y: 0 },
    },
  ];

  // Map of nodes for quick lookup by id
  const nodeById = new Map<string, Node>(nodes.map(node => [node.id, node]));

  const getOrgDepth = (node: Node, seen: Set<string> = new Set()): number => {
    if (node.id === orgNode.id) return 0;
    const parentOrgId = (node.data as { parentOrgId?: number }).parentOrgId;
    if (!parentOrgId) return 1;
    const parentNode = nodeById.get(`org-${parentOrgId}`);
    if (!parentNode) return 1;
    if (seen.has(node.id)) return 1;
    seen.add(node.id);
    return Math.min(getOrgDepth(parentNode, seen) + 1, 2);
  };

  // Group organization nodes by depth
  const depthGroups = new Map<number, Node[]>();

  for (const node of nodes) {
    if (node.id === orgNode.id || node.type !== 'organization') continue;
    const depth = getOrgDepth(node);
    const group = depthGroups.get(depth) ?? [];
    group.push(node);
    depthGroups.set(depth, group);
  }

  // Position organization nodes per depth group
  const sortedDepths = Array.from(depthGroups.keys()).sort((a, b) => a - b);
  for (const depth of sortedDepths) {
    const group = depthGroups.get(depth);
    if (!group) continue;
    const totalHeight = (group.length - 1) * verticalSpacing;
    group.forEach((node, index) => {
      const y = index * verticalSpacing - totalHeight / 2;
      positionedNodes.push({
        ...node,
        position: { x: -horizontalOffset * depth, y },
      });
    });
  }

  // Position individuals on the RIGHT
  const individuals = nodes.filter(node => node.type === 'individual');
  individuals.forEach((node, index) => {
    const totalHeight = (individuals.length - 1) * verticalSpacing;
    const y = index * verticalSpacing - totalHeight / 2;

    positionedNodes.push({
      ...node,
      position: { x: horizontalOffset, y },
    });
  });

  return positionedNodes;
};
