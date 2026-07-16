/**
 * Layout Geometry Helpers
 *
 * Shared geometry primitives for distance calculation, overlap,
 * point-to-rect operations, and route-label placement.
 */
// ============================================================================
// RECT OPERATIONS
// ============================================================================
export function rectBounds(rect) {
    return {
        minX: rect.x,
        minY: rect.y,
        maxX: rect.x + rect.width,
        maxY: rect.y + rect.height,
    };
}
/** Inverse of rectBounds — convert an accumulator Bounds back to a Rect at a function boundary. */
export function boundsToRect(bounds) {
    return {
        x: bounds.minX,
        y: bounds.minY,
        width: bounds.maxX - bounds.minX,
        height: bounds.maxY - bounds.minY,
    };
}
/**
 * A node's box as a Rect. Use this instead of hand-assembling
 * `{x: node.x, y: node.y, width: node.width, height: node.height}` — that literal
 * assembly is what caused geometry helpers to get bypassed throughout routing/rendering,
 * AND it silently gets the box wrong: unlike Rect and Lane, LayoutNode.x/y is the node's
 * CENTER point, not its top-left corner (see coordinateAssignment.ts, where node.x is
 * assigned a column *center* x). nodeRect() does the center→top-left conversion so callers
 * never have to know or re-derive that convention. Nodes not yet positioned (x/y undefined,
 * pre-B-geometry) get an origin-anchored box.
 */
export function nodeRect(node) {
    return {
        x: (node.x ?? 0) - node.width / 2,
        y: (node.y ?? 0) - node.height / 2,
        width: node.width,
        height: node.height,
    };
}
/** A lane's box as a Rect. Lane.x/y is already top-left (unlike LayoutNode.x/y), so this is a direct copy. */
export function laneRect(lane) {
    return { x: lane.x, y: lane.y, width: lane.width, height: lane.height };
}
export function rectsOverlap(r1, r2) {
    const b1 = rectBounds(r1);
    const b2 = rectBounds(r2);
    return !(b1.maxX < b2.minX || b1.maxY < b2.minY || b2.maxX < b1.minX || b2.maxY < b1.minY);
}
export function rectIntersection(r1, r2) {
    const left = Math.max(r1.x, r2.x);
    const top = Math.max(r1.y, r2.y);
    const right = Math.min(r1.x + r1.width, r2.x + r2.width);
    const bottom = Math.min(r1.y + r1.height, r2.y + r2.height);
    if (left < right && top < bottom) {
        return { x: left, y: top, width: right - left, height: bottom - top };
    }
    return null;
}
export function rectMerge(r1, r2) {
    const minX = Math.min(r1.x, r2.x);
    const minY = Math.min(r1.y, r2.y);
    const maxX = Math.max(r1.x + r1.width, r2.x + r2.width);
    const maxY = Math.max(r1.y + r1.height, r2.y + r2.height);
    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}
export function rectCenter(rect) {
    return {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
    };
}
/** Midpoint of two points — use instead of inline `(a.x+b.x)/2, (a.y+b.y)/2`. */
export function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
/** Midpoint of two scalars — the single-axis form of midpoint(), for when you have two numbers, not two Points. */
export function avg(a, b) {
    return (a + b) / 2;
}
// ============================================================================
// POINT AND DISTANCE OPERATIONS
// ============================================================================
export function distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}
export function pointToRectDistance(point, rect) {
    const closestX = Math.max(rect.x, Math.min(point.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(point.y, rect.y + rect.height));
    return distance(point, { x: closestX, y: closestY });
}
export function pointInRect(point, rect) {
    return (point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height);
}
export function rectAnchors(rect) {
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    return {
        top: { x: cx, y: rect.y },
        bottom: { x: cx, y: rect.y + rect.height },
        left: { x: rect.x, y: cy },
        right: { x: rect.x + rect.width, y: cy },
        center: { x: cx, y: cy },
    };
}
export function getAnchorByPosition(anchors, position) {
    return anchors[position];
}
// ============================================================================
// MARGIN AND CLEARANCE
// ============================================================================
export function expandRect(rect, margin) {
    return {
        x: rect.x - margin,
        y: rect.y - margin,
        width: rect.width + 2 * margin,
        height: rect.height + 2 * margin,
    };
}
export function shrinkRect(rect, margin) {
    return expandRect(rect, -margin);
}
export function segmentLength(seg) {
    return distance(seg.start, seg.end);
}
export function pointToSegmentDistance(point, seg) {
    const dx = seg.end.x - seg.start.x;
    const dy = seg.end.y - seg.start.y;
    const len = segmentLength(seg);
    if (len === 0) {
        return distance(point, seg.start);
    }
    const t = Math.max(0, Math.min(1, ((point.x - seg.start.x) * dx + (point.y - seg.start.y) * dy) / (len * len)));
    const closest = {
        x: seg.start.x + t * dx,
        y: seg.start.y + t * dy,
    };
    return distance(point, closest);
}
// ============================================================================
// POLYLINE OPERATIONS
// ============================================================================
export function polylineLength(points) {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
        total += distance(points[i - 1], points[i]);
    }
    return total;
}
export function polylineBounds(points) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
}
/**
 * True when a routed polyline has no actual bend — either it's just the two
 * endpoints, or every waypoint happens to share the same x or y. A routing
 * algorithm can be selected for its ability to route around obstacles in the
 * general case (e.g. "h-first" for a decision's fan-out) while still
 * producing a bend-free result for a specific edge whose endpoints happen to
 * align; callers that classify or label a route by its resulting shape (not
 * by which algorithm ran) should check this instead of trusting the
 * algorithm's own label.
 */
export function isStraightPolyline(points) {
    if (points.length <= 2)
        return true;
    const allSameX = points.every((p) => Math.abs(p.x - points[0].x) < 0.5);
    const allSameY = points.every((p) => Math.abs(p.y - points[0].y) < 0.5);
    return allSameX || allSameY;
}
// ============================================================================
// SEGMENT INTERSECTION
// ============================================================================
/**
 * True when segment (a1→a2) and segment (b1→b2) properly cross.
 * Collinear/touching endpoints are treated as non-intersecting for routing purposes.
 */
export function segmentsIntersect(a1, a2, b1, b2) {
    const cross = (o, p, q) => (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);
    const d1 = cross(b1, b2, a1);
    const d2 = cross(b1, b2, a2);
    const d3 = cross(a1, a2, b1);
    const d4 = cross(a1, a2, b2);
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}
/** True when any segment of polyline a crosses any segment of polyline b. */
export function polylinesCross(a, b) {
    for (let i = 0; i < a.length - 1; i++) {
        for (let j = 0; j < b.length - 1; j++) {
            if (segmentsIntersect(a[i], a[i + 1], b[j], b[j + 1]))
                return true;
        }
    }
    return false;
}
/** Counts pairwise crossings across a set of polylines. */
export function countPolylineCrossings(polys) {
    let count = 0;
    for (let i = 0; i < polys.length - 1; i++) {
        for (let j = i + 1; j < polys.length; j++) {
            if (polylinesCross(polys[i], polys[j]))
                count++;
        }
    }
    return count;
}
// ============================================================================
// ELBOW ROUTING
// ============================================================================
export function elbowPath(start, end, elbowX, elbowY) {
    const ex = elbowX ?? (start.x + end.x) / 2;
    const ey = elbowY ?? start.y;
    return [start, { x: ex, y: start.y }, { x: ex, y: ey }, end];
}
export function vElbowPath(start, end, midX, midY) {
    const mx = midX ?? (start.x + end.x) / 2;
    const my = midY ?? (start.y + end.y) / 2;
    return [start, { x: mx, y: start.y }, { x: mx, y: my }, { x: end.x, y: my }, end];
}
// ============================================================================
// GEOMETRIC QUERIES
// ============================================================================
export function isPointAboveRect(point, rect) {
    return point.y < rect.y;
}
export function isPointBelowRect(point, rect) {
    return point.y > rect.y + rect.height;
}
export function isPointLeftOfRect(point, rect) {
    return point.x < rect.x;
}
export function isPointRightOfRect(point, rect) {
    return point.x > rect.x + rect.width;
}
export function rectAbove(r1, r2) {
    return r1.y + r1.height < r2.y;
}
export function rectBelow(r1, r2) {
    return r1.y > r2.y + r2.height;
}
export function rectLeftOf(r1, r2) {
    return r1.x + r1.width < r2.x;
}
export function rectRightOf(r1, r2) {
    return r1.x > r2.x + r2.width;
}
// ============================================================================
// RAIL RESOLUTION (INVISIBLE LANE OFFSET COMPUTATION)
// ============================================================================
/**
 * Converts a channel tier into a RailPosition with deterministic metadata.
 * Maps the numeric channel system to physical rail offsets:
 *   0 = PRIMARY (center rail)
 *   -1, -2, -3 = TOP_1, TOP_2, TOP_3 (escape rails above primary)
 *   +1, +2, +3 = BOTTOM_1, BOTTOM_2, BOTTOM_3 (escape rails below primary)
 */
export function resolveRailFromChannel(channel, railSpacingY = 20) {
    let tier;
    let offsetY;
    let density;
    let escapeToCorridor;
    if (channel === 0) {
        tier = 'PRIMARY';
        offsetY = 0;
        density = 0;
        escapeToCorridor = false;
    }
    else if (channel < 0) {
        const rank = Math.abs(channel);
        tier = `TOP_${rank}`;
        offsetY = -rank * railSpacingY;
        density = rank;
        escapeToCorridor = true;
    }
    else {
        const rank = channel;
        tier = `BOTTOM_${rank}`;
        offsetY = rank * railSpacingY;
        density = rank;
        escapeToCorridor = true;
    }
    return {
        tier,
        channel,
        offsetY,
        density,
        escapeToCorridor,
    };
}
/**
 * Builds a complete rail offset bundle for edge routing.
 * Given source and target channel tiers, returns waypoint adjustments
 * and escape mode information for loopback handling.
 */
export function buildRailOffset(sourceChannel, targetChannel, isLoopback, railSpacingY = 20) {
    const sourceRail = resolveRailFromChannel(sourceChannel, railSpacingY);
    const targetRail = resolveRailFromChannel(targetChannel, railSpacingY);
    let escapeMode = 'same-lane';
    if (isLoopback) {
        if (sourceChannel < 0 || targetChannel < 0) {
            escapeMode = 'top-corridor';
        }
        else if (sourceChannel > 0 || targetChannel > 0) {
            escapeMode = 'bottom-corridor';
        }
        else {
            escapeMode = 'cross-lane';
        }
    }
    return {
        sourceRail,
        targetRail,
        sourceOffsetY: sourceRail.offsetY,
        targetOffsetY: targetRail.offsetY,
        escapeMode,
    };
}
/**
 * Computes the deterministic rail tier for an edge based on scenario and channel.
 * Returns the recommended channel tier for routing with proper escape semantics.
 */
export function determineRailTier(isLoopback, isSameLane, currentChannel, laneCount) {
    // For loopback in same lane, preserve allocator-selected side.
    // If channel is unexpectedly zero, default to TOP_1.
    if (isLoopback && isSameLane) {
        return currentChannel === 0 ? -1 : currentChannel;
    }
    // For cross-lane loopback, use the prescribed channel or alternate escapeMode
    if (isLoopback && !isSameLane) {
        return currentChannel;
    }
    // For forward flows, use current channel (already assigned by allocator)
    return currentChannel;
}
