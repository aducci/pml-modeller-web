import { buildMatchContext, matchPattern } from './patternMatcher';
/**
 * Scenario Resolver — Single controller for Layer A classification.
 *
 * Resolves: scenario key (all 11, kebab-case per spec Section 25.1),
 * flow layer, semantic role, applied policies, and CrossLaneAlignmentContext.
 *
 * IP-1: Full 11-scenario registry, boundary detection, decision-split detection,
 *        fan-in detection, same-lane-straight vs elbow discrimination.
 */
import { computeLaneDirection, } from '../processLayout/layoutTypes';
import { isBoundaryEventNode, isGatewayNodeKind } from '../nodeKinds';
import { avg } from '../layoutGeometry';
export function resolveScenario(source, target, edge, laneMap, neighborhood, patternTable) {
    const sourceDepth = source.depth ?? 0;
    const targetDepth = target.depth ?? 0;
    const isVirtual = laneMap.size === 1 && laneMap.has('__virtual__');
    const isSameLane = isVirtual ? true : source.laneId === target.laneId;
    const laneDirection = isVirtual ? 'same' : computeLaneDirection(source, target, laneMap);
    const cycleDetected = targetDepth < sourceDepth && isSameLane;
    const isLoopback = cycleDetected || (isSameLane && targetDepth < sourceDepth);
    const flowLayer = edge.flowLayer ?? 'main';
    const semanticRole = edge.semanticRole ?? 'normalFlow';
    const appliedPolicies = computeAppliedPolicies(isLoopback, laneDirection, source, target, neighborhood);
    const crossLaneContext = isSameLane ? undefined : computeCrossLaneContext(source, target, laneMap);
    const flowLayerBias = computeFlowLayerBias(flowLayer, semanticRole);
    let scenarioKey;
    let matchedFlow;
    if (patternTable && patternTable.length > 0) {
        const ctx = buildMatchContext(source, target, laneMap, neighborhood?.sourceOutDegree ?? 1, neighborhood?.targetInDegree ?? 1, neighborhood?.sourceOutgoingTargetLaneIds ?? []);
        const result = matchPattern(patternTable, ctx);
        if (result) {
            scenarioKey = result.scenarioKey;
            matchedFlow = result.pattern.flow;
        }
        else {
            scenarioKey = computeScenarioKey(isLoopback, isSameLane, laneDirection, source, target, laneMap, neighborhood);
        }
    }
    else {
        scenarioKey = computeScenarioKey(isLoopback, isSameLane, laneDirection, source, target, laneMap, neighborhood);
    }
    const routeIntent = computeRouteIntent(scenarioKey, flowLayer, semanticRole, isLoopback);
    return {
        scenarioKey,
        isLoopback,
        isSameLane,
        laneDirection,
        flowLayer,
        semanticRole,
        routeIntent,
        flowLayerBias,
        appliedPolicies,
        crossLaneContext,
        matchedFlow,
    };
}
// ---------------------------------------------------------------------------
// Scenario key — priority order: boundary > loopback > decision-split >
// fan-in > same-lane > cross-lane
// ---------------------------------------------------------------------------
function computeScenarioKey(isLoopback, isSameLane, laneDirection, source, target, laneMap, neighborhood) {
    // 1. Boundary events take highest priority
    if (isBoundaryEvent(source))
        return 'boundary-outbound';
    if (isBoundaryEvent(target))
        return 'boundary-inbound';
    // 2. Same-lane loopback
    if (isSameLane && isLoopback) {
        return computeLoopbackSide(source, target, laneMap);
    }
    // 3. Decision splits (source is a gateway with multiple outputs)
    if (isGateway(source) && (neighborhood?.sourceOutDegree ?? 0) > 1) {
        const outgoingLaneIds = neighborhood?.sourceOutgoingTargetLaneIds ?? [];
        const allTargetsInSourceLane = outgoingLaneIds.length > 0 &&
            source.laneId !== undefined &&
            outgoingLaneIds.every((laneId) => laneId === source.laneId);
        if (allTargetsInSourceLane) {
            return 'decision-split-vertical';
        }
        return 'decision-split-horizontal';
    }
    // 4. Fan-in joins (target has multiple incoming edges, not a loopback)
    if (!isLoopback && (neighborhood?.targetInDegree ?? 0) > 1) {
        return 'fan-in-join';
    }
    // 5. Same-lane forward
    if (isSameLane) {
        return computeSameLaneForwardKey(source, target);
    }
    // 6. Cross-lane
    if (laneDirection === 'downward')
        return 'cross-lane-downward';
    return 'cross-lane-upward';
}
function computeLoopbackSide(source, target, laneMap) {
    const lane = source.laneId ? laneMap.get(source.laneId) : undefined;
    if (lane && source.y !== undefined && target.y !== undefined) {
        const laneCenterY = lane.y + lane.height / 2;
        const routeCenterY = avg(source.y, target.y);
        return routeCenterY >= laneCenterY
            ? 'same-lane-loopback-bottom'
            : 'same-lane-loopback-top';
    }
    const sourceY = source.y ?? 0;
    const targetY = target.y ?? 0;
    if (sourceY > targetY)
        return 'same-lane-loopback-bottom';
    return 'same-lane-loopback-top';
}
function computeSameLaneForwardKey(source, target) {
    const deltaY = Math.abs((source.y ?? 0) - (target.y ?? 0));
    const elbowThreshold = Math.max(source.height, target.height) * 0.5;
    return deltaY > elbowThreshold ? 'same-lane-elbow' : 'same-lane-straight';
}
function isBoundaryEvent(node) {
    return isBoundaryEventNode(node);
}
function isGateway(node) {
    return isGatewayNodeKind(node.type);
}
// ---------------------------------------------------------------------------
// Applied policies
// ---------------------------------------------------------------------------
function computeAppliedPolicies(isLoopback, laneDirection, source, target, neighborhood) {
    const policies = [];
    if (isLoopback)
        policies.push('backward-gateway-loopback');
    if (laneDirection === 'upward' && !isLoopback)
        policies.push('long-backward-flow');
    if (isGateway(source) && (neighborhood?.sourceOutDegree ?? 0) > 1)
        policies.push('decision-fan-out');
    if ((neighborhood?.targetInDegree ?? 0) > 1)
        policies.push('fan-in-convergence');
    if (isBoundaryEvent(source) || isBoundaryEvent(target))
        policies.push('boundary-attachment');
    return policies;
}
// ---------------------------------------------------------------------------
// Flow layer bias (spec Section 10.2)
// ---------------------------------------------------------------------------
function computeFlowLayerBias(flowLayer, semanticRole) {
    const isException = semanticRole === 'exceptionFlow' || semanticRole === 'compensationFlow' || semanticRole === 'eventEscalation';
    return {
        preferOuterCorridors: flowLayer === 'alternate' || isException,
        downgradeLockedPorts: (flowLayer === 'alternate' || isException),
        preferCrossLaneMode: flowLayer === 'message',
        skipPatternHeuristics: flowLayer === 'annotation',
    };
}
// ---------------------------------------------------------------------------
// Route intent (spec Section 14)
// ---------------------------------------------------------------------------
function computeRouteIntent(scenarioKey, flowLayer, semanticRole, isLoopback) {
    const priority = flowLayer === 'main' ? 'main'
        : flowLayer === 'alternate' ? 'alternate'
            : 'background';
    const isException = semanticRole === 'exceptionFlow' || semanticRole === 'compensationFlow' || semanticRole === 'eventEscalation';
    const isBranch = scenarioKey.includes('cross-lane') || scenarioKey.includes('boundary') || scenarioKey.includes('decision-split');
    const visualRole = isLoopback ? 'loopback'
        : isException ? 'exception'
            : isBranch ? 'branch'
                : 'spine';
    return {
        priority,
        visualRole,
        preserveStraightness: flowLayer === 'main' && !isLoopback && !isBranch,
        corridorAffinity: flowLayer === 'main' ? 'primary' : 'secondary',
        flowLayer,
        semanticRole,
    };
}
// ---------------------------------------------------------------------------
// CrossLaneAlignmentContext
// ---------------------------------------------------------------------------
function computeCrossLaneContext(source, target, laneMap) {
    const sourceX = source.x ?? 0;
    const targetX = target.x ?? 0;
    const sourceLeft = sourceX - source.width / 2;
    const sourceRight = sourceX + source.width / 2;
    const targetLeft = targetX - target.width / 2;
    const targetRight = targetX + target.width / 2;
    const xOverlapPx = Math.max(0, Math.min(sourceRight, targetRight) - Math.max(sourceLeft, targetLeft));
    const xCenterDeltaPx = Math.abs(sourceX - targetX);
    const sourceTop = (source.y ?? 0) - source.height / 2;
    const sourceBottom = (source.y ?? 0) + source.height / 2;
    const targetTop = (target.y ?? 0) - target.height / 2;
    const targetBottom = (target.y ?? 0) + target.height / 2;
    const gapTop = Math.min(sourceTop, targetTop);
    const gapBottom = Math.max(sourceBottom, targetBottom);
    const straightClearPx = Math.max(0, gapBottom - gapTop - source.height - target.height);
    const sourceLane = source.laneId ? laneMap.get(source.laneId) : undefined;
    const targetLane = target.laneId ? laneMap.get(target.laneId) : undefined;
    const laneGapPx = sourceLane && targetLane
        ? Math.abs(targetLane.y + targetLane.height / 2 - (sourceLane.y + sourceLane.height / 2))
        : 0;
    return { xOverlapPx, xCenterDeltaPx, straightClearPx, laneGapPx };
}
