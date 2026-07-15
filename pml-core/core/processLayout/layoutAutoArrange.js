// Stage: Layout Auto-Arrange (opt-in master controller, runs after the full
// pipeline once)
// reads:  the routed LayoutResult produced by the core pipeline, plus the
//         original NormalizedProcessGraph it came from
// writes: nothing on the input — returns a fresh LayoutResult, possibly from
//         a re-run of the core pipeline with one node relocated to a
//         different lane, or two sibling nodes swapped within their lane
//
// Channel allocation, crossing-resolution, and node-obstacle-avoidance all
// operate on a *fixed* lane assignment and a *fixed* within-lane vertical
// order — they can shuffle waypoints around within those constraints (or
// give up when there's genuinely no valid gap left to shuffle into, e.g. a
// node sandwiched between an incoming and outgoing edge with zero clearance
// on either side), but none of them can ask "would this whole diagram be
// cleaner arranged differently?" That question can only be answered by
// actually trying it and re-running layout+routing, which is what this
// controller does: gated behind settings.routing.autoRelocateToAvoidOverlap
// (off by default, since it multiplies layout cost by the number of trials),
// it looks at which edges still cross or cut through a node after the normal
// pipeline runs, and tries two kinds of rearrangement:
//
//  - Lane relocation: move a gateway/decision node with no author-assigned
//    actor to a different lane. Never touches actor-pinned nodes — that
//    would contradict something the author explicitly wrote.
//  - Row swap: reorder two sibling nodes (same lane, same depth) vertically.
//    This DOES apply to actor-pinned nodes, because it never changes which
//    lane a node lives in or what it's connected to — only which of two
//    siblings is drawn above the other. That's a presentation detail the
//    author didn't specify by writing task A before task B in the file (the
//    engine already ignores declaration order in favor of chain position),
//    so optimizing it doesn't override authored intent the way a lane move
//    would.
//
// Both trial kinds are scored by the same metric (layoutDefects.ts) that
// postRoutingConflictResolution.ts uses, so "better" means the same thing
// everywhere in the pipeline. Whichever single trial minimizes the defect
// count wins; ties keep the baseline unchanged.
import { isGatewayNodeKind } from '../nodeKinds';
import { countLayoutDefects } from './layoutDefects';
import { buildById } from './stageHelpers';
const MAX_LANE_CANDIDATE_NODES = 4;
const MAX_SIBLING_GROUP_SIZE = 6;
function cloneGraphWithForcedLane(graph, nodeId, laneId) {
    return {
        ...graph,
        nodes: graph.nodes.map((n) => n.id === nodeId ? { ...n, metadata: { ...n.metadata, forcedLaneId: laneId } } : n),
    };
}
function buildLaneRelocationTrials(graph, baseline, defectNodeIds) {
    const nodeById = buildById(graph.nodes);
    const laneByNodeId = new Map(baseline.nodes.map((n) => [n.id, n.laneId]));
    const candidates = Array.from(defectNodeIds)
        .map((id) => nodeById.get(id))
        .filter((n) => !!n && isGatewayNodeKind(n.type) && !n.actor)
        .slice(0, MAX_LANE_CANDIDATE_NODES);
    const trials = [];
    for (const candidate of candidates) {
        const currentLaneId = laneByNodeId.get(candidate.id);
        for (const lane of baseline.lanes) {
            if (lane.id === currentLaneId)
                continue;
            trials.push({
                description: `relocated ${candidate.id} from ${currentLaneId} to ${lane.id}`,
                graph: cloneGraphWithForcedLane(graph, candidate.id, lane.id),
            });
        }
    }
    return trials;
}
/** Groups nodes sharing a lane and depth, sorted by their current baseline y (i.e. current visual order). */
function findSiblingGroups(baseline) {
    const groups = new Map();
    for (const node of baseline.nodes) {
        if (!node.laneId || node.depth === undefined || node.y === undefined)
            continue;
        const key = `${node.laneId}|${node.depth}`;
        const group = groups.get(key) ?? [];
        group.push(node);
        groups.set(key, group);
    }
    return Array.from(groups.values())
        .filter((g) => g.length >= 2 && g.length <= MAX_SIBLING_GROUP_SIZE)
        .map((g) => g.slice().sort((a, b) => (a.y ?? 0) - (b.y ?? 0)));
}
function cloneGraphWithSwappedSlots(graph, orderedGroup, swapIndexA, swapIndexB) {
    const forcedIndexByNodeId = new Map();
    orderedGroup.forEach((node, i) => forcedIndexByNodeId.set(node.id, i));
    const aId = orderedGroup[swapIndexA].id;
    const bId = orderedGroup[swapIndexB].id;
    forcedIndexByNodeId.set(aId, swapIndexB);
    forcedIndexByNodeId.set(bId, swapIndexA);
    return {
        ...graph,
        nodes: graph.nodes.map((n) => {
            const forcedSlotIndex = forcedIndexByNodeId.get(n.id);
            return forcedSlotIndex === undefined ? n : { ...n, metadata: { ...n.metadata, forcedSlotIndex } };
        }),
    };
}
function buildRowSwapTrials(graph, baseline, defectNodeIds) {
    const trials = [];
    for (const group of findSiblingGroups(baseline)) {
        if (!group.some((n) => defectNodeIds.has(n.id)))
            continue;
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                trials.push({
                    description: `swapped row order of ${group[i].id} and ${group[j].id}`,
                    graph: cloneGraphWithSwappedSlots(graph, group, i, j),
                });
            }
        }
    }
    return trials;
}
export function applyLayoutAutoArrange(graph, settingOverrides, baseline, computeCore) {
    const baselineDefects = countLayoutDefects(baseline.nodes, baseline.edges);
    if (baselineDefects.count === 0) {
        return baseline;
    }
    const trials = [
        ...buildLaneRelocationTrials(graph, baseline, baselineDefects.nodeIds),
        ...buildRowSwapTrials(graph, baseline, baselineDefects.nodeIds),
    ];
    let best = baseline;
    let bestCount = baselineDefects.count;
    for (const trial of trials) {
        const trialResult = computeCore(trial.graph, settingOverrides);
        const trialCount = countLayoutDefects(trialResult.nodes, trialResult.edges).count;
        if (trialCount < bestCount) {
            best = trialResult;
            bestCount = trialCount;
            best.diagnostics.provenanceLog?.push(`LayoutAutoArrange: ${trial.description} (defects ${baselineDefects.count} -> ${trialCount})`);
        }
        if (bestCount === 0)
            break;
    }
    return best;
}
