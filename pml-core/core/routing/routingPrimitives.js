import { midpoint } from '../layoutGeometry';
function normalizeOrthogonalPoints(points) {
    if (points.length <= 2)
        return points;
    const deduped = [];
    for (const point of points) {
        const last = deduped[deduped.length - 1];
        if (!last || last.x !== point.x || last.y !== point.y) {
            deduped.push(point);
        }
    }
    if (deduped.length <= 2)
        return deduped;
    const normalized = [deduped[0]];
    for (let i = 1; i < deduped.length - 1; i++) {
        const prev = normalized[normalized.length - 1];
        const curr = deduped[i];
        const next = deduped[i + 1];
        const allVertical = prev.x === curr.x && curr.x === next.x;
        const allHorizontal = prev.y === curr.y && curr.y === next.y;
        if (!allVertical && !allHorizontal) {
            normalized.push(curr);
        }
    }
    normalized.push(deduped[deduped.length - 1]);
    return normalized;
}
export function routeCrossLaneUpFromRightToLeft(anchors, _targetLane, constants, _sourceLane) {
    return routeCrossLaneRightToLeftViaTargetY(anchors, constants);
}
export function routeCrossLaneUpFromTopToLeft(anchors, targetLane, constants, sourceLane) {
    const { src, tgt } = anchors;
    const p0 = src;
    const p1 = { x: src.x, y: src.y - constants.exitBufferPx };
    const railY = resolveCrossLaneUpRailY(targetLane, constants, sourceLane);
    const p2 = { x: p1.x, y: railY };
    const targetEntryX = tgt.x - constants.entryBufferPx;
    const p3 = { x: targetEntryX, y: railY };
    const p4 = { x: targetEntryX, y: tgt.y };
    const p5 = tgt;
    return [p0, p1, p2, p3, p4, p5];
}
function resolveCrossLaneUpRailY(targetLane, constants, sourceLane) {
    const legacyRailY = targetLane.y - constants.laneTopBufferPx;
    if (!sourceLane) {
        return legacyRailY;
    }
    const targetBottom = targetLane.y + targetLane.height;
    const sourceTop = sourceLane.y;
    const hasVerticalGap = sourceTop > targetBottom;
    if (!hasVerticalGap) {
        return legacyRailY;
    }
    // Prefer the inter-lane corridor to avoid unnecessary high arcs when a direct gap exists.
    return (targetBottom + sourceTop) / 2;
}
export function routeCrossLaneDownFromRightToLeft(anchors, _targetLane, constants) {
    return routeCrossLaneRightToLeftViaTargetY(anchors, constants);
}
function routeCrossLaneRightToLeftViaTargetY(anchors, constants) {
    const { src, tgt } = anchors;
    const p0 = src;
    const sourceExitBufferPx = Math.max(constants.exitBufferPx, 12);
    const p1 = { x: src.x + sourceExitBufferPx, y: src.y };
    // Use a target-Y bridge and keep explicit left-entry space for lane readability.
    const targetEntryBufferPx = Math.max(constants.entryBufferPx, 12);
    const p2 = { x: p1.x, y: tgt.y };
    const targetEntryX = tgt.x - targetEntryBufferPx;
    const p3 = { x: targetEntryX, y: tgt.y };
    const p4 = tgt;
    // Keep the explicit pre-terminal buffer segment even though it is collinear
    // with the final attachment segment.
    return [p0, p1, p2, p3, p4];
}
export function routeCrossLaneDownFromBottomToLeft(anchors, _targetLane, constants) {
    const { src, tgt } = anchors;
    const p0 = src;
    const p1 = { x: src.x, y: src.y + constants.exitBufferPx };
    // Canonical L-shape: exit from bottom, descend to target Y, then enter left.
    const p2 = { x: src.x, y: tgt.y };
    const p3 = tgt;
    return normalizeOrthogonalPoints([p0, p1, p2, p3]);
}
export function routeVerticalFirstLeftEntry(anchors, constants) {
    const { src, tgt } = anchors;
    const p0 = src;
    const p1 = { x: src.x, y: src.y + (src.y <= constants.bridgeY ? constants.exitBufferPx : -constants.exitBufferPx) };
    const p2 = { x: p1.x, y: constants.bridgeY };
    const targetEntryX = tgt.x - constants.entryBufferPx;
    const p3 = { x: targetEntryX, y: constants.bridgeY };
    const p4 = { x: targetEntryX, y: tgt.y };
    const p5 = tgt;
    return normalizeOrthogonalPoints([p0, p1, p2, p3, p4, p5]);
}
export function routeStandardVerticalFirst(anchors, bridgeY) {
    const { src, tgt } = anchors;
    return normalizeOrthogonalPoints([
        src,
        { x: src.x, y: bridgeY },
        { x: tgt.x, y: bridgeY },
        tgt,
    ]);
}
export function routeStandardHorizontalFirst(anchors, bridgeY, useMidpointBridgeY, overrideBridgeX) {
    const { src, tgt } = anchors;
    // overrideBridgeX is supplied when the source or target is in a curtain zone
    // so that the elbow lands a small gap inside the lane boundary rather than at
    // the geometric midpoint (which can fall outside the lane).
    const midX = overrideBridgeX ?? midpoint(src, tgt).x;
    if (useMidpointBridgeY) {
        return normalizeOrthogonalPoints([
            src,
            { x: midX, y: src.y },
            { x: midX, y: bridgeY },
            { x: tgt.x, y: bridgeY },
            tgt,
        ]);
    }
    return normalizeOrthogonalPoints([
        src,
        { x: midX, y: src.y },
        { x: midX, y: tgt.y },
        tgt,
    ]);
}
