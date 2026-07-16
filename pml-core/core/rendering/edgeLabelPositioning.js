export function resolveEdgeLabelPosition(edge, positioning, padding) {
    const waypoints = edge.routing?.waypoints;
    if (!waypoints || waypoints.length === 0)
        return null;
    const routingType = (edge.routing?.routingType ?? 'AOT');
    const placement = positioning.perType[routingType] ?? positioning.defaults;
    const { point: anchorPoint, index: anchorIndex } = getAnchorPoint(waypoints, placement.anchor);
    const side = placement.side === 'auto'
        ? resolveAutoSide(waypoints, anchorIndex)
        : placement.side;
    const shifted = offsetFromPoint(anchorPoint, side, placement.offsetPx);
    return {
        x: padding + shifted.x + (placement.nudgeX ?? 0),
        y: padding + shifted.y + (placement.nudgeY ?? 0),
        side,
        hasManualNudge: Boolean(placement.nudgeX || placement.nudgeY),
    };
}
function getAnchorPoint(waypoints, anchor) {
    if (waypoints.length === 0)
        return { point: { x: 0, y: 0 }, index: 0 };
    switch (anchor) {
        case 'start':
            return { point: { ...waypoints[0] }, index: 0 };
        case 'end':
            return { point: { ...waypoints[waypoints.length - 1] }, index: waypoints.length - 1 };
        case 'mid': {
            const idx = Math.floor(waypoints.length / 2);
            return { point: { ...waypoints[idx] }, index: idx };
        }
        case 'elbow-1':
        case 'elbow-2':
        case 'elbow-3': {
            const elbowNum = parseInt(anchor.split('-')[1], 10);
            const elbows = findElbows(waypoints);
            if (elbowNum <= elbows.length) {
                const elbow = elbows[elbowNum - 1];
                return { point: { ...elbow.point }, index: elbow.index };
            }
            const fallback = Math.min(Math.floor(waypoints.length / 2), waypoints.length - 1);
            return { point: { ...waypoints[fallback] }, index: fallback };
        }
        default:
            return { point: { ...waypoints[0] }, index: 0 };
    }
}
/**
 * Picks 'above'/'below' or 'left'/'right' from the anchor's own local
 * geometry, instead of a routing-type-wide fixed side. Two branches leaving
 * the same gateway on opposite trajectories (one curving up, one curving
 * down) get their own direction from their own waypoints, so they naturally
 * mirror onto opposite sides of their respective lines without needing to
 * know about each other.
 *
 * The anchor is a corner where one segment is horizontal-ish and the other
 * vertical-ish (that's what makes it an elbow at all). The *incoming*
 * segment decides which axis the label sits beside — if you're approaching
 * the corner horizontally, the label reads naturally offset vertically
 * (above/below that horizontal run), and vice versa. The *outgoing*
 * segment's direction decides which side of that axis: a corner about to
 * turn upward puts the label above (on the outside of the turn); a corner
 * about to turn downward mirrors it below.
 */
function resolveAutoSide(waypoints, anchorIndex) {
    const prev = waypoints[Math.max(0, anchorIndex - 1)];
    const curr = waypoints[anchorIndex];
    const next = waypoints[Math.min(waypoints.length - 1, anchorIndex + 1)];
    const inDx = curr.x - prev.x;
    const inDy = curr.y - prev.y;
    const outDx = next.x - curr.x;
    const outDy = next.y - curr.y;
    const incomingHorizontal = Math.abs(inDx) >= Math.abs(inDy);
    if (incomingHorizontal) {
        if (Math.abs(outDy) < 0.5)
            return 'above';
        return outDy < 0 ? 'above' : 'below';
    }
    if (Math.abs(outDx) < 0.5)
        return 'right';
    return outDx < 0 ? 'left' : 'right';
}
function findElbows(waypoints) {
    const elbows = [];
    for (let i = 1; i < waypoints.length - 1; i++) {
        const prev = waypoints[i - 1];
        const curr = waypoints[i];
        const next = waypoints[i + 1];
        if (isDirectionChange(prev, curr, next)) {
            elbows.push({ point: { ...curr }, index: i });
        }
    }
    return elbows;
}
function isDirectionChange(a, b, c) {
    const dxIn = b.x - a.x;
    const dyIn = b.y - a.y;
    const dxOut = c.x - b.x;
    const dyOut = c.y - b.y;
    const inMag = Math.sqrt(dxIn * dxIn + dyIn * dyIn);
    const outMag = Math.sqrt(dxOut * dxOut + dyOut * dyOut);
    if (inMag < 0.5 || outMag < 0.5)
        return false;
    const cross = (dxIn / inMag) * (dyOut / outMag) - (dyIn / inMag) * (dxOut / outMag);
    return Math.abs(cross) > 0.15;
}
function offsetFromPoint(point, side, offsetPx) {
    switch (side) {
        case 'above':
            return { x: point.x, y: point.y - offsetPx };
        case 'below':
            return { x: point.x, y: point.y + offsetPx };
        case 'left':
            return { x: point.x - offsetPx, y: point.y };
        case 'right':
            return { x: point.x + offsetPx, y: point.y };
        case 'center':
        default:
            return { x: point.x, y: point.y };
    }
}
