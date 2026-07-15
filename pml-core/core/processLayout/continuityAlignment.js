// Stage: Coordinate Assignment helper — continuity-based Y alignment
// reads:  nodes (type, laneId, depth, y, height, metadata), edges, lanes, settings
// writes: nothing directly — mutates node.y/metadata (their real job) but
//         returns provenance text; callers push it to state.provenanceLog
//
// applyContinuityRefinements runs as a full second pass over every node,
// immediately after initial placement (placeNodesWithinDepthAndLane)
// finishes, aligning each continuity-eligible node's Y to a same-lane
// neighbor's Y so the flow reads as a straight line.
//
// A narrower first-pass variant (resolveContinuityAlignedY) used to run
// inline during initial placement for solo-node depth-lane cells. It was
// removed after verifying — by stubbing it out and running the full golden-
// master + invariant suite — that its output was always overwritten by this
// function, making it dead code.
import { CONTINUITY_ELIGIBLE_TYPES } from './layoutTypes';
import { isGatewayNodeKind, isInboundEventNode, isOutboundEventNode } from '../nodeKinds';
import { effectiveSize } from './elementSizing';
/**
 * Refines node.y for continuity alignment across the whole node set. Mutates
 * node.y (this stage's real job) but returns provenance text rather than
 * pushing to state.provenanceLog itself — the caller (assignNodeSlotsWithinLaneDepth
 * in coordinateAssignment.ts) is the single place that attaches provenance to
 * state, per 00_coding_Standards.md's "diagnostics stay out of geometry
 * functions" rule.
 */
export function applyContinuityRefinements(state, depthLaneMap, laneById, nodeById, incomingByTarget, outgoingBySource) {
    const provenance = [];
    const settings = state.settings;
    // Process depth-ascending so each predecessor is refined before successors read its Y.
    const orderedNodes = state.nodes.slice().sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0));
    for (const node of orderedNodes) {
        if (node.y === undefined || !CONTINUITY_ELIGIBLE_TYPES.has(node.type)) {
            continue;
        }
        const lane = node.laneId ? laneById.get(node.laneId) : undefined;
        if (!lane) {
            continue;
        }
        const incomingEdges = incomingByTarget.get(node.id) || [];
        const outgoingEdges = outgoingBySource.get(node.id) || [];
        const predecessor = incomingEdges.length === 1
            ? nodeById.get(incomingEdges[0].source)
            : undefined;
        const successor = outgoingEdges.length === 1
            ? nodeById.get(outgoingEdges[0].target)
            : undefined;
        const sameLanePredecessor = predecessor
            && predecessor.y !== undefined
            && predecessor.laneId === node.laneId
            && (predecessor.depth ?? Number.NEGATIVE_INFINITY) < (node.depth ?? Number.POSITIVE_INFINITY)
            ? predecessor
            : undefined;
        const sameLaneSuccessor = successor
            && successor.y !== undefined
            && successor.laneId === node.laneId
            && (successor.depth ?? Number.POSITIVE_INFINITY) > (node.depth ?? Number.NEGATIVE_INFINITY)
            ? successor
            : undefined;
        const isTerminalOutboundEvent = isOutboundEventNode(node)
            && incomingEdges.length === 1
            && outgoingEdges.length === 0;
        const isSourceInboundEvent = isInboundEventNode(node)
            && incomingEdges.length === 0
            && outgoingEdges.length === 1;
        const isLinearBridgeNode = incomingEdges.length === 1 && outgoingEdges.length === 1;
        // A gateway is a spine gateway when it receives exactly one edge from the same lane.
        // It sits in the flow sequence and must align to that predecessor's Y, regardless of
        // how many outgoing branches it fans out to.
        const isSpineGateway = isGatewayNodeKind(node.type)
            && incomingEdges.length === 1
            && sameLanePredecessor !== undefined;
        let desiredY;
        if (isTerminalOutboundEvent && sameLanePredecessor) {
            desiredY = sameLanePredecessor.y;
        }
        else if (isSourceInboundEvent && successor && successor.y !== undefined) {
            const successorDepth = successor.depth ?? Number.POSITIVE_INFINITY;
            const nodeDepth = node.depth ?? Number.NEGATIVE_INFINITY;
            if (successorDepth > nodeDepth) {
                desiredY = successor.y;
            }
        }
        else if (isLinearBridgeNode) {
            if (sameLanePredecessor) {
                desiredY = sameLanePredecessor.y;
            }
            else if (sameLaneSuccessor) {
                desiredY = sameLaneSuccessor.y;
            }
        }
        else if (isSpineGateway) {
            desiredY = sameLanePredecessor.y;
        }
        if (desiredY === undefined) {
            continue;
        }
        const laneHeaderHeight = state.settings.canvasConfig.laneHeaderHeight;
        const halfHeight = effectiveSize(node).height / 2;
        const minY = lane.y + laneHeaderHeight + halfHeight;
        const maxY = lane.y + lane.height - halfHeight;
        const clampedY = isSourceInboundEvent
            ? desiredY
            : Math.max(minY, Math.min(maxY, desiredY));
        const depth = node.depth ?? 0;
        const laneId = node.laneId ?? 'default';
        const siblingKey = `${depth}|${laneId}`;
        const siblings = depthLaneMap.get(siblingKey) || [];
        const minGap = Math.max(4, settings.spacing.canvasPaddingY * 0.5);
        const collides = siblings.some((sibling) => {
            if (sibling.id === node.id || sibling.y === undefined) {
                return false;
            }
            const siblingHalf = effectiveSize(sibling).height / 2;
            const requiredSeparation = halfHeight + siblingHalf + minGap;
            return Math.abs(clampedY - sibling.y) < requiredSeparation;
        });
        if (collides) {
            continue;
        }
        if (Math.abs(node.y - clampedY) > settings.heuristics.continuityTolerancePx) {
            if (isSourceInboundEvent && successor) {
                const meta = node.metadata || {};
                meta.continuityAlignToNodeId = successor.id;
                meta.continuityAlignmentMode = 'source-to-successor';
                node.metadata = meta;
            }
            provenance.push(`continuity-alignment:${node.id}:y=${Math.round(node.y)}->${Math.round(clampedY)}`);
            node.y = clampedY;
        }
    }
    return provenance;
}
