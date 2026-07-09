/**
 * Semantic Filter — Actor-Centric and Decision-Centric Filters
 *
 * Filters a NormalizedProcessGraph by actor (show all nodes belonging to
 * one actor + connected context) or by decision (show a decision + its
 * branches and reachable nodes). Both filters use depthController for
 * bounded traversal.
 */
import { traverseGraph, expandOneLevel } from './depthController';
export const DEFAULT_ACTOR_FILTER = {
    includeBoundaryContext: true,
    boundaryDepth: 1,
};
export const DEFAULT_DECISION_FILTER = {
    includeInbound: true,
    inboundDepth: 1,
    outboundDepth: 2,
};
// ---------------------------------------------------------------------------
// Actor-centric filter
// ---------------------------------------------------------------------------
/**
 * Filters the graph to show only nodes belonging to the specified actor,
 * plus optional one-hop boundary context from other actors.
 */
export function filterByActor(graph, actorId, options = {}) {
    const opts = { ...DEFAULT_ACTOR_FILTER, ...options };
    // Find nodes owned by this actor
    const actorNodeIds = graph.nodes
        .filter((n) => n.actor === actorId)
        .map((n) => n.id);
    const nodeIds = new Set(actorNodeIds);
    const edgeIds = new Set();
    const actorIds = new Set([actorId]);
    if (opts.includeBoundaryContext && actorNodeIds.length > 0) {
        // Expand one level to catch connected nodes from other actors
        const expanded = expandOneLevel(graph, nodeIds);
        for (const id of expanded.nodeIds)
            nodeIds.add(id);
        for (const id of expanded.edgeIds)
            edgeIds.add(id);
        // Collect actors for boundary nodes
        for (const node of graph.nodes) {
            if (nodeIds.has(node.id) && node.actor && !actorIds.has(node.actor)) {
                actorIds.add(node.actor);
            }
        }
    }
    // Collect edges where both ends are in the node set
    for (const edge of graph.edges) {
        if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
            edgeIds.add(edge.id);
        }
    }
    return { nodeIds, edgeIds, actorIds };
}
// ---------------------------------------------------------------------------
// Decision-centric filter
// ---------------------------------------------------------------------------
/**
 * Filters the graph to show a decision node plus its reachable branches
 * and inbound context.
 */
export function filterByDecision(graph, decisionId, options = {}) {
    const opts = { ...DEFAULT_DECISION_FILTER, ...options };
    // Validate the decision exists
    const decision = graph.nodes.find((n) => n.id === decisionId);
    if (!decision) {
        throw new Error(`Decision node '${decisionId}' not found`);
    }
    if (decision.type !== 'decision') {
        throw new Error(`Node '${decisionId}' is not a decision node (type: ${decision.type})`);
    }
    const nodeIds = new Set([decisionId]);
    const edgeIds = new Set();
    const actorIds = new Set();
    // Outgoing branches (forward only)
    const forwardTraversal = traverseGraph(graph, {
        startIds: [decisionId],
        maxDepth: opts.outboundDepth,
        direction: 'forward',
    });
    for (const id of forwardTraversal.nodeIds)
        nodeIds.add(id);
    for (const id of forwardTraversal.edgeIds)
        edgeIds.add(id);
    // Inbound context (backward from decision)
    if (opts.includeInbound) {
        const backwardTraversal = traverseGraph(graph, {
            startIds: [decisionId],
            maxDepth: opts.inboundDepth,
            direction: 'forward', // We need reverse: edges targeting decision
        });
        // Actually do reverse: find edges whose target is in our set
        for (const edge of graph.edges) {
            if (edge.target === decisionId) {
                edgeIds.add(edge.id);
                nodeIds.add(edge.source);
            }
        }
    }
    // Collect actors for all nodes in the window
    for (const node of graph.nodes) {
        if (nodeIds.has(node.id) && node.actor) {
            actorIds.add(node.actor);
        }
    }
    return { nodeIds, edgeIds, actorIds };
}
