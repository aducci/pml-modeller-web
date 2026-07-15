// Stage: Lane Geometry + Depth Folding
// reads:  nodes (depth, actor, type, metadata), edges, lanes, chains, settings
// writes: nodes.laneId
//         [depth-folding sub-stage] nodes.depth (may be reduced in compact mode)
// - optional depth folding (compact density).
import { analyzeDecisionLaneAffinity, propagateLaneConsensus } from './laneConsensus';
import { recordStage, buildIncomingOutgoingMaps, buildById } from './stageHelpers';
import { getNodeDirection, isBoundaryBandNode, isInboundDirection, isOutboundDirection, } from '../nodeKinds';
export function computeLaneGeometry(state) {
    recordStage(state, 'lane-geometry');
    const laneByActorId = new Map();
    const nodeById = buildById(state.nodes);
    for (const lane of state.lanes) {
        if (lane.actorId) {
            laneByActorId.set(lane.actorId, lane);
        }
    }
    const isInterfaceEvent = (node) => isBoundaryBandNode(node);
    const groupingStrategy = state.groupingStrategy;
    for (const node of state.nodes) {
        const groupKey = groupingStrategy.groupKeyOf(node);
        if (groupKey) {
            const lane = laneByActorId.get(groupKey);
            if (lane) {
                node.laneId = lane.id;
            }
        }
    }
    const consensusNodes = state.nodes.filter((node) => !isInterfaceEvent(node));
    const { defaultAssignments } = applyLaneConsensus(state, nodeById, consensusNodes, groupingStrategy);
    if (defaultAssignments > 0) {
        state.diagnostics.warnings.push(`Lane consensus used default assignment for ${defaultAssignments} node(s).`);
    }
    const defaultLaneId = state.lanes[0]?.id ?? 'default';
    const { incomingByTarget, outgoingBySource } = buildIncomingOutgoingMaps(state.edges);
    for (const node of state.nodes) {
        if (!isInterfaceEvent(node) || node.laneId) {
            continue;
        }
        const direction = getNodeDirection(node);
        const incoming = incomingByTarget.get(node.id) || [];
        const outgoing = outgoingBySource.get(node.id) || [];
        let inferredLaneId;
        if (isInboundDirection(direction)) {
            for (const edge of outgoing) {
                const targetLaneId = nodeById.get(edge.target)?.laneId;
                if (targetLaneId) {
                    inferredLaneId = targetLaneId;
                    break;
                }
            }
        }
        else if (isOutboundDirection(direction)) {
            for (const edge of incoming) {
                const sourceLaneId = nodeById.get(edge.source)?.laneId;
                if (sourceLaneId) {
                    inferredLaneId = sourceLaneId;
                    break;
                }
            }
        }
        else {
            for (const edge of incoming) {
                const sourceLaneId = nodeById.get(edge.source)?.laneId;
                if (sourceLaneId) {
                    inferredLaneId = sourceLaneId;
                    break;
                }
            }
            if (!inferredLaneId) {
                for (const edge of outgoing) {
                    const targetLaneId = nodeById.get(edge.target)?.laneId;
                    if (targetLaneId) {
                        inferredLaneId = targetLaneId;
                        break;
                    }
                }
            }
        }
        node.laneId = inferredLaneId || defaultLaneId;
    }
    const affinityWarnings = applyDecisionLaneAffinity(state, nodeById);
    state.diagnostics.warnings.push(...affinityWarnings);
    return state;
}
// ---------------------------------------------------------------------------
// Extracted computation helpers — these mutate node.laneId (their real job,
// a legitimate B-geometry write) but return diagnostic text rather than
// pushing to state.diagnostics.warnings themselves. computeLaneGeometry above
// is the single place that attaches diagnostics to state, per
// 00_coding_Standards.md's "diagnostics stay out of geometry functions" rule.
// ---------------------------------------------------------------------------
function applyLaneConsensus(state, nodeById, consensusNodes, groupingStrategy) {
    const fallbackLaneId = groupingStrategy.unassignedLaneId
        ? state.lanes.find((l) => l.id === groupingStrategy.unassignedLaneId)?.id
        : undefined;
    const consensus = propagateLaneConsensus(consensusNodes, state.edges, state.lanes, state.settings.laneConsensus.successorWeight, fallbackLaneId);
    let defaultAssignments = 0;
    for (const decision of consensus.decisions) {
        const node = nodeById.get(decision.nodeId);
        if (!node || node.laneId) {
            continue;
        }
        node.laneId = decision.assignedLaneId;
        if (decision.reason === 'default') {
            defaultAssignments += 1;
        }
    }
    return { defaultAssignments };
}
function applyDecisionLaneAffinity(state, nodeById) {
    const recommendations = analyzeDecisionLaneAffinity(state.nodes, state.edges, state.settings.routing.decisionLaneAffinity);
    if (recommendations.length === 0)
        return [];
    const warnings = [];
    const mode = state.settings.routing.decisionLaneAffinity.mode;
    for (const rec of recommendations) {
        if (mode === 'adaptive') {
            const node = nodeById.get(rec.nodeId);
            if (node) {
                node.laneId = rec.suggestedLaneId;
            }
            warnings.push(`Decision lane-affinity moved ${rec.nodeId} from ${rec.currentLaneId} to ${rec.suggestedLaneId} (dominant outgoing ratio ${rec.dominantOutgoingRatio.toFixed(2)} across ${rec.outgoingEdgeCount} outgoing edge(s)).`);
        }
        else {
            warnings.push(`Decision lane-affinity advisory: ${rec.nodeId} may reduce crossings if moved from ${rec.currentLaneId} to ${rec.suggestedLaneId} (dominant outgoing ratio ${rec.dominantOutgoingRatio.toFixed(2)} across ${rec.outgoingEdgeCount} outgoing edge(s)).`);
        }
    }
    return warnings;
}
export function applyDepthFolding(state) {
    if (state.settings.densityMode !== 'compact')
        return state;
    recordStage(state, 'depth-folding');
    const occupiedSlots = new Map();
    const nodeById = buildById(state.nodes);
    const incomingByTarget = new Map();
    for (const edge of state.edges) {
        if (!incomingByTarget.has(edge.target)) {
            incomingByTarget.set(edge.target, []);
        }
        incomingByTarget.get(edge.target).push(edge.source);
    }
    // Key-flow nodes fold first so branches fold around them, not the reverse.
    const keyFlowNodeIds = new Set(state.chains.find((c) => c.isPrimary)?.nodeIds ?? []);
    const keyFlowChainIndex = new Map();
    for (const chain of state.chains) {
        if (chain.isPrimary) {
            chain.nodeIds.forEach((id, i) => keyFlowChainIndex.set(id, i));
        }
    }
    const sortedNodes = [...state.nodes].sort((a, b) => {
        const aKey = keyFlowNodeIds.has(a.id) ? 0 : 1;
        const bKey = keyFlowNodeIds.has(b.id) ? 0 : 1;
        if (aKey !== bKey)
            return aKey - bKey;
        // Within key-flow, preserve chain order
        if (aKey === 0) {
            return (keyFlowChainIndex.get(a.id) ?? 0) - (keyFlowChainIndex.get(b.id) ?? 0);
        }
        return (a.depth ?? 0) - (b.depth ?? 0);
    });
    for (const node of sortedNodes) {
        if (node.depth === undefined || !node.laneId)
            continue;
        const incomingParentIds = incomingByTarget.get(node.id) || [];
        let maxParentDepth = -1;
        let allParentsInDifferentLanes = true;
        let hasValidParents = false;
        for (const parentId of incomingParentIds) {
            const parent = nodeById.get(parentId);
            if (parent && parent.depth !== undefined && parent.depth < node.depth) {
                hasValidParents = true;
                maxParentDepth = Math.max(maxParentDepth, parent.depth);
                if (parent.laneId === node.laneId) {
                    allParentsInDifferentLanes = false;
                }
            }
        }
        if (hasValidParents && allParentsInDifferentLanes && maxParentDepth !== -1) {
            const targetSlotOccupied = occupiedSlots.get(maxParentDepth)?.has(node.laneId);
            if (!targetSlotOccupied) {
                node.depth = maxParentDepth;
            }
        }
        let set = occupiedSlots.get(node.depth);
        if (!set) {
            set = new Set();
            occupiedSlots.set(node.depth, set);
        }
        set.add(node.laneId);
    }
    return state;
}
