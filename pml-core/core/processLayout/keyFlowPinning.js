/**
 * LongestPathStrategy — default. Selects the longest DAG path by hop count.
 * Deterministic via lexical tie-breaking on node IDs.
 */
export const LongestPathStrategy = {
    identify: (graph, ranking) => identifyKeyFlow(graph, ranking),
};
/**
 * AnnotationKeyFlowStrategy — respects explicit `key:` PML annotations.
 * Scores annotated edges with a 10× hop bonus, so the user's marked path
 * wins over a longer un-annotated path. Falls back to longest-path when
 * no key-flow edges are present (identical output to LongestPathStrategy).
 */
export const AnnotationKeyFlowStrategy = {
    identify: (graph, ranking) => identifyKeyFlowAnnotated(graph, ranking),
};
function edgeKey(from, to) {
    return `${from}->${to}`;
}
function buildDagAdjacency(graph, backEdges) {
    const adjacency = new Map();
    const backEdgeSet = new Set(backEdges.map((e) => edgeKey(e.from, e.to)));
    for (const node of graph.nodes) {
        adjacency.set(node.id, []);
    }
    for (const edge of graph.edges) {
        if (backEdgeSet.has(edgeKey(edge.source, edge.target))) {
            continue;
        }
        adjacency.get(edge.source)?.push(edge.target);
    }
    for (const neighbors of adjacency.values()) {
        neighbors.sort();
    }
    return adjacency;
}
export function identifyKeyFlow(graph, ranking) {
    const adjacency = buildDagAdjacency(graph, ranking.backEdges);
    const topologicalOrder = ranking.topologicalOrder;
    const pathLength = new Map();
    const predecessor = new Map();
    for (const node of topologicalOrder) {
        pathLength.set(node, pathLength.get(node) || 1);
        predecessor.set(node, predecessor.get(node) ?? null);
        const currentLen = pathLength.get(node) || 1;
        for (const next of adjacency.get(node) || []) {
            const candidateLen = currentLen + 1;
            const existingLen = pathLength.get(next) || 1;
            const existingPred = predecessor.get(next);
            const shouldReplace = candidateLen > existingLen ||
                (candidateLen === existingLen && (existingPred == null || node.localeCompare(existingPred) < 0));
            if (shouldReplace) {
                pathLength.set(next, candidateLen);
                predecessor.set(next, node);
            }
        }
    }
    const sinks = ranking.sinks.length > 0
        ? ranking.sinks
        : graph.nodes.map((n) => n.id).sort();
    let bestEndNode = null;
    let bestLength = 0;
    for (const nodeId of sinks) {
        const len = pathLength.get(nodeId) || 1;
        if (len > bestLength) {
            bestLength = len;
            bestEndNode = nodeId;
            continue;
        }
        if (len === bestLength && bestEndNode !== null && nodeId.localeCompare(bestEndNode) < 0) {
            bestEndNode = nodeId;
        }
    }
    if (!bestEndNode && topologicalOrder.length > 0) {
        bestEndNode = topologicalOrder[topologicalOrder.length - 1];
        bestLength = pathLength.get(bestEndNode) || 1;
    }
    const keyFlowPath = [];
    let cursor = bestEndNode;
    while (cursor) {
        keyFlowPath.push(cursor);
        cursor = predecessor.get(cursor) || null;
    }
    keyFlowPath.reverse();
    const keyFlowNodes = new Set(keyFlowPath);
    const joinDepths = pinKeyFlowJoinDepths(ranking, keyFlowPath);
    return {
        keyFlowPath,
        keyFlowNodes,
        joinDepths,
        score: bestLength,
    };
}
function identifyKeyFlowAnnotated(graph, ranking) {
    const annotatedEdgeSet = new Set(graph.edges.filter((e) => e.keyFlow).map((e) => edgeKey(e.source, e.target)));
    // No annotations → fall back to standard longest path
    if (annotatedEdgeSet.size === 0)
        return identifyKeyFlow(graph, ranking);
    const adjacency = buildDagAdjacency(graph, ranking.backEdges);
    const topologicalOrder = ranking.topologicalOrder;
    const ANNOTATION_BONUS = 10;
    const pathScore = new Map();
    const predecessor = new Map();
    for (const node of topologicalOrder) {
        pathScore.set(node, pathScore.get(node) ?? 1);
        predecessor.set(node, predecessor.get(node) ?? null);
        const currentScore = pathScore.get(node) ?? 1;
        for (const next of adjacency.get(node) ?? []) {
            const edgeBonus = annotatedEdgeSet.has(edgeKey(node, next)) ? ANNOTATION_BONUS : 1;
            const candidateScore = currentScore + edgeBonus;
            const existingScore = pathScore.get(next) ?? 1;
            const existingPred = predecessor.get(next);
            if (candidateScore > existingScore ||
                (candidateScore === existingScore && (existingPred == null || node.localeCompare(existingPred) < 0))) {
                pathScore.set(next, candidateScore);
                predecessor.set(next, node);
            }
        }
    }
    const sinks = ranking.sinks.length > 0 ? ranking.sinks : graph.nodes.map((n) => n.id).sort();
    let bestEndNode = null;
    let bestScore = 0;
    for (const nodeId of sinks) {
        const score = pathScore.get(nodeId) ?? 1;
        if (score > bestScore || (score === bestScore && bestEndNode !== null && nodeId.localeCompare(bestEndNode) < 0)) {
            bestScore = score;
            bestEndNode = nodeId;
        }
    }
    if (!bestEndNode && topologicalOrder.length > 0) {
        bestEndNode = topologicalOrder[topologicalOrder.length - 1];
        bestScore = pathScore.get(bestEndNode) ?? 1;
    }
    const keyFlowPath = [];
    let cursor = bestEndNode;
    while (cursor) {
        keyFlowPath.push(cursor);
        cursor = predecessor.get(cursor) ?? null;
    }
    keyFlowPath.reverse();
    return {
        keyFlowPath,
        keyFlowNodes: new Set(keyFlowPath),
        joinDepths: pinKeyFlowJoinDepths(ranking, keyFlowPath),
        score: bestScore,
    };
}
export function pinKeyFlowJoinDepths(ranking, keyFlowPath) {
    const joinDepths = new Map();
    for (const nodeId of keyFlowPath) {
        joinDepths.set(nodeId, ranking.ranks.get(nodeId) || 0);
    }
    return joinDepths;
}
