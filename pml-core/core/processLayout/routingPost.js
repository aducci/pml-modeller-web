// Stage: Routing Post-Processing (Phase C helper)
// reads:  lanes (activeChannels), nodes (laneId, y, metadata), edges (routing.channel)
// writes: lanes.height (expanded), nodes.y (shifted down for top-channel space)
//         nodes.y (continuity locks), nodes.x (mixed-relay X locks)
//
// node.y and lane.y/height are owned by B-geometry but revised here as
// disclosed C-routing handoffs — see phaseContract.ts NODE_FIELD_OWNERSHIP.y
// and LANE_FIELD_OWNERSHIP.y/height for why these specific writes are allowed
// to happen out-of-phase instead of being an undisclosed ownership violation.
import { effectiveSize } from './elementSizing';
export function applyLaneDensityPolicy(state) {
    const settings = state.settings;
    const stackData = new Map();
    for (const node of state.nodes) {
        if (!node.laneId)
            continue;
        const depth = node.depth ?? 0;
        const key = `${node.laneId}|${depth}`;
        const data = stackData.get(key) || { height: 0, count: 0 };
        data.height += effectiveSize(node).height;
        data.count += 1;
        stackData.set(key, data);
    }
    const maxStackHeightByLane = new Map();
    for (const lane of state.lanes) {
        maxStackHeightByLane.set(lane.id, 0);
    }
    for (const [key, data] of stackData.entries()) {
        const laneId = key.split('|')[0];
        const laneHeaderHeight = settings.canvasConfig.laneHeaderHeight;
        const interNodeGaps = Math.max(0, data.count - 1) * settings.spacing.canvasPaddingY;
        const totalStackHeight = laneHeaderHeight +
            settings.spacing.lanePaddingTop +
            data.height +
            interNodeGaps +
            settings.spacing.lanePaddingBottom;
        maxStackHeightByLane.set(laneId, Math.max(maxStackHeightByLane.get(laneId) || 0, totalStackHeight));
    }
    let currentY = settings.spacing.laneGapTop;
    for (let i = 0; i < state.lanes.length; i++) {
        const lane = state.lanes[i];
        const contentHeight = maxStackHeightByLane.get(lane.id) || 0;
        const laneHeaderHeight = settings.canvasConfig.laneHeaderHeight;
        const minPadding = laneHeaderHeight + settings.spacing.lanePaddingTop + settings.spacing.lanePaddingBottom;
        // Lane height = max(header + padding, actual content height)
        lane.height = Math.max(minPadding, contentHeight);
        lane.y = currentY;
        const afterGap = i < state.lanes.length - 1 ? settings.spacing.laneGap : settings.spacing.laneGapBottom;
        currentY += lane.height + afterGap;
    }
}
export function updateLaneActiveChannels(state, edgeChannels) {
    const nodeById = new Map(state.nodes.map((node) => [node.id, node]));
    const edgeById = new Map(state.edges.map((edge) => [edge.id, edge]));
    const channelsByLane = new Map();
    for (const lane of state.lanes) {
        channelsByLane.set(lane.id, new Set([0]));
    }
    for (const [edgeId, channel] of edgeChannels.entries()) {
        const edge = edgeById.get(edgeId);
        if (!edge) {
            continue;
        }
        const sourceLaneId = nodeById.get(edge.source)?.laneId;
        const targetLaneId = nodeById.get(edge.target)?.laneId;
        if (sourceLaneId && channelsByLane.has(sourceLaneId)) {
            channelsByLane.get(sourceLaneId).add(channel);
        }
        if (targetLaneId && channelsByLane.has(targetLaneId)) {
            channelsByLane.get(targetLaneId).add(channel);
        }
    }
    for (const lane of state.lanes) {
        const channels = Array.from(channelsByLane.get(lane.id) || new Set([0]));
        channels.sort((a, b) => a - b);
        lane.activeChannels = channels;
    }
}
// Registered handoff: NODE_FIELD_OWNERSHIP.y / LANE_FIELD_OWNERSHIP.y,height (phaseContract.ts).
export function expandLanesForRoutingChannels(state) {
    let yOffset = 0;
    const channelSpacing = state.settings.spacing.channelSpacing;
    for (const lane of state.lanes) {
        const topChannels = lane.activeChannels.filter(c => c < 0).length;
        const bottomChannels = lane.activeChannels.filter(c => c > 0).length;
        // Deduct pre-reserved space; only expand for the delta (clamped to ≥ 0)
        const additionalTop = Math.max(0, topChannels - (lane.preReservedTopChannels ?? 0));
        const additionalBottom = Math.max(0, bottomChannels - (lane.preReservedBottomChannels ?? 0));
        const topExpansion = additionalTop * channelSpacing;
        const bottomExpansion = additionalBottom * channelSpacing;
        lane.y += yOffset;
        lane.height += topExpansion + bottomExpansion;
        for (const node of state.nodes) {
            if (node.laneId === lane.id && node.y !== undefined) {
                node.y += topExpansion + yOffset;
            }
        }
        yOffset += topExpansion + bottomExpansion;
    }
    state.totalBounds.maxY += yOffset;
}
// Registered handoff: NODE_FIELD_OWNERSHIP.y (phaseContract.ts).
export function applyContinuityAlignmentLocks(state) {
    const nodeById = new Map(state.nodes.map((node) => [node.id, node]));
    for (const node of state.nodes) {
        if (node.y === undefined || !node.metadata?.continuityAlignToNodeId) {
            continue;
        }
        const targetNode = nodeById.get(String(node.metadata.continuityAlignToNodeId));
        if (!targetNode || targetNode.y === undefined) {
            continue;
        }
        if (Math.abs(node.y - targetNode.y) > 0.5) {
            state.provenanceLog.push(`continuity-lock:${node.id}:y=${Math.round(node.y)}->${Math.round(targetNode.y)}:to=${targetNode.id}`);
            node.y = targetNode.y;
        }
    }
}
export function applyMixedRelayXLocks(state) {
    const nodeById = new Map(state.nodes.map((node) => [node.id, node]));
    for (const node of state.nodes) {
        if (node.x === undefined) {
            continue;
        }
        const lockGatewayId = String(node.metadata?.mixedRelayLockGatewayId || '');
        const gatewayX = lockGatewayId ? nodeById.get(lockGatewayId)?.x : undefined;
        const configuredLockX = Number(node.metadata?.mixedRelayLockX);
        const lockedX = Number.isFinite(gatewayX) ? Number(gatewayX) : configuredLockX;
        if (!Number.isFinite(lockedX)) {
            continue;
        }
        if (Math.abs(node.x - lockedX) > 0.5) {
            state.provenanceLog.push(`mixed-relay-x-lock:${node.id}:x=${Math.round(node.x)}->${Math.round(lockedX)}`);
            node.x = lockedX;
        }
    }
}
export function resolveLoopbackStyle(mode) {
    if (mode === 'over-swimlane')
        return 'over-swimlane';
    if (mode === 'cross-lane')
        return 'cross-lane';
    if (mode === 'auto')
        return 'edge-slot';
    return 'edge-slot';
}
