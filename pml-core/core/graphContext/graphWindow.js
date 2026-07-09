/**
 * Graph Window — Subgraph Extraction
 *
 * Extracts a focused subgraph from a NormalizedProcessGraph based on a
 * focus type and optional focus ID. The result is a trimmed graph that
 * is deterministic (zero AI involvement) and PML-faithful.
 *
 * Focus types supported in v1:
 *   'actor'     — all nodes + edges scoped to a single actor
 *   'decision'  — a decision/route node plus its reachable branches
 *   'flow-path' — linear or branching path traced from a start node
 *   'full'      — passthrough, returns entire graph
 */
// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
export function extractGraphWindow(fullGraph, options) {
    const { focusType, focusId, maxDepth = 2, includeMetadata = false, includeEdgeDetails = true } = options;
    if (focusType === 'full') {
        return windowResult(fullGraph, 0, 'Full process graph');
    }
    if (!focusId) {
        throw new Error(`focusId is required for focusType '${focusType}'`);
    }
    const nodeSet = new Set();
    const actorSet = new Set();
    const edgeSet = new Set();
    switch (focusType) {
        case 'actor':
            collectActorSubgraph(fullGraph, focusId, nodeSet, actorSet, edgeSet);
            break;
        case 'decision':
            collectDecisionSubgraph(fullGraph, focusId, maxDepth, nodeSet, actorSet, edgeSet);
            break;
        case 'flow-path':
            collectFlowPathSubgraph(fullGraph, focusId, maxDepth, nodeSet, actorSet, edgeSet);
            break;
    }
    const graph = buildSubgraph(fullGraph, nodeSet, actorSet, edgeSet, includeMetadata, includeEdgeDetails);
    const summary = buildSummary(focusType, focusId, graph);
    return windowResult(graph, computeDepth(graph), summary);
}
// ---------------------------------------------------------------------------
// Actor-centric extraction
// ---------------------------------------------------------------------------
function collectActorSubgraph(full, actorId, nodes, actors, edges) {
    // Collect nodes belonging to this actor
    const candidateNodes = full.nodes.filter((n) => n.actor === actorId || n.scope === 'inScope');
    for (const node of candidateNodes) {
        nodes.add(node.id);
    }
    actors.add(actorId);
    // Collect edges where both ends are in the node set
    for (const edge of full.edges) {
        if (nodes.has(edge.source) || nodes.has(edge.target)) {
            edges.add(edge.id);
            // Include the connected node even if owned by another actor
            if (nodes.has(edge.source))
                nodes.add(edge.target);
            if (nodes.has(edge.target))
                nodes.add(edge.source);
        }
    }
    // Collect all actors present in the window
    for (const node of full.nodes) {
        if (nodes.has(node.id) && node.actor && node.actor !== actorId) {
            actors.add(node.actor);
        }
    }
}
// ---------------------------------------------------------------------------
// Decision-centric extraction
// ---------------------------------------------------------------------------
function collectDecisionSubgraph(full, decisionId, maxDepth, nodes, actors, edges) {
    // Validate it's actually a decision/route node
    const decisionNode = full.nodes.find((n) => n.id === decisionId);
    if (!decisionNode || decisionNode.type !== 'decision') {
        throw new Error(`Node '${decisionId}' is not a decision or route node`);
    }
    // BFS from decision node in both directions
    const visited = new Set();
    const queue = [{ id: decisionId, depth: 0 }];
    visited.add(decisionId);
    while (queue.length > 0) {
        const current = queue.shift();
        nodes.add(current.id);
        if (current.depth >= maxDepth)
            continue;
        // Follow outgoing edges
        for (const edge of full.edges) {
            if (edge.source === current.id && !visited.has(edge.target)) {
                visited.add(edge.target);
                queue.push({ id: edge.target, depth: current.depth + 1 });
                edges.add(edge.id);
            }
        }
        // Follow incoming edges
        for (const edge of full.edges) {
            if (edge.target === current.id && !visited.has(edge.source)) {
                visited.add(edge.source);
                queue.push({ id: edge.source, depth: current.depth + 1 });
                edges.add(edge.id);
            }
        }
    }
    // Include actors for collected nodes
    for (const node of full.nodes) {
        if (nodes.has(node.id) && node.actor) {
            actors.add(node.actor);
        }
    }
}
// ---------------------------------------------------------------------------
// Flow-path extraction (trace from a start node)
// ---------------------------------------------------------------------------
function collectFlowPathSubgraph(full, startId, maxDepth, nodes, actors, edges) {
    const visited = new Set();
    const queue = [{ id: startId, depth: 0 }];
    visited.add(startId);
    while (queue.length > 0) {
        const current = queue.shift();
        nodes.add(current.id);
        if (current.depth >= maxDepth)
            continue;
        for (const edge of full.edges) {
            if (edge.source === current.id && !visited.has(edge.target)) {
                visited.add(edge.target);
                queue.push({ id: edge.target, depth: current.depth + 1 });
                edges.add(edge.id);
            }
        }
    }
    for (const node of full.nodes) {
        if (nodes.has(node.id) && node.actor) {
            actors.add(node.actor);
        }
    }
}
// ---------------------------------------------------------------------------
// Subgraph builder
// ---------------------------------------------------------------------------
function buildSubgraph(full, nodeSet, actorSet, edgeSet, includeMetadata, includeEdgeDetails) {
    const nodes = full.nodes
        .filter((n) => nodeSet.has(n.id))
        .map((n) => {
        if (!includeMetadata) {
            const { metadata, ...rest } = n;
            return { ...rest, metadata: undefined };
        }
        return n;
    });
    const edges = full.edges
        .filter((e) => edgeSet.has(e.id))
        .map((e) => {
        if (!includeEdgeDetails) {
            return { id: e.id, source: e.source, target: e.target };
        }
        return e;
    });
    const actors = full.actors.filter((a) => actorSet.has(a.id));
    return {
        processId: full.processId,
        processName: full.processName,
        level: full.level,
        parent: full.parent,
        version: full.version,
        status: full.status,
        nodes,
        edges,
        actors,
        inboundEvents: full.inboundEvents.filter((id) => nodeSet.has(id)),
        outboundEvents: full.outboundEvents.filter((id) => nodeSet.has(id)),
    };
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function computeDepth(graph) {
    let max = 0;
    const inDegree = new Map();
    const dist = new Map();
    for (const node of graph.nodes) {
        inDegree.set(node.id, 0);
        dist.set(node.id, 0);
    }
    for (const edge of graph.edges) {
        inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }
    const queue = graph.nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0).map((n) => n.id);
    for (const id of queue)
        dist.set(id, 0);
    while (queue.length > 0) {
        const id = queue.shift();
        const d = dist.get(id) ?? 0;
        max = Math.max(max, d);
        for (const edge of graph.edges) {
            if (edge.source === id) {
                const nd = d + 1;
                if (nd > (dist.get(edge.target) ?? 0)) {
                    dist.set(edge.target, nd);
                    queue.push(edge.target);
                }
            }
        }
    }
    return max;
}
function buildSummary(focusType, focusId, graph) {
    const actorList = graph.actors.map((a) => a.label || a.id).join(', ');
    const parts = [];
    switch (focusType) {
        case 'actor':
            parts.push(`Actor-focused view: "${focusId}" with ${graph.nodes.length} node(s) and ${graph.edges.length} edge(s).`);
            break;
        case 'decision':
            parts.push(`Decision-focused view around "${focusId}" with ${graph.nodes.length} node(s) and ${graph.edges.length} edge(s).`);
            break;
        case 'flow-path':
            parts.push(`Flow-path from "${focusId}" with ${graph.nodes.length} node(s) and ${graph.edges.length} edge(s).`);
            break;
    }
    if (actorList)
        parts.push(`Actors in view: ${actorList}.`);
    const inbound = graph.inboundEvents;
    const outbound = graph.outboundEvents;
    if (inbound.length > 0)
        parts.push(`Inbound events: ${inbound.join(', ')}.`);
    if (outbound.length > 0)
        parts.push(`Outbound events: ${outbound.join(', ')}.`);
    return parts.join(' ');
}
function windowResult(graph, depth, summary) {
    return {
        graph,
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        depth,
        summary,
    };
}
