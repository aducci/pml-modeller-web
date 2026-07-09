/**
 * Depth Controller — Depth-Limited BFS Traversal
 *
 * Provides bounded graph traversal with cycle safety via visited set.
 * Used by graphWindow to limit extraction depth.
 *
 * The controller supports both forward-only (outgoing edges) and
 * bidirectional (incoming + outgoing) traversal modes.
 */
// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
export function traverseGraph(graph, config) {
    const { startIds, maxDepth = 3, direction = 'forward' } = config;
    const visited = new Set();
    const depthMap = new Map();
    const edgeIds = new Set();
    // Build lookup maps for efficient traversal
    const outgoingEdges = new Map();
    const incomingEdges = new Map();
    for (const edge of graph.edges) {
        if (!outgoingEdges.has(edge.source)) {
            outgoingEdges.set(edge.source, []);
        }
        outgoingEdges.get(edge.source).push(edge);
        if (!incomingEdges.has(edge.target)) {
            incomingEdges.set(edge.target, []);
        }
        incomingEdges.get(edge.target).push(edge);
    }
    // BFS queue
    const queue = [];
    for (const startId of startIds) {
        if (graph.nodes.some((n) => n.id === startId)) {
            visited.add(startId);
            depthMap.set(startId, 0);
            queue.push({ id: startId, depth: 0 });
        }
    }
    let head = 0;
    while (head < queue.length) {
        const current = queue[head++];
        if (current.depth >= maxDepth)
            continue;
        const nextDepth = current.depth + 1;
        // Forward edges (source → target)
        const outgoing = outgoingEdges.get(current.id) || [];
        for (const edge of outgoing) {
            edgeIds.add(edge.id);
            if (!visited.has(edge.target)) {
                visited.add(edge.target);
                depthMap.set(edge.target, nextDepth);
                queue.push({ id: edge.target, depth: nextDepth });
            }
        }
        // Backward edges (target → source) for bidirectional mode
        if (direction === 'bidirectional') {
            const incoming = incomingEdges.get(current.id) || [];
            for (const edge of incoming) {
                edgeIds.add(edge.id);
                if (!visited.has(edge.source)) {
                    visited.add(edge.source);
                    depthMap.set(edge.source, nextDepth);
                    queue.push({ id: edge.source, depth: nextDepth });
                }
            }
        }
    }
    return {
        nodeIds: visited,
        edgeIds,
        depthMap,
    };
}
/**
 * Expands a node set by one level (outgoing edges only).
 * Useful for adding boundary-adjacent context nodes.
 */
export function expandOneLevel(graph, nodeIds) {
    const resultNodes = new Set(nodeIds);
    const resultEdges = new Set();
    for (const edge of graph.edges) {
        if (resultNodes.has(edge.source) && !resultNodes.has(edge.target)) {
            resultNodes.add(edge.target);
            resultEdges.add(edge.id);
        }
        if (resultNodes.has(edge.target) && !resultNodes.has(edge.source)) {
            resultNodes.add(edge.source);
            resultEdges.add(edge.id);
        }
    }
    return { nodeIds: resultNodes, edgeIds: resultEdges };
}
