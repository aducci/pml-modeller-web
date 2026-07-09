/**
 * Pattern Matcher — evaluates DetectCriteria against a resolved edge context
 * and returns the first matching PatternDefinition (sorted by priority desc).
 *
 * This is the single function that owns the "which pattern fires?" decision.
 * All match logic lives here; callers just pass a MatchContext.
 */
import { computeLaneDirection } from '../processLayout/layoutTypes';
import { isBoundaryEventNode } from '../nodeKinds';
import { avg } from '../layoutGeometry';
/** Build a MatchContext from layout nodes, lane map, and neighborhood data. */
export function buildMatchContext(source, target, laneMap, sourceOutDegree, targetInDegree, outgoingTargetLaneIds) {
    const sameLane = source.laneId === target.laneId;
    const sourceDepth = source.depth ?? 0;
    const targetDepth = target.depth ?? 0;
    const isLoopback = sameLane && targetDepth < sourceDepth;
    const sourceIsBoundary = isBoundaryEventNode(source);
    const targetIsBoundary = isBoundaryEventNode(target);
    const laneDirection = computeLaneDirection(source, target, laneMap);
    const loopbackSide = isLoopback
        ? computeLoopbackSide(source, target, laneMap)
        : 'bottom';
    const allTargetsInSourceLane = outgoingTargetLaneIds.length > 0 &&
        source.laneId !== undefined &&
        outgoingTargetLaneIds.every((id) => id === source.laneId);
    const deltaY = Math.abs((source.y ?? 0) - (target.y ?? 0));
    const maxH = Math.max(source.height, target.height);
    const deltaYRatio = maxH > 0 ? deltaY / maxH : 0;
    return {
        sourceIsBoundary,
        targetIsBoundary,
        sameLane,
        isLoopback,
        loopbackSide,
        sourceNodeType: source.type ?? 'unknown',
        sourceOutDegree,
        targetInDegree,
        allTargetsInSourceLane,
        laneDirection,
        deltaYRatio,
    };
}
/** Evaluate a pattern table against a context; returns first matching pattern or null. */
export function matchPattern(table, ctx) {
    const sorted = [...table].sort((a, b) => b.priority - a.priority);
    for (const pattern of sorted) {
        if (!pattern.enabled)
            continue;
        if (matches(pattern.detect, ctx)) {
            return { pattern, scenarioKey: pattern.id };
        }
    }
    return null;
}
// ─── Criteria evaluator ───────────────────────────────────────────────────────
function matches(criteria, ctx) {
    if (criteria.sourceIsBoundary !== undefined && ctx.sourceIsBoundary !== criteria.sourceIsBoundary)
        return false;
    if (criteria.targetIsBoundary !== undefined && ctx.targetIsBoundary !== criteria.targetIsBoundary)
        return false;
    if (criteria.sameLane !== undefined && ctx.sameLane !== criteria.sameLane)
        return false;
    if (criteria.isLoopback !== undefined && ctx.isLoopback !== criteria.isLoopback)
        return false;
    if (criteria.loopbackSide !== undefined && ctx.loopbackSide !== criteria.loopbackSide)
        return false;
    if (criteria.sourceNodeTypes !== undefined && !criteria.sourceNodeTypes.includes(ctx.sourceNodeType))
        return false;
    if (criteria.sourceOutDegreeGt !== undefined && ctx.sourceOutDegree <= criteria.sourceOutDegreeGt)
        return false;
    if (criteria.targetInDegreeGt !== undefined && ctx.targetInDegree <= criteria.targetInDegreeGt)
        return false;
    if (criteria.allTargetsInSourceLane !== undefined && ctx.allTargetsInSourceLane !== criteria.allTargetsInSourceLane)
        return false;
    if (criteria.laneDirection !== undefined) {
        if (criteria.laneDirection === 'upward' && ctx.laneDirection !== 'upward')
            return false;
        if (criteria.laneDirection === 'downward' && ctx.laneDirection !== 'downward')
            return false;
    }
    if (criteria.deltaYRatioGt !== undefined && ctx.deltaYRatio <= criteria.deltaYRatioGt)
        return false;
    return true;
}
// ─── Helpers (duplicated here to keep matcher self-contained) ─────────────────
function computeLoopbackSide(source, target, laneMap) {
    const lane = source.laneId ? laneMap.get(source.laneId) : undefined;
    if (lane && source.y !== undefined && target.y !== undefined) {
        const laneCenterY = lane.y + lane.height / 2;
        const routeCenterY = avg(source.y, target.y);
        return routeCenterY >= laneCenterY ? 'bottom' : 'top';
    }
    return (source.y ?? 0) > (target.y ?? 0) ? 'bottom' : 'top';
}
