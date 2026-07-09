export function resolveEdgeLabelPosition(edge, positioning, padding) {
    const waypoints = edge.routing?.waypoints;
    if (!waypoints || waypoints.length === 0)
        return null;
    const routingType = (edge.routing?.routingType ?? 'AOT');
    const placement = positioning.perType[routingType] ?? positioning.defaults;
    const anchorPoint = getAnchorPoint(waypoints, placement.anchor);
    const shifted = offsetFromPoint(anchorPoint, placement.side, placement.offsetPx);
    return {
        x: padding + shifted.x,
        y: padding + shifted.y,
        side: placement.side,
    };
}
function getAnchorPoint(waypoints, anchor) {
    if (waypoints.length === 0)
        return { x: 0, y: 0 };
    switch (anchor) {
        case 'start':
            return { ...waypoints[0] };
        case 'end':
            return { ...waypoints[waypoints.length - 1] };
        case 'mid': {
            const idx = Math.floor(waypoints.length / 2);
            return { ...waypoints[idx] };
        }
        case 'elbow-1':
        case 'elbow-2':
        case 'elbow-3': {
            const elbowNum = parseInt(anchor.split('-')[1], 10);
            const elbows = findElbows(waypoints);
            if (elbowNum <= elbows.length)
                return { ...elbows[elbowNum - 1] };
            const fallback = Math.min(Math.floor(waypoints.length / 2), waypoints.length - 1);
            return { ...waypoints[fallback] };
        }
        default:
            return { ...waypoints[0] };
    }
}
function findElbows(waypoints) {
    const elbows = [];
    for (let i = 1; i < waypoints.length - 1; i++) {
        const prev = waypoints[i - 1];
        const curr = waypoints[i];
        const next = waypoints[i + 1];
        if (isDirectionChange(prev, curr, next)) {
            elbows.push({ ...curr });
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
