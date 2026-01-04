import type { Edge, Node } from 'reactflow';

// Layout algorithm: simple grid layout
export const calculateGridLayout = (nodes: Node[], edges: Edge[]): Node[] => {
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
};
