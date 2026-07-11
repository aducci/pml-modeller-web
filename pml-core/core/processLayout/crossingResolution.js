// Stage: Crossing Resolution (Phase C helper, runs after edge routing)
// reads:  edges (routing.waypoints, keyFlow), nodes (laneId)
// writes: edges (routing.waypoints — interior waypoints only; port-anchored
//         first/last waypoints are never moved)
//
// Channel allocation (channelAllocation.ts) prevents same-direction edges
// from stacking within a lane, but it has no notion of geometric crossings
// between edges that were never in "conflict" by its own bookkeeping — most
// notably edges with a laneless endpoint (terminal events, unassigned
// gateways), which all collapse onto channel 0 regardless of which lane
// they originate from. This stage runs a true segment-intersection check on
// the routed polylines and nudges the lower-priority edge in each crossing
// pair sideways until it clears, or gives up after a bounded number of tries.
//
// This intentionally only fixes literal intersections, not near-misses
// (segments that pass close but don't touch). A "nudge if too close"
// heuristic was tried and reverted: greedily pushing one edge away from
// another can shove it into a third edge's path, and fixing that can shove
// a fourth — an unbounded whack-a-mole with no local stopping rule. Minimum
// edge-to-edge clearance needs a real global solve (e.g. widening channel
// allocation's corridor width), not a per-pair post-process.
import { segmentIntersection } from './convergenceLoop';
const MAX_ITERATIONS = 3;
function findCrossingPairs(edges) {
    const routed = edges.filter((e) => (e.routing?.waypoints?.length ?? 0) >= 2);
    const pairs = [];
    for (let i = 0; i < routed.length; i++) {
        const a = routed[i];
        const aPoints = a.routing.waypoints;
        for (let j = i + 1; j < routed.length; j++) {
            const b = routed[j];
            if (a.source === b.source || a.source === b.target || a.target === b.source || a.target === b.target) {
                continue;
            }
            const bPoints = b.routing.waypoints;
            for (let si = 1; si < aPoints.length; si++) {
                for (let sj = 1; sj < bPoints.length; sj++) {
                    if (segmentIntersection(aPoints[si - 1], aPoints[si], bPoints[sj - 1], bPoints[sj])) {
                        pairs.push({ edgeA: a, edgeB: b, segIndexA: si, segIndexB: sj });
                    }
                }
            }
        }
    }
    return pairs;
}
/** Higher score = higher priority = kept in place; lower score gets nudged. */
function priorityScore(edge, nodeById) {
    if (edge.keyFlow)
        return 3;
    const sourceLane = nodeById.get(edge.source)?.laneId;
    const targetLane = nodeById.get(edge.target)?.laneId;
    if (sourceLane && targetLane)
        return 2;
    return 1;
}
/** True if this waypoint index is a fully interior vertex (never port-anchored). */
function isInteriorVertex(index, pointCount) {
    return index > 0 && index < pointCount - 1;
}
/**
 * Shifts a fully-interior segment perpendicular to its own orientation.
 * Both segment endpoints are interior vertices, so moving their shared
 * coordinate (y for a horizontal segment, x for a vertical one) only
 * changes the length of the adjoining orthogonal segments — it can never
 * detach the polyline from its port anchors.
 */
function nudgeInteriorSegment(points, segIndex, offset) {
    const p1Index = segIndex - 1;
    const p2Index = segIndex;
    if (!isInteriorVertex(p1Index, points.length) || !isInteriorVertex(p2Index, points.length)) {
        return false;
    }
    const p1 = points[p1Index];
    const p2 = points[p2Index];
    const isHorizontal = Math.abs(p1.y - p2.y) < 0.5;
    const isVertical = Math.abs(p1.x - p2.x) < 0.5;
    if (!isHorizontal && !isVertical) {
        return false;
    }
    if (isHorizontal) {
        p1.y += offset;
        p2.y += offset;
    }
    else {
        p1.x += offset;
        p2.x += offset;
    }
    return true;
}
export function resolveEdgeCrossings(state) {
    const nodeById = new Map(state.nodes.map((n) => [n.id, n]));
    const channelSpacing = state.settings.spacing.channelSpacing;
    let resolvedCount = 0;
    let unresolvedCount = 0;
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        const crossings = findCrossingPairs(state.edges);
        if (crossings.length === 0)
            break;
        let resolvedAnyThisPass = false;
        const attemptedEdgeIds = new Set();
        for (const crossing of crossings) {
            const scoreA = priorityScore(crossing.edgeA, nodeById);
            const scoreB = priorityScore(crossing.edgeB, nodeById);
            let victim;
            let segIndex;
            if (scoreA !== scoreB) {
                [victim, segIndex] = scoreA < scoreB ? [crossing.edgeA, crossing.segIndexA] : [crossing.edgeB, crossing.segIndexB];
            }
            else {
                // Deterministic tie-break: lexically later edge id is the victim.
                const aIsVictim = crossing.edgeA.id > crossing.edgeB.id;
                [victim, segIndex] = aIsVictim ? [crossing.edgeA, crossing.segIndexA] : [crossing.edgeB, crossing.segIndexB];
            }
            if (attemptedEdgeIds.has(victim.id))
                continue;
            attemptedEdgeIds.add(victim.id);
            const offset = channelSpacing * (iteration + 1);
            const nudged = nudgeInteriorSegment(victim.routing.waypoints, segIndex, offset);
            if (nudged) {
                resolvedAnyThisPass = true;
                resolvedCount += 1;
                state.provenanceLog.push(`crossing-resolved:${victim.id}:pass=${iteration}:offsetPx=${offset}`);
            }
            else {
                unresolvedCount += 1;
            }
        }
        if (!resolvedAnyThisPass)
            break;
    }
    if (unresolvedCount > 0) {
        state.diagnostics.warnings.push(`${unresolvedCount} edge crossing(s) could not be auto-resolved (no interior waypoint to nudge).`);
    }
    if (resolvedCount > 0) {
        state.provenanceLog.push(`CrossingResolution: ${resolvedCount} crossing(s) nudged clear.`);
    }
}
