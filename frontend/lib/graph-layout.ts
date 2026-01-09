import type { Edge, Node } from 'reactflow';

// Layout algorithm: simple grid layout
export const calculateGridLayout = (nodes: Node[], edges: Edge[]): Node[] => {
  if (nodes.length === 0) return nodes;

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();

  // Initialize children map
  for (const n of nodes) {
    childrenMap.set(n.id, []);
  }

  // Build tree structure from edges
  // Prioritize hierarchy edges to determine the visual tree structure
  for (const edge of edges) {
    // Only consider edges between visible nodes
    if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
      // We assume 'hierarchy' edges define the parent-child relationship for layout
      // But we'll accept any edge if no hierarchy exists, filtered by the view logic
      childrenMap.get(edge.source)?.push(edge.target);
      parentMap.set(edge.target, edge.source);
    }
  }

  // Find roots (nodes with no parents in the current visible set)
  // Or nodes where the parent is not in the visible set
  let roots = nodes.filter(n => !parentMap.has(n.id));

  // Fallback: If no roots found (e.g. cycles), pick the first node
  if (roots.length === 0 && nodes.length > 0) {
    roots = [nodes[0]];
  }

  // Sort roots by ID to ensure stable layout
  roots.sort((a, b) => a.id.localeCompare(b.id));

  const positions = new Map<string, { x: number; y: number }>();
  // Use a visited set to handle DAGs/cycles by only placing a node once (as a child of its first encountered parent)
  const visited = new Set<string>();

  let nextY = 0;
  const X_SPACING = 500;
  const Y_SPACING = 220; // Height of card + gap

  const layoutNode = (nodeId: string, depth: number): number => {
    // If already placed, return its Y (though in a strict tree walk we shouldn't hit this often if filtered correctly)
    if (visited.has(nodeId)) {
      return positions.get(nodeId)?.y || 0;
    }
    visited.add(nodeId);

    const children = childrenMap.get(nodeId) || [];
    // Sort children for stability
    children.sort();

    // Filter out already visited children (prevents cycles and multi-parent weirdness)
    const unvisitedChildren = children.filter(c => !visited.has(c));

    if (unvisitedChildren.length === 0) {
      // Leaf node: takes up one "row"
      const y = nextY;
      positions.set(nodeId, { x: depth * X_SPACING, y });
      nextY += Y_SPACING;
      return y;
    }

    // Recursively layout children
    const childYs: number[] = [];
    for (const childId of unvisitedChildren) {
      childYs.push(layoutNode(childId, depth + 1));
    }

    // Place parent centered relative to its children
    const minY = Math.min(...childYs);
    const maxY = Math.max(...childYs);
    const y = (minY + maxY) / 2;

    positions.set(nodeId, { x: depth * X_SPACING, y });
    return y;
  };

  // Run layout for each root
  for (const root of roots) {
    layoutNode(root.id, 0);
    // Add extra gap between separate trees/connected components
    nextY += Y_SPACING / 2;
  }

  // Handle any disconnected nodes that weren't reached (safeguard)
  for (const node of nodes) {
    if (!positions.has(node.id)) {
      positions.set(node.id, { x: 0, y: nextY });
      nextY += Y_SPACING;
    }
  }

  return nodes.map(node => ({
    ...node,
    position: positions.get(node.id) || { x: 0, y: 0 },
  }));
};
