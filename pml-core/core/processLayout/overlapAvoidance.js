// Stage: Overlap Avoidance (opt-in, runs after the full pipeline once)
// reads:  the routed LayoutResult produced by the core pipeline, plus the
//         original NormalizedProcessGraph it came from
// writes: nothing on the input — returns a fresh LayoutResult, possibly from
//         a re-run of the core pipeline with one node relocated to a
//         different lane
//
// Channel allocation, crossing-resolution, and node-obstacle-avoidance all
// operate on a *fixed* lane assignment — they can shuffle waypoints around
// within that assignment (or give up when there's genuinely no valid gap
// left to shuffle into, e.g. a node sandwiched between an incoming and
// outgoing edge with zero clearance on either side), but none of them can
// ask "would this whole diagram be cleaner if this gateway lived in a
// different lane?" That question can only be answered by actually trying it
// and re-running layout+routing, which is what this stage does: gated
// behind settings.routing.autoRelocateToAvoidOverlap (off by default, since
// it multiplies layout cost by candidates × lanes), it looks at which edges
// still cross, or still cut through an unrelated node's box, after the
// normal pipeline (including postRoutingConflictResolution.ts) runs; finds
// the gateway/decision nodes involved that have no author-assigned actor (so
// relocating them doesn't contradict anything the author wrote); and tries
// each other lane for each candidate — keeping whichever trial minimizes the
// combined defect count from layoutDefects.ts (the same metric
// postRoutingConflictResolution.ts uses, so "better" means the same thing in
// both places).
import { isGatewayNodeKind } from '../nodeKinds';
import { countLayoutDefects } from './layoutDefects';
const MAX_CANDIDATE_NODES = 4;
function cloneGraphWithForcedLane(graph, nodeId, laneId) {
    return {
        ...graph,
        nodes: graph.nodes.map((n) => n.id === nodeId ? { ...n, metadata: { ...n.metadata, forcedLaneId: laneId } } : n),
    };
}
export function applyOverlapAvoidance(graph, settingOverrides, baseline, computeCore) {
    const baselineDefects = countLayoutDefects(baseline.nodes, baseline.edges);
    if (baselineDefects.count === 0) {
        return baseline;
    }
    const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
    const laneByNodeId = new Map(baseline.nodes.map((n) => [n.id, n.laneId]));
    const candidates = Array.from(baselineDefects.nodeIds)
        .map((id) => nodeById.get(id))
        .filter((n) => !!n && isGatewayNodeKind(n.type) && !n.actor)
        .slice(0, MAX_CANDIDATE_NODES);
    let best = baseline;
    let bestCount = baselineDefects.count;
    for (const candidate of candidates) {
        const currentLaneId = laneByNodeId.get(candidate.id);
        for (const lane of baseline.lanes) {
            if (lane.id === currentLaneId)
                continue;
            const trialGraph = cloneGraphWithForcedLane(graph, candidate.id, lane.id);
            const trialResult = computeCore(trialGraph, settingOverrides);
            const trialCount = countLayoutDefects(trialResult.nodes, trialResult.edges).count;
            if (trialCount < bestCount) {
                best = trialResult;
                bestCount = trialCount;
                best.diagnostics.provenanceLog?.push(`OverlapAvoidance: relocated ${candidate.id} from ${currentLaneId} to ${lane.id} ` +
                    `(defects ${baselineDefects.count} -> ${trialCount})`);
            }
        }
        if (bestCount === 0)
            break;
    }
    return best;
}
