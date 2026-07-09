// Stage: Coordinate Assignment
// reads:  nodes (depth, laneId, chainId, chainIndex, type, isBoundary), edges, lanes, settings
// writes: nodes.x, nodes.y; nodes.metadata (continuityAlignToNodeId, mixedRelayLockX)
//         lanes.x, lanes.y, lanes.width, lanes.height (after density policy)
// - continuity alignment hints and final bounds.
import { LaneSlotAllocator, ChainIndexStrategy, BarycentreStrategy } from './laneSlotAllocator';
import { resolveMixedDecisionRelayPlacement } from './mixedRelayPlacement';
import { resolveContinuityAlignedY, applyContinuityRefinements } from './continuityAlignment';
import { effectiveSize } from './elementSizing';
import { rectMerge, rectBounds } from '../layoutGeometry';
import { getNodeDirection, isBoundaryBandDirection, isBoundaryBandNode, isInboundDirection, isOutboundDirection, } from '../nodeKinds';
export function assignNodeSlotsWithinLaneDepth(state) {
    const { laneById, nodeById, incomingByTarget, outgoingBySource, } = buildLaneAndAdjacencyIndexes(state);
    const { depthLaneMap, maxDepth, columnWidths, } = computeDepthLaneGroupsAndColumnWidths(state);
    const { columnCenters, curtainZoneOffset, requiredCanvasWidth, } = computeColumnCentersAndCanvasWidth(state, columnWidths, maxDepth);
    void curtainZoneOffset;
    state.settings.canvas.width = Math.max(state.settings.canvas.width, requiredCanvasWidth);
    const { minInLaneDepth, maxInLaneDepth, } = computeInLaneDepthRange(state, maxDepth);
    const { laneStartX, laneEndX, } = computeLaneInnerBounds(state, columnCenters, columnWidths, minInLaneDepth, maxInLaneDepth);
    applyLaneInnerBounds(state, laneStartX, laneEndX);
    const boundaryBandGap = state.settings.heuristics.boundaryBandGapPx;
    const resolveBoundaryBandX = buildBoundaryBandResolver(boundaryBandGap, laneStartX, laneEndX, state);
    const placementProvenance = placeNodesWithinDepthAndLane(state, depthLaneMap, laneById, nodeById, incomingByTarget, outgoingBySource, columnCenters, resolveBoundaryBandX);
    const continuityProvenance = applyContinuityRefinements(state, depthLaneMap, laneById, nodeById, incomingByTarget, outgoingBySource);
    state.provenanceLog.push(...placementProvenance, ...continuityProvenance);
    recomputeTotalBounds(state);
    return state;
}
export function recomputeTotalBounds(state) {
    let merged;
    for (const node of state.nodes) {
        if (node.x === undefined || node.y === undefined) {
            continue;
        }
        const { width, height } = effectiveSize(node);
        const rect = { x: node.x - width / 2, y: node.y - height / 2, width, height };
        merged = merged ? rectMerge(merged, rect) : rect;
    }
    state.totalBounds = merged ? rectBounds(merged) : { minX: 0, minY: 0, maxX: 0, maxY: 0 };
}
function buildLaneAndAdjacencyIndexes(state) {
    const laneById = new Map(state.lanes.map((lane) => [lane.id, lane]));
    const nodeById = new Map(state.nodes.map((node) => [node.id, node]));
    const incomingByTarget = new Map();
    const outgoingBySource = new Map();
    for (const edge of state.edges) {
        const incoming = incomingByTarget.get(edge.target) || [];
        incoming.push(edge);
        incomingByTarget.set(edge.target, incoming);
        const outgoing = outgoingBySource.get(edge.source) || [];
        outgoing.push(edge);
        outgoingBySource.set(edge.source, outgoing);
    }
    return { laneById, nodeById, incomingByTarget, outgoingBySource };
}
function computeDepthLaneGroupsAndColumnWidths(state) {
    const depthLaneMap = new Map();
    for (const node of state.nodes) {
        const depth = node.depth ?? 0;
        const laneId = node.laneId ?? 'default';
        const key = `${depth}|${laneId}`;
        if (!depthLaneMap.has(key)) {
            depthLaneMap.set(key, []);
        }
        depthLaneMap.get(key).push(node);
    }
    const maxDepth = state.nodes.reduce((max, n) => Math.max(max, n.depth ?? 0), 0);
    const columnWidths = new Array(maxDepth + 1).fill(state.settings.sizing.minNodeWidth);
    for (const node of state.nodes) {
        const depth = node.depth ?? 0;
        columnWidths[depth] = Math.max(columnWidths[depth], effectiveSize(node).width);
    }
    return { depthLaneMap, maxDepth, columnWidths };
}
function computeColumnCentersAndCanvasWidth(state, columnWidths, maxDepth) {
    const settings = state.settings;
    const boundaryBandGap = settings.heuristics.boundaryBandGapPx;
    const curtainZoneOffset = boundaryBandGap + settings.heuristics.curtainZoneExtraOffsetPx;
    // Compute total width of the column block (columns + gaps)
    const totalContentWidth = columnWidths.reduce((sum, w) => sum + w, 0)
        + Math.max(0, maxDepth) * settings.spacing.nodeGap;
    // Symmetric offset: equal padding on both sides of the column block.
    // This ensures the column block is centered within the available canvas
    // width when the canvas is wider than requiredCanvasWidth.
    const symmetricOffset = Math.max(curtainZoneOffset, settings.spacing.canvasPaddingX);
    const columnCenters = new Array(maxDepth + 1).fill(0);
    let currentX = symmetricOffset;
    for (let i = 0; i <= maxDepth; i++) {
        const colWidth = columnWidths[i];
        columnCenters[i] = currentX + colWidth / 2;
        currentX += colWidth + settings.spacing.nodeGap;
    }
    // Required canvas width: content + symmetric padding on both sides
    const requiredCanvasWidth = totalContentWidth + 2 * symmetricOffset + settings.spacing.canvasPaddingX * 2;
    return { columnCenters, curtainZoneOffset, requiredCanvasWidth };
}
function computeInLaneDepthRange(state, maxDepth) {
    let minInLaneDepth = maxDepth;
    let maxInLaneDepth = 0;
    for (const node of state.nodes) {
        if (isBoundaryBandDirection(getNodeDirection(node)))
            continue;
        minInLaneDepth = Math.min(minInLaneDepth, node.depth ?? 0);
        maxInLaneDepth = Math.max(maxInLaneDepth, node.depth ?? 0);
    }
    if (minInLaneDepth > maxInLaneDepth) {
        minInLaneDepth = 0;
        maxInLaneDepth = maxDepth;
    }
    return { minInLaneDepth, maxInLaneDepth };
}
function computeLaneInnerBounds(state, columnCenters, columnWidths, minInLaneDepth, maxInLaneDepth) {
    const laneStartX = columnCenters[minInLaneDepth] - columnWidths[minInLaneDepth] / 2 - state.settings.spacing.nodeGap / 2;
    const laneEndX = columnCenters[maxInLaneDepth] + columnWidths[maxInLaneDepth] / 2 + state.settings.spacing.nodeGap / 2;
    return { laneStartX, laneEndX };
}
function applyLaneInnerBounds(state, laneStartX, laneEndX) {
    for (const lane of state.lanes) {
        lane.x = laneStartX;
        lane.width = laneEndX - laneStartX;
    }
}
function buildBoundaryBandResolver(boundaryBandGap, laneStartX, laneEndX, state) {
    const laneById = new Map(state.lanes.map((lane) => [lane.id, lane]));
    return (node) => {
        if (!isBoundaryBandNode(node)) {
            return undefined;
        }
        if (node.laneId && !laneById.has(node.laneId)) {
            return undefined;
        }
        const direction = getNodeDirection(node);
        const halfWidth = effectiveSize(node).width / 2;
        if (isInboundDirection(direction)) {
            return laneStartX - boundaryBandGap - halfWidth;
        }
        if (isOutboundDirection(direction)) {
            return laneEndX + boundaryBandGap + halfWidth;
        }
        return undefined;
    };
}
/**
 * Places nodes within each depth-lane cell. Mutates node.x/y (this stage's real
 * job) but returns provenance text rather than pushing to state.provenanceLog
 * itself — assignNodeSlotsWithinLaneDepth is the single place that attaches
 * provenance to state, per 00_coding_Standards.md's "diagnostics stay out of
 * geometry functions" rule.
 */
function placeNodesWithinDepthAndLane(state, depthLaneMap, laneById, nodeById, incomingByTarget, outgoingBySource, columnCenters, resolveBoundaryBandX) {
    const provenance = [];
    const settings = state.settings;
    const sortedGroups = Array.from(depthLaneMap.entries()).sort((a, b) => {
        const [aKey] = a;
        const [bKey] = b;
        const aSep = aKey.indexOf('|');
        const bSep = bKey.indexOf('|');
        const aDepth = parseInt(aKey.slice(0, aSep), 10);
        const bDepth = parseInt(bKey.slice(0, bSep), 10);
        if (aDepth !== bDepth) {
            return aDepth - bDepth;
        }
        const aLane = aKey.slice(aSep + 1);
        const bLane = bKey.slice(bSep + 1);
        return aLane.localeCompare(bLane);
    });
    for (const [key, nodes] of sortedGroups) {
        const delimiterIdx = key.indexOf('|');
        if (delimiterIdx < 0)
            continue;
        const depthStr = key.slice(0, delimiterIdx);
        const laneId = key.slice(delimiterIdx + 1);
        const depth = parseInt(depthStr, 10);
        const lane = laneById.get(laneId);
        if (!lane)
            continue;
        const x = columnCenters[depth];
        const laneHeaderHeight = state.settings.canvasConfig.laneHeaderHeight;
        const usableHeight = lane.height - laneHeaderHeight;
        const laneCenter = lane.y + laneHeaderHeight + usableHeight / 2;
        const packTop = lane.y + laneHeaderHeight + state.settings.spacing.lanePaddingTop;
        const packBottom = lane.y + lane.height - state.settings.spacing.lanePaddingBottom;
        // Build slot allocator from settings — pluggable ordering strategy
        const strategy = state.settings.layout.slotOrdering === 'barycenter'
            ? BarycentreStrategy
            : ChainIndexStrategy;
        const allocator = new LaneSlotAllocator(strategy);
        const allocContext = { incomingByTarget, outgoingBySource, nodeById };
        const orderedNodes = strategy.sort(nodes, allocContext);
        const mixedRelayPlacement = resolveMixedDecisionRelayPlacement(lane, depth, orderedNodes, laneCenter, x, incomingByTarget, outgoingBySource, laneById, nodeById, columnCenters, settings);
        if (mixedRelayPlacement) {
            for (const node of orderedNodes) {
                const boundaryBandX = resolveBoundaryBandX(node);
                const shiftedX = mixedRelayPlacement.xByNode.get(node.id);
                node.x = boundaryBandX ?? shiftedX ?? x;
                const lockedX = mixedRelayPlacement.lockXByNode.get(node.id);
                if (lockedX !== undefined) {
                    const meta = node.metadata || {};
                    meta.mixedRelayLockX = lockedX;
                    const lockGatewayId = mixedRelayPlacement.lockGatewayIdByNode.get(node.id);
                    if (lockGatewayId) {
                        meta.mixedRelayLockGatewayId = lockGatewayId;
                    }
                    node.metadata = meta;
                }
                const explicitY = mixedRelayPlacement.yByNode.get(node.id);
                if (explicitY !== undefined) {
                    node.y = explicitY;
                }
            }
            continue;
        }
        if (orderedNodes.length === 1) {
            const node = orderedNodes[0];
            const defaultY = Math.max(packTop, Math.min(packBottom, laneCenter));
            const alignedY = resolveContinuityAlignedY(node, lane, laneHeaderHeight, incomingByTarget, outgoingBySource, nodeById);
            const boundaryBandX = resolveBoundaryBandX(node);
            node.x = boundaryBandX ?? x;
            node.y = alignedY ?? defaultY;
            if (alignedY !== undefined && Math.abs(defaultY - alignedY) > state.settings.heuristics.continuityTolerancePx) {
                provenance.push(`continuity-alignment:${node.id}:y=${Math.round(defaultY)}->${Math.round(alignedY)}`);
            }
            continue;
        }
        // Multiple nodes: use the allocator for vertical stacking within pack bounds
        const assignments = allocator.allocate(orderedNodes, packTop, packBottom, settings.spacing.canvasPaddingY, allocContext);
        for (const { id, y } of assignments) {
            const node = nodeById.get(id);
            if (!node)
                continue;
            const boundaryBandX = resolveBoundaryBandX(node);
            node.x = boundaryBandX ?? x;
            node.y = y;
        }
    }
    return provenance;
}
/**
 * Pre-reserve corridor space for routing channels in each lane.
 *
 * Estimates how many top/bottom channels each lane will need (by counting
 * cross-lane and loopback edges), then pre-pads lane height by that amount
 * so that `expandLanesForRoutingChannels` (in the routing phase) is a no-op
 * for the common case, reducing layout shift.
 *
 * The pre-reserved amounts are stored on `lane.preReservedTopChannels` and
 * `lane.preReservedBottomChannels` so `expandLanesForRoutingChannels` can
 * subtract them from the actual delta.
 */
export function preReserveCorridorSpace(state) {
    const nodeById = new Map(state.nodes.map((n) => [n.id, n]));
    const laneOrder = new Map();
    state.lanes
        .slice()
        .sort((a, b) => a.y - b.y)
        .forEach((lane, i) => laneOrder.set(lane.id, i));
    const loopbackUsage = new Map();
    const pairUsage = new Map();
    // Top-channel count per lane (loopbacks going upward, negative channels)
    const topByLane = new Map();
    // Bottom-channel count per lane (loopbacks going downward + cross-lane, positive channels)
    const bottomByLane = new Map();
    const activeEdges = state.edges.filter((e) => e.flowLayer !== 'hidden');
    for (const edge of activeEdges.slice().sort((a, b) => a.id.localeCompare(b.id))) {
        const src = nodeById.get(edge.source);
        const tgt = nodeById.get(edge.target);
        if (!src?.laneId || !tgt?.laneId)
            continue;
        const srcIdx = laneOrder.get(src.laneId) ?? 0;
        const tgtIdx = laneOrder.get(tgt.laneId) ?? 0;
        const delta = tgtIdx - srcIdx;
        const srcDepth = src.depth ?? 0;
        const tgtDepth = tgt.depth ?? 0;
        if (delta === 0 && tgtDepth < srcDepth) {
            // Loopback — uses top or bottom rail of the lane
            const useBottom = (src.y ?? 0) > (tgt.y ?? 0);
            const loopSide = useBottom ? 'bottom' : 'top';
            const key = `${src.laneId}|${loopSide}`;
            const used = loopbackUsage.get(key) ?? 0;
            loopbackUsage.set(key, used + 1);
            if (useBottom) {
                bottomByLane.set(src.laneId, Math.max(bottomByLane.get(src.laneId) ?? 0, used + 1));
            }
            else {
                topByLane.set(src.laneId, Math.max(topByLane.get(src.laneId) ?? 0, used + 1));
            }
        }
        else if (delta !== 0) {
            // Cross-lane — contributes channel space at the source lane boundary
            const direction = Math.sign(delta);
            const pairKey = `${srcIdx}->${tgtIdx}:${direction}`;
            const used = pairUsage.get(pairKey) ?? 0;
            pairUsage.set(pairKey, used + 1);
            if (direction > 0) {
                bottomByLane.set(src.laneId, Math.max(bottomByLane.get(src.laneId) ?? 0, used + 1));
            }
            else {
                topByLane.set(src.laneId, Math.max(topByLane.get(src.laneId) ?? 0, used + 1));
            }
        }
    }
    const channelSpacing = state.settings.spacing.channelSpacing;
    let yOffset = 0;
    for (const lane of state.lanes) {
        const top = topByLane.get(lane.id) ?? 0;
        const bottom = bottomByLane.get(lane.id) ?? 0;
        const topPad = top * channelSpacing;
        const bottomPad = bottom * channelSpacing;
        lane.preReservedTopChannels = top;
        lane.preReservedBottomChannels = bottom;
        lane.y += yOffset;
        lane.height += topPad + bottomPad;
        for (const node of state.nodes) {
            if (node.laneId === lane.id && node.y !== undefined) {
                node.y += topPad + yOffset;
            }
        }
        yOffset += topPad + bottomPad;
    }
    if (yOffset > 0) {
        state.totalBounds.maxY += yOffset;
    }
}
