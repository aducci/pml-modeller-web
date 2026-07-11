// Stage: Overlap Avoidance (opt-in, runs after the full pipeline once)
// reads:  the routed LayoutResult produced by the core pipeline, plus the
//         original NormalizedProcessGraph it came from
// writes: nothing on the input — returns a fresh LayoutResult, possibly from
//         a re-run of the core pipeline with one node relocated to a
//         different lane
//
// Channel allocation and crossing-resolution both operate on a *fixed*
// lane assignment — they can shuffle waypoints around within that
// assignment, but they can't ask "would this whole diagram be cleaner if
// this gateway lived in a different lane?" That question can only be
// answered by actually trying it and re-running layout+routing, which is
// what this stage does: gated behind settings.routing.autoRelocateToAvoidOverlap
// (off by default, since it multiplies layout cost by candidates × lanes),
// it looks at which edges still cross after the normal pipeline runs, finds
// the gateway/decision nodes on those edges that have no author-assigned
// actor (so relocating them doesn't contradict anything the author wrote),
// and tries each other lane for each candidate — keeping whichever trial
// minimizes edge crossings.
import { isGatewayNodeKind } from '../nodeKinds';
import { segmentIntersection } from './convergenceLoop';
const MAX_CANDIDATE_NODES = 4;
function findCrossingNodeIds(result) {
    const ids = new Set();
    const routed = result.edges.filter((e) => (e.routing?.waypoints?.length ?? 0) >= 2);
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
                        ids.add(a.source).add(a.target).add(b.source).add(b.target);
                    }
                }
            }
        }
    }
    return ids;
}
function cloneGraphWithForcedLane(graph, nodeId, laneId) {
    return {
        ...graph,
        nodes: graph.nodes.map((n) => n.id === nodeId ? { ...n, metadata: { ...n.metadata, forcedLaneId: laneId } } : n),
    };
}
export function applyOverlapAvoidance(graph, settingOverrides, baseline, computeCore) {
    const baselineCrossings = baseline.diagnostics.routingMetrics?.edgeCrossings ?? 0;
    if (baselineCrossings === 0) {
        return baseline;
    }
    const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
    const laneByNodeId = new Map(baseline.nodes.map((n) => [n.id, n.laneId]));
    const candidates = Array.from(findCrossingNodeIds(baseline))
        .map((id) => nodeById.get(id))
        .filter((n) => !!n && isGatewayNodeKind(n.type) && !n.actor)
        .slice(0, MAX_CANDIDATE_NODES);
    let best = baseline;
    let bestCrossings = baselineCrossings;
    for (const candidate of candidates) {
        const currentLaneId = laneByNodeId.get(candidate.id);
        for (const lane of baseline.lanes) {
            if (lane.id === currentLaneId)
                continue;
            const trialGraph = cloneGraphWithForcedLane(graph, candidate.id, lane.id);
            const trialResult = computeCore(trialGraph, settingOverrides);
            const trialCrossings = trialResult.diagnostics.routingMetrics?.edgeCrossings ?? Number.POSITIVE_INFINITY;
            if (trialCrossings < bestCrossings) {
                best = trialResult;
                bestCrossings = trialCrossings;
                best.diagnostics.provenanceLog?.push(`OverlapAvoidance: relocated ${candidate.id} from ${currentLaneId} to ${lane.id} ` +
                    `(crossings ${baselineCrossings} -> ${trialCrossings})`);
            }
        }
        if (bestCrossings === 0)
            break;
    }
    return best;
}
