function edgeKey(from, to) {
    return `${from}->${to}`;
}
function buildForwardAdjacency(graph, backEdgeSet) {
    const adj = new Map();
    for (const node of graph.nodes)
        adj.set(node.id, []);
    for (const edge of graph.edges) {
        if (backEdgeSet?.has(edgeKey(edge.source, edge.target)))
            continue;
        adj.get(edge.source)?.push(edge.target);
    }
    for (const neighbors of adj.values())
        neighbors.sort();
    return adj;
}
function buildBiAdjacency(graph, backEdgeSet) {
    const predecessors = new Map();
    const successors = new Map();
    for (const node of graph.nodes) {
        predecessors.set(node.id, []);
        successors.set(node.id, []);
    }
    for (const edge of graph.edges) {
        if (backEdgeSet.has(edgeKey(edge.source, edge.target)))
            continue;
        predecessors.get(edge.target)?.push(edge.source);
        successors.get(edge.source)?.push(edge.target);
    }
    return { predecessors, successors };
}
export function detectBackEdges(graph) {
    const adjacency = buildForwardAdjacency(graph);
    const incomingCount = new Map();
    for (const node of graph.nodes)
        incomingCount.set(node.id, 0);
    for (const edge of graph.edges) {
        incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
    }
    const visited = new Set();
    const recursionStack = new Set();
    const backEdgeKeys = new Set();
    const dfs = (nodeId) => {
        visited.add(nodeId);
        recursionStack.add(nodeId);
        for (const next of adjacency.get(nodeId) || []) {
            if (!visited.has(next)) {
                dfs(next);
                continue;
            }
            if (recursionStack.has(next)) {
                backEdgeKeys.add(edgeKey(nodeId, next));
            }
        }
        recursionStack.delete(nodeId);
    };
    const inboundOrder = (graph.inboundEvents || []).slice().sort();
    const sourceOrder = graph.nodes
        .map((n) => n.id)
        .filter((id) => (incomingCount.get(id) || 0) === 0)
        .sort();
    const alphabeticalOrder = graph.nodes.map((n) => n.id).sort();
    const nodeOrder = Array.from(new Set([...inboundOrder, ...sourceOrder, ...alphabeticalOrder]));
    for (const nodeId of nodeOrder) {
        if (!visited.has(nodeId)) {
            dfs(nodeId);
        }
    }
    const backEdges = [];
    for (const edge of graph.edges) {
        if (backEdgeKeys.has(edgeKey(edge.source, edge.target))) {
            backEdges.push({ from: edge.source, to: edge.target });
        }
    }
    backEdges.sort((a, b) => {
        const sourceCmp = a.from.localeCompare(b.from);
        if (sourceCmp !== 0)
            return sourceCmp;
        return a.to.localeCompare(b.to);
    });
    return backEdges;
}
export function topologicalSort(graph, backEdges) {
    const backEdgeSet = new Set(backEdges.map((edge) => edgeKey(edge.from, edge.to)));
    const inDegree = new Map();
    const adjacency = new Map();
    for (const node of graph.nodes) {
        inDegree.set(node.id, 0);
        adjacency.set(node.id, []);
    }
    for (const edge of graph.edges) {
        if (backEdgeSet.has(edgeKey(edge.source, edge.target))) {
            continue;
        }
        adjacency.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
    for (const neighbors of adjacency.values()) {
        neighbors.sort();
    }
    const queue = Array.from(inDegree.entries())
        .filter(([, degree]) => degree === 0)
        .map(([id]) => id)
        .sort();
    const topoOrder = [];
    while (queue.length > 0) {
        const current = queue.shift();
        topoOrder.push(current);
        for (const next of adjacency.get(current) || []) {
            const nextDegree = (inDegree.get(next) || 0) - 1;
            inDegree.set(next, nextDegree);
            if (nextDegree === 0) {
                queue.push(next);
                queue.sort();
            }
        }
    }
    if (topoOrder.length !== graph.nodes.length) {
        const included = new Set(topoOrder);
        const remainder = graph.nodes
            .map((n) => n.id)
            .filter((id) => !included.has(id))
            .sort();
        topoOrder.push(...remainder);
    }
    return topoOrder;
}
export function longestPathRanking(graph, topologicalOrder, backEdges) {
    const backEdgeSet = new Set(backEdges.map((edge) => edgeKey(edge.from, edge.to)));
    const adjacency = buildForwardAdjacency(graph, backEdgeSet);
    const ranks = new Map();
    for (const nodeId of topologicalOrder) {
        if (!ranks.has(nodeId)) {
            ranks.set(nodeId, 0);
        }
        const currentRank = ranks.get(nodeId) || 0;
        for (const next of adjacency.get(nodeId) || []) {
            const candidateRank = currentRank + 1;
            const existing = ranks.get(next) || 0;
            if (candidateRank > existing) {
                ranks.set(next, candidateRank);
            }
        }
    }
    return ranks;
}
function computeReachabilityFromInbound(graph) {
    const adjacency = buildForwardAdjacency(graph);
    const queue = [...graph.inboundEvents].sort();
    const visited = new Set();
    while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current)) {
            continue;
        }
        visited.add(current);
        for (const next of adjacency.get(current) || []) {
            if (!visited.has(next)) {
                queue.push(next);
            }
        }
    }
    return visited;
}
/**
 * Post-ranking depth penalty for cross-lane bridge nodes.
 *
 * A cross-lane bridge is a node with no lane group (per the active laneMode's
 * grouping key — actor, or app for byApp) whose predecessors all belong to one
 * group and whose successors all belong to a different group. Placing it at the
 * same depth as same-group siblings of its predecessors creates routing overlap
 * (a cross-lane forward edge shares the horizontal band with a same-lane forward
 * edge). Bumping the bridge by +1 depth shifts it past that conflict zone, then
 * forward-propagation keeps all descendants consistent.
 *
 * Uses the same GroupingStrategy as lane geometry (Phase B) so the correction
 * applies consistently across laneMode — including 'byApp', where the grouping
 * key is the node's app reference rather than its actor.
 *
 * Condition for a penalty:
 *   - node has no group key under the active grouping strategy
 *   - all grouped predecessors share exactly one group (pred_group)
 *   - all grouped successors share exactly one group (succ_group)
 *   - pred_group !== succ_group
 */
function applyCrossLanePenalty(ranks, graph, topologicalOrder, backEdges, strategy) {
    const backEdgeSet = new Set(backEdges.map((e) => edgeKey(e.from, e.to)));
    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
    const { predecessors, successors } = buildBiAdjacency(graph, backEdgeSet);
    const bumped = new Set();
    for (const nodeId of topologicalOrder) {
        const node = nodeMap.get(nodeId);
        if (!node || strategy.groupKeyOf(node) !== undefined)
            continue;
        const predActors = new Set((predecessors.get(nodeId) ?? [])
            .map((id) => strategy.groupKeyOf(nodeMap.get(id) ?? {}))
            .filter((a) => a !== undefined));
        const succActors = new Set((successors.get(nodeId) ?? [])
            .map((id) => strategy.groupKeyOf(nodeMap.get(id) ?? {}))
            .filter((a) => a !== undefined));
        if (predActors.size === 1 && succActors.size === 1) {
            const [predActor] = predActors;
            const [succActor] = succActors;
            if (predActor !== succActor) {
                ranks.set(nodeId, (ranks.get(nodeId) ?? 0) + 1);
                bumped.add(nodeId);
            }
        }
    }
    if (bumped.size === 0)
        return;
    // Re-propagate: walk topological order and push max-rank forward so all
    // successors of bumped nodes are updated consistently.
    for (const nodeId of topologicalOrder) {
        const currentRank = ranks.get(nodeId) ?? 0;
        for (const next of successors.get(nodeId) ?? []) {
            const candidate = currentRank + 1;
            if (candidate > (ranks.get(next) ?? 0)) {
                ranks.set(next, candidate);
            }
        }
    }
}
export function computeRanking(graph, groupingStrategy) {
    const backEdges = detectBackEdges(graph);
    const topologicalOrder = topologicalSort(graph, backEdges);
    const ranks = longestPathRanking(graph, topologicalOrder, backEdges);
    applyCrossLanePenalty(ranks, graph, topologicalOrder, backEdges, groupingStrategy);
    const incomingCount = new Map();
    const outgoingCount = new Map();
    for (const node of graph.nodes) {
        incomingCount.set(node.id, 0);
        outgoingCount.set(node.id, 0);
    }
    for (const edge of graph.edges) {
        incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
        outgoingCount.set(edge.source, (outgoingCount.get(edge.source) || 0) + 1);
    }
    const sources = graph.nodes
        .map((n) => n.id)
        .filter((id) => (incomingCount.get(id) || 0) === 0)
        .sort();
    const sinks = graph.nodes
        .map((n) => n.id)
        .filter((id) => (outgoingCount.get(id) || 0) === 0)
        .sort();
    const reachable = computeReachabilityFromInbound(graph);
    const unreachableNodes = graph.nodes
        .map((n) => n.id)
        .filter((id) => !reachable.has(id))
        .sort();
    return {
        ranks,
        topologicalOrder,
        backEdges,
        sources,
        sinks,
        unreachableNodes,
    };
}
