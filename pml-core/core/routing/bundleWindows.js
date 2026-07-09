/**
 * Bundle Windows — routing-stage sibling grouping.
 *
 * Constructs optimization windows over already-routed edges.
 * A window = one edge + its immediate siblings sharing the same source
 * OR the same target. This is the operational scope for world evaluation.
 *
 * Distinct from spatialNegotiation.ts (which works on unrouted topology
 * before channel allocation). Bundle windows operate on fully routed edges.
 */
import { appendToMap, stableSortById } from '../processLayout/stageHelpers';
/**
 * Groups routed edges into sibling bundles.
 * Each bundle contains 2+ edges sharing a source or target node.
 * Single-edge connections are not bundled (no siblings to evaluate against).
 * Output is deterministically ordered by windowId.
 */
export function buildBundleWindows(edges, nodeMap) {
    const bySource = new Map();
    const byTarget = new Map();
    for (const edge of edges) {
        if (edge.flowLayer === 'hidden' ||
            !edge.routing ||
            !edge.routing.waypoints ||
            edge.routing.waypoints.length < 2) {
            continue;
        }
        appendToMap(bySource, edge.source, edge);
        appendToMap(byTarget, edge.target, edge);
    }
    const bundles = [];
    for (const [nodeId, edgeList] of bySource) {
        if (edgeList.length < 2)
            continue;
        bundles.push({
            windowId: `src-${nodeId}`,
            sharedNodeId: nodeId,
            sharedRole: 'source',
            edges: stableSortById(edgeList),
        });
    }
    for (const [nodeId, edgeList] of byTarget) {
        if (edgeList.length < 2)
            continue;
        bundles.push({
            windowId: `tgt-${nodeId}`,
            sharedNodeId: nodeId,
            sharedRole: 'target',
            edges: stableSortById(edgeList),
        });
    }
    return bundles.sort((a, b) => a.windowId.localeCompare(b.windowId));
}
