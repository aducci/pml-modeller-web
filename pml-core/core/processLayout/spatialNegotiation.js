// Stage: Spatial Negotiation
// reads:  nodes (x, y, laneId, type, depth), edges (source, target, semanticRole), lanes, gatewayEnvelopes
// writes: nodes.x (bounded micro-adjustments, X-axis only, ≤maxNodeDeltaPx per node)
//         Y is frozen. Lane membership and topology are frozen.
//
// Predicates (5 active):
//   T1 — Crossing count > 0 between approximate edge paths
//   T2 — Fan-in compression ratio too tight (target windows)
//   T3 — Decision symmetry delta (gateway Y far from mean of target Ys)
//   T4 — Corridor continuity breaks (main-flow same-lane large Y delta)
//   T8 — Cross-lane convergence compression
//   GP  — Gateway output pressure (envelope saturation OR multi-direction fan) [replaces T6+T7]
//
// Retired predicates:
//   T5 — Cross-lane straight opportunity (now handled by bidirectional lane consensus)
//
// Apply strategy: TWO-PASS — collect all proposals from all windows first,
// then apply per-node net ΔX in one batch to eliminate ordering dependency.
/**
 * Bounded Spatial Opportunity Evaluation — processLayout stage.
 *
 * Runs BEFORE channel allocation (between coordinate assignment and channel
 * allocation in the pipeline). Detects near-clean routing opportunities and
 * proposes constrained X-axis micro-adjustments to node positions.
 *
 * Hard invariants are constants — never relaxed at runtime (spec Section 7.2).
 */
import { SPATIAL_NEGOTIATION_INVARIANTS, } from './layoutTypes';
import { segmentsIntersect, rectAnchors } from '../layoutGeometry';
import { isGatewayNodeKind } from '../nodeKinds';
import { appendToMap, stableSortById, getLaneIndexMap } from './stageHelpers';
import { mustGetNode } from '../nodeLookup';
export const DEFAULT_SPATIAL_SETTINGS = {
    straightDownAlignmentThresholdPx: 20,
    minFanInCompressionRatio: 0.72,
    maxDecisionSymmetryDeltaPx: 10,
    maxCrossLaneConvergenceCompression: 2.5,
    minApproachGapPx: 16,
};
// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
export function evaluateBoundedSpatialOpportunities(nodes, edges, laneMap, gatewayEnvelopes, settings = DEFAULT_SPATIAL_SETTINGS) {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const windows = buildEdgeWindows(edges);
    if (windows.length === 0) {
        return { acceptedAdjustments: [], rejectedProposals: [], windowDiagnostics: [], skipped: true, skipReason: 'no-multi-edge-windows' };
    }
    // Pass 1 — collect all proposals from all windows without mutating nodes
    const allProposals = [];
    const windowDiags = [];
    for (const window of windows) {
        const { proposals, diag } = collectWindowProposals(window, nodeMap, laneMap, gatewayEnvelopes, settings);
        allProposals.push(...proposals);
        windowDiags.push(diag);
    }
    // Pass 2 — aggregate net ΔX per node, enforce invariants, apply once
    const { accepted, rejected } = applyBatchedProposals(allProposals, nodeMap);
    return {
        acceptedAdjustments: accepted,
        rejectedProposals: rejected,
        windowDiagnostics: windowDiags,
        skipped: false,
    };
}
// ---------------------------------------------------------------------------
// Window construction
// ---------------------------------------------------------------------------
function buildEdgeWindows(edges) {
    const bySource = new Map();
    const byTarget = new Map();
    for (const edge of edges) {
        if (edge.flowLayer === 'hidden')
            continue;
        appendToMap(bySource, edge.source, edge);
        appendToMap(byTarget, edge.target, edge);
    }
    const windows = [];
    for (const [nodeId, edgeList] of bySource) {
        if (edgeList.length > 1) {
            windows.push({
                windowId: `src-${nodeId}`,
                sharedNodeId: nodeId,
                sharedRole: 'source',
                edges: stableSortById(edgeList),
            });
        }
    }
    for (const [nodeId, edgeList] of byTarget) {
        if (edgeList.length > 1) {
            windows.push({
                windowId: `tgt-${nodeId}`,
                sharedNodeId: nodeId,
                sharedRole: 'target',
                edges: stableSortById(edgeList),
            });
        }
    }
    return windows.sort((a, b) => a.windowId.localeCompare(b.windowId));
}
// ---------------------------------------------------------------------------
// Pass 1 — collect proposals from a single window (read-only, no mutation)
// ---------------------------------------------------------------------------
function collectWindowProposals(window, nodeMap, laneMap, gatewayEnvelopes, settings) {
    const triggers = [];
    const proposals = [];
    const sharedNode = mustGetNode(nodeMap, window.sharedNodeId);
    const neighborNodes = window.edges
        .map((e) => mustGetNode(nodeMap, window.sharedRole === 'source' ? e.target : e.source));
    // T1 — Crossing count > 0 between approximate edge paths
    const crossings = estimateCrossingsInWindow(window, nodeMap);
    if (crossings > 0) {
        triggers.push('T1:crossingCount');
        generateCrossingReductionProposals(window, nodeMap, laneMap, proposals);
    }
    // T2 — Fan-in compression ratio (target windows only)
    if (window.sharedRole === 'target') {
        const ratio = computeFanInCompressionRatio(sharedNode, window.edges.length, settings.minApproachGapPx);
        if (ratio < settings.minFanInCompressionRatio) {
            triggers.push('T2:fanInCompression');
            proposals.push({ nodeId: sharedNode.id, deltaX: -SPATIAL_NEGOTIATION_INVARIANTS.maxNodeDeltaPx * 0.5, rationale: 'fan-in approach decompression', triggerSource: 'T2' });
        }
    }
    // T3 — Decision symmetry delta (source windows, gateway nodes)
    // Skip when all targets are at a greater depth — sequential forward gateways are already
    // column-positioned by coordinate assignment; centroid nudging would break even spacing.
    if (window.sharedRole === 'source' && isGatewayNode(sharedNode)) {
        const allTargetsDeeper = neighborNodes.every((n) => (n.depth ?? 0) > (sharedNode.depth ?? 0));
        if (!allTargetsDeeper) {
            const symDelta = computeDecisionSymmetryDelta(sharedNode, neighborNodes);
            if (symDelta > settings.maxDecisionSymmetryDeltaPx) {
                triggers.push('T3:decisionSymmetry');
                generateSymmetryProposal(sharedNode, neighborNodes, proposals);
            }
        }
    }
    // T4 — Corridor continuity breaks (main-flow same-lane edges, X-axis trigger only)
    if (hasContinuityBreak(window, nodeMap)) {
        triggers.push('T4:corridorContinuity');
    }
    // GP — Gateway output pressure: envelope saturation OR multi-direction fan (replaces T6 + T7)
    // T5 (cross-lane straight opportunity) is retired — bidirectional lane consensus handles alignment.
    if (window.sharedRole === 'source' && isGatewayNode(sharedNode)) {
        const allTargetsDeeper = neighborNodes.every((n) => (n.depth ?? 0) > (sharedNode.depth ?? 0));
        if (!allTargetsDeeper) {
            const envelope = gatewayEnvelopes.get(sharedNode.id);
            const envelopeSaturated = envelope
                ? window.edges.length > (envelope.topCorridorSlots + envelope.bottomCorridorSlots + envelope.rightCorridorSlots)
                : false;
            const multiDirFan = hasMultiDirectionFan(sharedNode, neighborNodes, laneMap);
            if (envelopeSaturated || multiDirFan) {
                triggers.push('GP:gatewayOutputPressure');
                const centroidX = neighborNodes.reduce((sum, n) => sum + (n.x ?? 0), 0) / (neighborNodes.length || 1);
                const centroidDelta = clamp(centroidX - (sharedNode.x ?? 0), -SPATIAL_NEGOTIATION_INVARIANTS.maxNodeDeltaPx, SPATIAL_NEGOTIATION_INVARIANTS.maxNodeDeltaPx);
                // Prefer centroid alignment; fall back to envelope expansion nudge when centroid delta is negligible
                const delta = Math.abs(centroidDelta) > 1 ? centroidDelta : (envelopeSaturated ? SPATIAL_NEGOTIATION_INVARIANTS.envelopeSaturationNudgePx : 0);
                if (Math.abs(delta) > 0) {
                    proposals.push({ nodeId: sharedNode.id, deltaX: delta, rationale: 'gateway output pressure: center on branch cluster', triggerSource: 'GP' });
                }
            }
        }
    }
    // T8 — Cross-lane convergence compression (target windows only)
    if (window.sharedRole === 'target') {
        const convergenceScore = computeConvergenceCompression(sharedNode, window.edges, nodeMap, laneMap);
        if (convergenceScore > settings.maxCrossLaneConvergenceCompression) {
            triggers.push('T8:convergenceCompression');
            proposals.push({ nodeId: sharedNode.id, deltaX: SPATIAL_NEGOTIATION_INVARIANTS.maxNodeDeltaPx * 0.5, rationale: 'convergence compression: increase approach spacing', triggerSource: 'T8' });
        }
    }
    return {
        proposals,
        diag: {
            windowId: window.windowId,
            triggersEvaluated: getEvaluatedTriggers(window),
            triggered: triggers.length > 0,
            proposals: proposals.length,
            accepted: 0, // filled in during pass 2
        },
    };
}
// ---------------------------------------------------------------------------
// Pass 2 — aggregate net ΔX per node, enforce invariants, apply once
// ---------------------------------------------------------------------------
function applyBatchedProposals(allProposals, nodeMap) {
    // Aggregate net ΔX per node across all proposals
    const netDeltaByNode = new Map();
    for (const p of allProposals) {
        const entry = netDeltaByNode.get(p.nodeId) ?? { sum: 0, rationales: [], source: p.triggerSource };
        entry.sum += p.deltaX;
        entry.rationales.push(p.rationale);
        netDeltaByNode.set(p.nodeId, entry);
    }
    const accepted = [];
    const rejected = [];
    const affectedNodeIds = new Set();
    for (const [nodeId, { sum, rationales, source }] of netDeltaByNode) {
        const node = nodeMap.get(nodeId);
        if (!node) {
            rejected.push({ nodeId, deltaX: sum, rejectionReason: 'node-not-found', triggerSource: source });
            continue;
        }
        // Clamp net delta to invariant max
        const clamped = clamp(sum, -SPATIAL_NEGOTIATION_INVARIANTS.maxNodeDeltaPx, SPATIAL_NEGOTIATION_INVARIANTS.maxNodeDeltaPx);
        if (clamped === 0)
            continue;
        if (affectedNodeIds.size >= SPATIAL_NEGOTIATION_INVARIANTS.maxAffectedNodesPerWindow && !affectedNodeIds.has(nodeId)) {
            rejected.push({ nodeId, deltaX: clamped, rejectionReason: 'exceeds-maxAffectedNodesPerWindow', triggerSource: source });
            continue;
        }
        if (node.x !== undefined)
            node.x += clamped;
        affectedNodeIds.add(nodeId);
        accepted.push({ nodeId, appliedDeltaX: clamped, rationale: rationales.join('; ') });
    }
    return { accepted, rejected };
}
// ---------------------------------------------------------------------------
// Trigger computations
// ---------------------------------------------------------------------------
function estimateCrossingsInWindow(window, nodeMap) {
    // Approximate each edge as a straight line from source right anchor to target left anchor.
    const segments = window.edges.map((edge) => {
        const src = mustGetNode(nodeMap, edge.source);
        const tgt = mustGetNode(nodeMap, edge.target);
        if (src.x === undefined || tgt.x === undefined)
            return null;
        const srcRect = nodeToRect(src);
        const tgtRect = nodeToRect(tgt);
        return { a: rectAnchors(srcRect).right, b: rectAnchors(tgtRect).left };
    }).filter((s) => s !== null);
    let count = 0;
    for (let i = 0; i < segments.length - 1; i++) {
        for (let j = i + 1; j < segments.length; j++) {
            if (segmentsIntersect(segments[i].a, segments[i].b, segments[j].a, segments[j].b))
                count++;
        }
    }
    return count;
}
function computeFanInCompressionRatio(target, incomingCount, minGapPx) {
    const available = target.height;
    const required = incomingCount * minGapPx;
    return required > 0 ? available / required : 1;
}
function computeDecisionSymmetryDelta(gateway, targets) {
    if (targets.length === 0)
        return 0;
    const meanY = targets.reduce((s, n) => s + (n.y ?? 0), 0) / targets.length;
    return Math.abs((gateway.y ?? 0) - meanY);
}
function hasContinuityBreak(window, nodeMap) {
    // A continuity break exists when a main-flow same-lane edge has source and target
    // at substantially different Y positions (indicating they are in different stacking rows).
    for (const edge of window.edges) {
        if (edge.flowLayer !== 'main' && edge.flowLayer !== undefined)
            continue;
        const src = mustGetNode(nodeMap, edge.source);
        const tgt = mustGetNode(nodeMap, edge.target);
        if (src.laneId !== tgt.laneId)
            continue;
        const yDelta = Math.abs((src.y ?? 0) - (tgt.y ?? 0));
        if (yDelta > Math.max(src.height, tgt.height))
            return true;
    }
    return false;
}
function hasMultiDirectionFan(gateway, targets, laneMap) {
    const laneIdx = getLaneIndexMap(Array.from(laneMap.values()));
    const gwIdx = laneIdx.get(gateway.laneId ?? '') ?? -1;
    let hasUp = false;
    let hasDown = false;
    let hasSame = false;
    for (const tgt of targets) {
        const tgtIdx = laneIdx.get(tgt.laneId ?? '') ?? -1;
        if (tgtIdx < gwIdx)
            hasUp = true;
        else if (tgtIdx > gwIdx)
            hasDown = true;
        else
            hasSame = true;
    }
    return (hasUp && hasDown) || (hasUp && hasSame) || (hasDown && hasSame);
}
function computeConvergenceCompression(target, edges, nodeMap, laneMap) {
    const laneIdx = getLaneIndexMap(Array.from(laneMap.values()));
    const tgtIdx = laneIdx.get(target.laneId ?? '') ?? -1;
    let totalLaneDistance = 0;
    let crossLaneCount = 0;
    for (const edge of edges) {
        const src = mustGetNode(nodeMap, edge.source);
        if (!src.laneId)
            continue;
        const srcIdx = laneIdx.get(src.laneId) ?? -1;
        const dist = Math.abs(srcIdx - tgtIdx);
        if (dist > 0) {
            totalLaneDistance += dist;
            crossLaneCount++;
        }
    }
    return crossLaneCount > 0 ? totalLaneDistance / crossLaneCount : 0;
}
// ---------------------------------------------------------------------------
// Proposal generators
// ---------------------------------------------------------------------------
function generateCrossingReductionProposals(window, nodeMap, laneMap, proposals) {
    // Nudge sibling target nodes apart in X to reduce crossing.
    // For source windows: nudge targets; for target windows: nudge sources.
    const neighborIds = window.sharedRole === 'source'
        ? window.edges.map((e) => e.target)
        : window.edges.map((e) => e.source);
    const neighbors = neighborIds.map((id) => mustGetNode(nodeMap, id));
    if (neighbors.length < 2)
        return;
    // Sort by current X, then nudge alternating left/right by a small amount
    const sorted = neighbors.slice().sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
    const half = Math.floor(sorted.length / 2);
    for (let i = 0; i < sorted.length; i++) {
        const direction = i < half ? -1 : 1;
        const nudge = direction * Math.min(SPATIAL_NEGOTIATION_INVARIANTS.envelopeSaturationNudgePx, SPATIAL_NEGOTIATION_INVARIANTS.maxNodeDeltaPx);
        proposals.push({ nodeId: sorted[i].id, deltaX: nudge, rationale: 'crossing reduction: spread sibling nodes', triggerSource: 'T1' });
    }
}
function generateSymmetryProposal(gateway, targets, proposals) {
    const centroidX = targets.reduce((s, n) => s + (n.x ?? 0), 0) / (targets.length || 1);
    const delta = clamp(centroidX - (gateway.x ?? 0), -SPATIAL_NEGOTIATION_INVARIANTS.maxNodeDeltaPx, SPATIAL_NEGOTIATION_INVARIANTS.maxNodeDeltaPx);
    if (Math.abs(delta) > 0.5) {
        proposals.push({ nodeId: gateway.id, deltaX: delta, rationale: 'decision symmetry: align gateway to branch centroid X', triggerSource: 'T3' });
    }
}
// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function isGatewayNode(node) {
    return isGatewayNodeKind(node.type);
}
function nodeToRect(node) {
    return {
        x: (node.x ?? 0) - node.width / 2,
        y: (node.y ?? 0) - node.height / 2,
        width: node.width,
        height: node.height,
    };
}
function getEvaluatedTriggers(window) {
    const base = ['T1', 'T4'];
    if (window.sharedRole === 'target')
        return [...base, 'T2', 'T8'];
    return [...base, 'T3', 'GP'];
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
