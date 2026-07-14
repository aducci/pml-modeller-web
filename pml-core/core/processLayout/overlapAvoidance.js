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
// normal pipeline runs; finds the gateway/decision nodes involved that have
// no author-assigned actor (so relocating them doesn't contradict anything
// the author wrote); and tries each other lane for each candidate — keeping
// whichever trial minimizes the combined defect count.
import { isGatewayNodeKind } from '../nodeKinds';
import { segmentIntersection } from './convergenceLoop';
const MAX_CANDIDATE_NODES = 4;
function nodeOverlapsSegment(node, a, b) {
    if (node.x === undefined || node.y === undefined)
        return false;
    const left = node.x - node.width / 2;
    const right = node.x + node.width / 2;
    const top = node.y - node.height / 2;
    const bottom = node.y + node.height / 2;
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    return maxX > left && minX < right && maxY > top && minY < bottom;
}
/**
 * Every routed edge/node pair that's still wrong after the normal pipeline:
 * true edge-vs-edge crossings, plus edges cutting through a node they don't
 * connect to. Returns the offending node ids (candidates for relocation)
 * and a total count (the search's objective to minimize).
 */
function findDefects(result) {
    const nodeIds = new Set();
    let count = 0;
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
                        count += 1;
                        nodeIds.add(a.source).add(a.target).add(b.source).add(b.target);
                    }
                }
            }
        }
    }
    for (const edge of routed) {
        const points = edge.routing.waypoints;
        for (let si = 1; si < points.length; si++) {
            for (const node of result.nodes) {
                if (node.id === edge.source || node.id === edge.target)
                    continue;
                if (nodeOverlapsSegment(node, points[si - 1], points[si])) {
                    count += 1;
                    nodeIds.add(edge.source).add(edge.target).add(node.id);
                }
            }
        }
    }
    return { nodeIds, count };
}
function cloneGraphWithForcedLane(graph, nodeId, laneId) {
    return {
        ...graph,
        nodes: graph.nodes.map((n) => n.id === nodeId ? { ...n, metadata: { ...n.metadata, forcedLaneId: laneId } } : n),
    };
}
export function applyOverlapAvoidance(graph, settingOverrides, baseline, computeCore) {
    const baselineDefects = findDefects(baseline);
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
            const trialCount = findDefects(trialResult).count;
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
