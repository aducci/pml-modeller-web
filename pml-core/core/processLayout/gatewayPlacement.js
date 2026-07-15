// Stage: Gateway Placement
// reads:  nodes (x, y, laneId, type), edges, lanes, settings
// writes: nodes.x, nodes.y, nodes.laneId (for gateway nodes only); nodes.metadata (envelope hints)
// returns: GatewayEnvelopeMap (consumed by port resolver — not stored on LayoutState)
import { isGatewayNodeKind } from '../nodeKinds';
import { mustGetNode } from '../nodeLookup';
import { buildById } from './stageHelpers';
// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------
const DEFAULT_GATEWAY_OPTIONS = {
    enabled: true,
    laneAffinityWeights: {
        incomingLaneDistanceWeight: 1.0,
        outgoingLaneDistanceWeight: 1.2,
        crossLaneTransitionWeight: 2.0,
        trunkDisruptionWeight: 3.0,
        envelopePressureWeight: 2.5,
    },
    maxGatewayRankBiasPx: 20,
    maxGatewayCenteringDeltaPx: 40,
};
// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
export function applyGatewayPlacementHeuristics(context, options = DEFAULT_GATEWAY_OPTIONS) {
    const envelopeMap = new Map();
    if (!options.enabled)
        return envelopeMap;
    const nodeMap = buildById(context.nodes);
    const laneList = Array.from(context.lanes.values()).sort((a, b) => a.y - b.y);
    const laneIndexMap = new Map(laneList.map((l, i) => [l.id, i]));
    const incomingByNode = new Map();
    const outgoingByNode = new Map();
    for (const edge of context.edges) {
        const inc = incomingByNode.get(edge.target) ?? [];
        inc.push(edge);
        incomingByNode.set(edge.target, inc);
        const out = outgoingByNode.get(edge.source) ?? [];
        out.push(edge);
        outgoingByNode.set(edge.source, out);
    }
    const gateways = context.nodes.filter((n) => isGatewayNodeKind(n.type));
    for (const gateway of gateways) {
        const incoming = incomingByNode.get(gateway.id) ?? [];
        const outgoing = outgoingByNode.get(gateway.id) ?? [];
        const { envelope, warnings } = placeGateway(gateway, incoming, outgoing, nodeMap, laneList, laneIndexMap, options);
        envelopeMap.set(gateway.id, envelope);
        context.diagnostics.warnings.push(...warnings);
    }
    return envelopeMap;
}
/**
 * Places a single gateway: lane affinity scoring/move, X rank-bias offset, envelope
 * building, and saturation check. Mutates gateway.laneId/x/y (this stage's real job)
 * but returns diagnostic text instead of pushing to context.diagnostics itself —
 * applyGatewayPlacementHeuristics above is the single place that attaches warnings
 * to state, per 00_coding_Standards.md's "diagnostics stay out of geometry functions".
 */
function placeGateway(gateway, incoming, outgoing, nodeMap, laneList, laneIndexMap, options) {
    const warnings = [];
    const diagnostics = {
        gatewayId: gateway.id,
        fromLaneId: gateway.laneId,
        laneAffinityScore: 0,
        rankOffsetPx: 0,
        verticalCenteringDeltaPx: 0,
        envelopeSlotCounts: { top: 0, bottom: 0, right: 0 },
        envelopeSaturated: false,
        envelopeRebalanced: false,
    };
    // 1. Lane Affinity Scoring
    const envelope = buildOutputEnvelope(gateway, outgoing, nodeMap, laneList, laneIndexMap);
    diagnostics.envelopeSlotCounts = {
        top: envelope.topCorridorSlots,
        bottom: envelope.bottomCorridorSlots,
        right: envelope.rightCorridorSlots,
    };
    // layoutAutoArrange.ts pins a trial lane on unpinned gateways via this
    // metadata key while it searches for a relocation that clears a crossing.
    // Honor it verbatim instead of re-scoring, so the search isn't fighting
    // its own trial placement.
    const forcedLaneId = gateway.metadata?.forcedLaneId;
    const forcedLane = forcedLaneId ? laneList.find((l) => l.id === forcedLaneId) : undefined;
    const { bestLane, score } = forcedLane
        ? { bestLane: forcedLane, score: 0 }
        : selectBestLane(gateway, incoming, outgoing, nodeMap, laneList, laneIndexMap, options.laneAffinityWeights, envelope);
    diagnostics.laneAffinityScore = score;
    if (bestLane && gateway.laneId !== bestLane.id) {
        diagnostics.toLaneId = bestLane.id;
        const oldLane = laneList.find((l) => l.id === gateway.laneId);
        if (oldLane && gateway.y !== undefined) {
            gateway.y = bestLane.y + (gateway.y - oldLane.y);
        }
        gateway.laneId = bestLane.id;
        warnings.push(`GatewayPlacement: moved ${gateway.id} from ${diagnostics.fromLaneId} to ${bestLane.id} (score=${score.toFixed(2)})`);
    }
    // 2. Rank-Positioning Bias (X offset)
    if (gateway.x !== undefined) {
        const inDeg = incoming.length;
        const outDeg = outgoing.length;
        const splitJoinBias = (outDeg - inDeg) / Math.max(1, outDeg + inDeg);
        const rankOffsetPx = clamp(splitJoinBias * options.maxGatewayRankBiasPx, -options.maxGatewayRankBiasPx, options.maxGatewayRankBiasPx);
        gateway.x += rankOffsetPx;
        diagnostics.rankOffsetPx = rankOffsetPx;
    }
    // 3. Y positioning is owned by coordinate assignment (applyContinuityRefinements).
    // Gateway placement owns X rank bias, lane assignment, and envelope building only.
    diagnostics.verticalCenteringDeltaPx = 0;
    // Check envelope saturation
    const totalBranchSlots = envelope.topCorridorSlots + envelope.bottomCorridorSlots + envelope.rightCorridorSlots;
    diagnostics.envelopeSaturated = outgoing.length > totalBranchSlots;
    if (diagnostics.envelopeSaturated) {
        warnings.push(`GatewayPlacement: gatewayEnvelopeSaturated for ${gateway.id} (branches=${outgoing.length}, slots=${totalBranchSlots})`);
    }
    return { envelope, diagnostics, warnings };
}
// ---------------------------------------------------------------------------
// GatewayOutputEnvelope builder
// ---------------------------------------------------------------------------
function buildOutputEnvelope(gateway, outgoing, nodeMap, laneList, laneIndexMap) {
    const gwLaneIdx = laneIndexMap.get(gateway.laneId ?? '') ?? 0;
    const branchSlotAssignments = {};
    let topCount = 0;
    let bottomCount = 0;
    let rightCount = 0;
    // Sort branches by edge id for deterministic stable ordering
    const sortedOutgoing = outgoing.slice().sort((a, b) => a.id.localeCompare(b.id));
    for (const edge of sortedOutgoing) {
        const tgt = mustGetNode(nodeMap, edge.target);
        const tgtLaneIdx = laneIndexMap.get(tgt.laneId ?? '') ?? gwLaneIdx;
        if (tgtLaneIdx < gwLaneIdx) {
            branchSlotAssignments[edge.id] = 'top';
            topCount++;
        }
        else if (tgtLaneIdx > gwLaneIdx) {
            branchSlotAssignments[edge.id] = 'bottom';
            bottomCount++;
        }
        else {
            branchSlotAssignments[edge.id] = 'right';
            rightCount++;
        }
    }
    return {
        gatewayId: gateway.id,
        topCorridorSlots: topCount,
        bottomCorridorSlots: bottomCount,
        rightCorridorSlots: rightCount,
        branchSlotAssignments,
    };
}
function selectBestLane(gateway, incoming, outgoing, nodeMap, laneList, laneIndexMap, weights, envelope) {
    if (laneList.length === 0)
        return { bestLane: null, score: 0 };
    const currentLaneIdx = laneIndexMap.get(gateway.laneId ?? '') ?? 0;
    const records = [];
    for (let i = 0; i < laneList.length; i++) {
        const lane = laneList[i];
        let inDistCost = 0;
        let outDistCost = 0;
        let crossLaneCost = 0;
        for (const edge of incoming) {
            const src = mustGetNode(nodeMap, edge.source);
            if (src.laneId) {
                const idx = laneIndexMap.get(src.laneId) ?? i;
                inDistCost += Math.abs(idx - i);
                if (idx !== i)
                    crossLaneCost++;
            }
        }
        for (const edge of outgoing) {
            const tgt = mustGetNode(nodeMap, edge.target);
            if (tgt.laneId) {
                const idx = laneIndexMap.get(tgt.laneId) ?? i;
                outDistCost += Math.abs(idx - i);
                if (idx !== i)
                    crossLaneCost++;
            }
        }
        const trunkDisruptionCost = computeTrunkDisruptionCost(gateway, outgoing, nodeMap, i, laneIndexMap);
        const envelopePressureCost = computeEnvelopePressure(envelope, i, laneIndexMap, outgoing, nodeMap);
        const score = weights.incomingLaneDistanceWeight * inDistCost +
            weights.outgoingLaneDistanceWeight * outDistCost +
            weights.crossLaneTransitionWeight * crossLaneCost +
            weights.trunkDisruptionWeight * trunkDisruptionCost +
            weights.envelopePressureWeight * envelopePressureCost;
        records.push({
            lane,
            score,
            trunkDisruptionCost,
            crossLaneTransitionCost: crossLaneCost,
            distanceToCurrent: Math.abs(i - currentLaneIdx),
        });
    }
    // Lexicographic tie-break per spec Section 5.3.1:
    // 1. min score 2. min trunkDisruption 3. min crossLane 4. min distanceToCurrent 5. lexical lane id
    records.sort((a, b) => {
        if (a.score !== b.score)
            return a.score - b.score;
        if (a.trunkDisruptionCost !== b.trunkDisruptionCost)
            return a.trunkDisruptionCost - b.trunkDisruptionCost;
        if (a.crossLaneTransitionCost !== b.crossLaneTransitionCost)
            return a.crossLaneTransitionCost - b.crossLaneTransitionCost;
        if (a.distanceToCurrent !== b.distanceToCurrent)
            return a.distanceToCurrent - b.distanceToCurrent;
        return a.lane.id.localeCompare(b.lane.id);
    });
    const best = records[0];
    return { bestLane: best?.lane ?? null, score: best?.score ?? 0 };
}
// ---------------------------------------------------------------------------
// Trunk disruption cost
// Counts how many gateway outputs cross a "protected trunk" edge set.
// Trunk = edges that carry main-flow, same-lane forward flows.
// ---------------------------------------------------------------------------
function computeTrunkDisruptionCost(gateway, outgoing, nodeMap, candidateLaneIdx, laneIndexMap) {
    let cost = 0;
    for (const edge of outgoing) {
        const tgt = mustGetNode(nodeMap, edge.target);
        if (!tgt.laneId)
            continue;
        const tgtIdx = laneIndexMap.get(tgt.laneId) ?? candidateLaneIdx;
        // Any branch going in the opposite direction of forward flow (upward) disrupts trunk cadence.
        if (tgtIdx < candidateLaneIdx)
            cost += 1;
    }
    return cost;
}
// ---------------------------------------------------------------------------
// Envelope pressure cost
// Measures how many branch directions are needed vs how many natural slots exist
// in the candidate lane position.
// ---------------------------------------------------------------------------
function computeEnvelopePressure(envelope, candidateLaneIdx, laneIndexMap, outgoing, nodeMap) {
    let topNeeded = 0;
    let bottomNeeded = 0;
    let rightNeeded = 0;
    for (const edge of outgoing) {
        const tgt = mustGetNode(nodeMap, edge.target);
        if (!tgt.laneId) {
            rightNeeded++;
            continue;
        }
        const idx = laneIndexMap.get(tgt.laneId) ?? candidateLaneIdx;
        if (idx < candidateLaneIdx)
            topNeeded++;
        else if (idx > candidateLaneIdx)
            bottomNeeded++;
        else
            rightNeeded++;
    }
    // Pressure = excess branches that don't fit in natural corridors.
    // Each slot family can handle up to the envelope count.
    const topExcess = Math.max(0, topNeeded - (envelope.topCorridorSlots || 1));
    const bottomExcess = Math.max(0, bottomNeeded - (envelope.bottomCorridorSlots || 1));
    const rightExcess = Math.max(0, rightNeeded - (envelope.rightCorridorSlots || 1));
    return topExcess + bottomExcess + rightExcess;
}
// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
