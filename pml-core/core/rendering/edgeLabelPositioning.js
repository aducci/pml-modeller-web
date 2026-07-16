export function resolveEdgeLabelPosition(edge, positioning, padding) {
    const waypoints = edge.routing?.waypoints;
    if (!waypoints || waypoints.length === 0)
        return null;
    const routingType = (edge.routing?.routingType ?? 'AOT');
    const placement = positioning.perType[routingType] ?? positioning.defaults;
    const { point: anchorPoint, index: anchorIndex } = getAnchorPoint(waypoints, placement.anchor);
    const offset = applyMirror(placement.offset, placement.mirrorAxis, waypoints, anchorIndex);
    return {
        x: padding + anchorPoint.x + offset.x,
        y: padding + anchorPoint.y + offset.y,
        avoidOverlap: placement.avoidOverlap,
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
 * Flips the placement's baseline offset per edge instance so two branches
 * leaving the same gateway on opposite trajectories (one curving up, one
 * curving down) land mirrored on opposite sides of their own lines, without
 * either edge needing to know about the other.
 *
 * `mirrorAxis` (declared once, per routing type, in the theme) says WHICH
 * axis this routing type's labels mirror on — 'vertical' for the
 * horizontal-bend types (above/below), 'horizontal' for the vertical-bend
 * types (left/right). Only the SIGN is resolved dynamically here, from the
 * anchor's own outgoing segment direction; a corner about to turn toward
 * the offset's baseline direction keeps it, one turning the other way
 * flips it. 'none' skips this entirely — the offset is used as-is.
 */
function applyMirror(offset, axis, waypoints, anchorIndex) {
    if (axis === 'none')
        return offset;
    const curr = waypoints[anchorIndex];
    const next = waypoints[Math.min(waypoints.length - 1, anchorIndex + 1)];
    if (axis === 'vertical') {
        const outDy = next.y - curr.y;
        return { x: offset.x, y: outDy > 0 ? -offset.y : offset.y };
    }
    const outDx = next.x - curr.x;
    return { x: outDx < 0 ? -offset.x : offset.x, y: offset.y };
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
