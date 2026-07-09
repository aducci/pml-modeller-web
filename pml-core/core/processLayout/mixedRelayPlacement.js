// Stage: Coordinate Assignment helper — mixed decision relay placement
// reads:  nodes (type, laneId, depth, y, x, metadata), edges, lanes, settings
// writes: nothing — returns per-node x/y/lock overrides; caller applies them
//
// Detects a "mixed decision relay" pattern: multiple boundary-band event
// nodes converging from one shared decision gateway in the same depth-lane
// cell. When found, computes custom x/y placement (and x-lock metadata for
// downstream routing) for those nodes instead of the generic slot-allocator
// stacking placeNodesWithinDepthAndLane uses for ordinary cells.
//
// Extracted from a ~155-line closure inside placeNodesWithinDepthAndLane
// (coordinateAssignment.ts) — it only ever read plain data (adjacency maps,
// column centers, settings), so it didn't need to be a closure; giving it a
// real signature and its own file matches the design brief's "prefer a new
// small module over growing an existing one past its single concern."
import { isEventNodeKind, isBoundaryBandNode } from '../nodeKinds';
import { effectiveSize } from './elementSizing';
export function resolveMixedDecisionRelayPlacement(lane, depth, nodesAtDepthLane, laneCenter, columnCenterX, incomingByTarget, outgoingBySource, laneById, nodeById, columnCenters, settings) {
    if (nodesAtDepthLane.length < 2) {
        return undefined;
    }
    const laneHeaderHeight = settings.canvasConfig.laneHeaderHeight;
    const laneMinY = lane.y + laneHeaderHeight;
    const laneMaxY = lane.y + lane.height;
    let sharedGatewayId;
    const relays = [];
    for (const node of nodesAtDepthLane) {
        if (!isEventNodeKind(node.type) || isBoundaryBandNode(node)) {
            return undefined;
        }
        const incoming = incomingByTarget.get(node.id) || [];
        if (incoming.length !== 1) {
            return undefined;
        }
        const gatewayId = incoming[0].source;
        const gateway = nodeById.get(gatewayId);
        if (!gateway || gateway.type !== 'decision') {
            return undefined;
        }
        if (gateway.laneId !== lane.id) {
            return undefined;
        }
        if (sharedGatewayId === undefined) {
            sharedGatewayId = gatewayId;
        }
        else if (sharedGatewayId !== gatewayId) {
            return undefined;
        }
        const outgoing = outgoingBySource.get(node.id) || [];
        const primary = outgoing[0] ? nodeById.get(outgoing[0].target) : undefined;
        const downstreamY = primary?.y ?? node.y ?? laneCenter;
        let branchKind = 'local';
        if (primary?.laneId && primary.laneId !== lane.id) {
            const targetLane = laneById.get(primary.laneId);
            if (targetLane) {
                branchKind = targetLane.y > lane.y ? 'down' : 'up';
            }
            else {
                branchKind = downstreamY > laneCenter ? 'down' : 'up';
            }
        }
        else {
            const gatewayY = gateway?.y ?? laneCenter;
            if (downstreamY > gatewayY + 1)
                branchKind = 'down';
            else if (downstreamY < gatewayY - 1)
                branchKind = 'up';
        }
        relays.push({ node, downstreamY, branchKind });
    }
    const local = relays.filter((r) => r.branchKind === 'local');
    const down = relays.filter((r) => r.branchKind === 'down').sort((a, b) => a.downstreamY - b.downstreamY || a.node.id.localeCompare(b.node.id));
    const up = relays.filter((r) => r.branchKind === 'up').sort((a, b) => b.downstreamY - a.downstreamY || a.node.id.localeCompare(b.node.id));
    if (up.length > 0) {
        return undefined;
    }
    let centerRelay;
    let downStack = [];
    let allDownwardVariant = false;
    if (local.length === 1 && down.length >= 1) {
        centerRelay = local[0];
        downStack = down;
    }
    else if (local.length === 0 && down.length >= 2) {
        centerRelay = down[0];
        downStack = down.slice(1);
        allDownwardVariant = true;
    }
    else {
        return undefined;
    }
    const yByNode = new Map();
    const xByNode = new Map();
    const lockXByNode = new Map();
    const lockGatewayIdByNode = new Map();
    const centerNode = centerRelay.node;
    const centerHalf = effectiveSize(centerNode).height / 2;
    const centeredY = Math.max(laneMinY + centerHalf, Math.min(laneMaxY - centerHalf, laneCenter));
    yByNode.set(centerNode.id, centeredY);
    if (allDownwardVariant) {
        const centerOutgoing = outgoingBySource.get(centerNode.id) || [];
        const primaryTarget = centerOutgoing[0] ? nodeById.get(centerOutgoing[0].target) : undefined;
        const targetDepth = primaryTarget?.depth ?? depth + 1;
        const targetCenterX = columnCenters[targetDepth] ?? primaryTarget?.x;
        const targetWidth = primaryTarget ? effectiveSize(primaryTarget).width : undefined;
        if (targetCenterX !== undefined && targetWidth !== undefined) {
            const targetLeftAnchorX = targetCenterX - targetWidth / 2;
            const targetEntryCorridorX = targetLeftAnchorX - 12;
            xByNode.set(centerNode.id, targetEntryCorridorX);
        }
    }
    let previousY = centeredY;
    let previousHalf = centerHalf;
    const gatewayX = sharedGatewayId ? nodeById.get(sharedGatewayId)?.x : undefined;
    const downRailX = allDownwardVariant
        ? (gatewayX ?? columnCenterX)
        : columnCenterX + Math.max(settings.heuristics.mixedRelayHorizontalMinOffsetPx, settings.spacing.nodeGap);
    for (let idx = 0; idx < downStack.length; idx++) {
        const relay = downStack[idx];
        const node = relay.node;
        const half = effectiveSize(node).height / 2;
        const minGap = allDownwardVariant
            ? settings.spacing.canvasPaddingY + Math.max(settings.heuristics.mixedRelayVerticalMinGapPx, settings.spacing.canvasPaddingY)
            : settings.spacing.canvasPaddingY;
        const desiredY = previousY + previousHalf + minGap + half;
        const clampedY = Math.max(laneMinY + half, Math.min(laneMaxY - half, desiredY));
        yByNode.set(node.id, clampedY);
        const perBranchX = (!allDownwardVariant && idx > 0 && gatewayX !== undefined)
            ? gatewayX
            : downRailX;
        xByNode.set(node.id, perBranchX);
        if (allDownwardVariant) {
            lockXByNode.set(node.id, downRailX);
            if (sharedGatewayId) {
                lockGatewayIdByNode.set(node.id, sharedGatewayId);
            }
        }
        else if (idx > 0 && gatewayX !== undefined && sharedGatewayId) {
            lockXByNode.set(node.id, gatewayX);
            lockGatewayIdByNode.set(node.id, sharedGatewayId);
        }
        previousY = clampedY;
        previousHalf = half;
    }
    return { yByNode, xByNode, lockXByNode, lockGatewayIdByNode };
}
