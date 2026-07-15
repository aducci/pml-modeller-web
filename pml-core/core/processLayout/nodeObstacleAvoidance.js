// Stage: Node Obstacle Avoidance (Phase C helper, runs after edge routing)
// reads:  edges (routing.waypoints), nodes (x, y, width, height)
// writes: edges (routing.waypoints — interior waypoints only; port-anchored
//         first/last waypoints are never moved)
//
// A routed edge can end up sharing an x (or y) coordinate with an unrelated
// node purely by coincidence of column/row alignment — e.g. a cross-lane
// drop from a node directly above another node in the same column runs
// straight through that node's box on its way past. This is unambiguous
// (unlike near-miss "do these two edges look close" judgment calls): a line
// literally passing through a shape it doesn't connect to is always wrong.
// This stage checks each routed segment against every node it doesn't
// touch, and nudges the segment clear if it cuts through the node's body.
import { segmentIntersection } from './convergenceLoop';
import { nodeRect as nodeBoxRect, rectBounds } from '../layoutGeometry';
const MAX_ITERATIONS = 3;
const OBSTACLE_MARGIN_PX = 8;
function nodeRect(node, margin) {
    const bounds = rectBounds(nodeBoxRect(node));
    return {
        left: bounds.minX - margin,
        right: bounds.maxX + margin,
        top: bounds.minY - margin,
        bottom: bounds.maxY + margin,
    };
}
/** True if the (axis-aligned) segment passes through the interior of `rect`, not just grazes its boundary. */
function segmentCrossesRect(a, b, rect) {
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    if (maxX <= rect.left || minX >= rect.right || maxY <= rect.top || minY >= rect.bottom) {
        return false;
    }
    const isHorizontal = Math.abs(a.y - b.y) < 0.5;
    const isVertical = Math.abs(a.x - b.x) < 0.5;
    if (isVertical) {
        // Segment's x must actually fall strictly inside the rect's x-span.
        return a.x > rect.left && a.x < rect.right;
    }
    if (isHorizontal) {
        return a.y > rect.top && a.y < rect.bottom;
    }
    // Non-axis-aligned segments aren't produced by this pipeline; skip.
    return false;
}
function isInteriorVertex(index, pointCount) {
    return index > 0 && index < pointCount - 1;
}
/**
 * Nudges a segment clear of an obstacle without ever moving a port-anchored
 * point (index 0 or the last index):
 * - Both endpoints interior: shift their shared coordinate directly.
 * - One endpoint anchored, one interior: shift the interior endpoint, and
 *   splice in a single stub point next to the anchor so the segment
 *   touching the anchor stays orthogonal.
 * - Both endpoints anchored: leave both anchors exactly where they are and
 *   splice in two stub points that bow the middle of the segment out.
 */
function nudgeSegment(points, segIndex, offset) {
    const p1Index = segIndex - 1;
    const p2Index = segIndex;
    const p1 = points[p1Index];
    const p2 = points[p2Index];
    const horizontal = Math.abs(p1.y - p2.y) < 0.5;
    const vertical = Math.abs(p1.x - p2.x) < 0.5;
    if (!horizontal && !vertical) {
        return false;
    }
    const p1Interior = isInteriorVertex(p1Index, points.length);
    const p2Interior = isInteriorVertex(p2Index, points.length);
    if (p1Interior && p2Interior) {
        if (horizontal) {
            p1.y += offset;
            p2.y += offset;
        }
        else {
            p1.x += offset;
            p2.x += offset;
        }
        return true;
    }
    if (p1Interior && !p2Interior) {
        if (horizontal) {
            p1.y += offset;
            points.splice(p2Index, 0, { x: p2.x, y: p1.y });
        }
        else {
            p1.x += offset;
            points.splice(p2Index, 0, { x: p1.x, y: p2.y });
        }
        return true;
    }
    if (!p1Interior && p2Interior) {
        if (horizontal) {
            p2.y += offset;
            points.splice(p2Index, 0, { x: p1.x, y: p2.y });
        }
        else {
            p2.x += offset;
            points.splice(p2Index, 0, { x: p2.x, y: p1.y });
        }
        return true;
    }
    if (horizontal) {
        points.splice(p2Index, 0, { x: p1.x, y: p1.y + offset }, { x: p2.x, y: p2.y + offset });
    }
    else {
        points.splice(p2Index, 0, { x: p1.x + offset, y: p1.y }, { x: p2.x + offset, y: p2.y });
    }
    return true;
}
/** Two nudges leaving a zero-length stub is harmless, but clean it up anyway. */
function dedupeConsecutivePoints(points) {
    const result = [];
    for (const p of points) {
        const prev = result[result.length - 1];
        if (!prev || Math.abs(prev.x - p.x) > 0.5 || Math.abs(prev.y - p.y) > 0.5) {
            result.push(p);
        }
    }
    return result;
}
/**
 * True if a candidate segment, nudged by `offset`, would still overlap a
 * node other than the edge's own endpoints, or would newly cross another
 * edge (e.g. clearing a node by moving right, straight into an edge whose
 * corridor starts right where that node's box ends).
 */
function candidateStillBlocked(allEdges, nodes, edge, p1, p2, isVertical, offset) {
    const candidateP1 = isVertical ? { x: p1.x + offset, y: p1.y } : { x: p1.x, y: p1.y + offset };
    const candidateP2 = isVertical ? { x: p2.x + offset, y: p2.y } : { x: p2.x, y: p2.y + offset };
    for (const node of nodes) {
        if (node.id === edge.source || node.id === edge.target)
            continue;
        if (node.x === undefined || node.y === undefined)
            continue;
        if (segmentCrossesRect(candidateP1, candidateP2, nodeRect(node, OBSTACLE_MARGIN_PX))) {
            return true;
        }
    }
    for (const other of allEdges) {
        if (other.id === edge.id)
            continue;
        if (other.source === edge.source || other.source === edge.target || other.target === edge.source || other.target === edge.target)
            continue;
        const otherPoints = other.routing?.waypoints;
        if (!otherPoints)
            continue;
        for (let k = 1; k < otherPoints.length; k++) {
            if (segmentIntersection(candidateP1, candidateP2, otherPoints[k - 1], otherPoints[k])) {
                return true;
            }
        }
    }
    return false;
}
/**
 * Tries the heuristically-preferred direction first; if that would still
 * leave the segment blocked (by another node, or a newly-created edge
 * crossing), tries the opposite direction instead. Falls back to the
 * preferred direction if neither fully clears — the next iteration will
 * report it as unresolved rather than looping.
 */
function pickClearDirection(allEdges, nodes, edge, p1, p2, isVertical, clearance, preferred) {
    if (!candidateStillBlocked(allEdges, nodes, edge, p1, p2, isVertical, preferred * clearance)) {
        return preferred;
    }
    const opposite = preferred === 1 ? -1 : 1;
    if (!candidateStillBlocked(allEdges, nodes, edge, p1, p2, isVertical, opposite * clearance)) {
        return opposite;
    }
    return preferred;
}
export function resolveNodeObstacles(state) {
    let resolvedCount = 0;
    let unresolvedCount = 0;
    const touchedEdgeIds = new Set();
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        let foundAny = false;
        for (const edge of state.edges) {
            const points = edge.routing?.waypoints;
            if (!points || points.length < 2)
                continue;
            // Restart the segment scan after a splice, since it shifts indices —
            // simpler than tracking the offset, and each edge only has a handful
            // of segments so re-scanning from the top is cheap.
            let si = 1;
            while (si < points.length) {
                let obstacle;
                for (const node of state.nodes) {
                    if (node.id === edge.source || node.id === edge.target)
                        continue;
                    if (node.x === undefined || node.y === undefined)
                        continue;
                    if (segmentCrossesRect(points[si - 1], points[si], nodeRect(node, OBSTACLE_MARGIN_PX))) {
                        obstacle = node;
                        break;
                    }
                }
                if (!obstacle) {
                    si += 1;
                    continue;
                }
                foundAny = true;
                const p1 = points[si - 1];
                const p2 = points[si];
                const isVertical = Math.abs(p1.x - p2.x) < 0.5;
                const clearance = (isVertical ? obstacle.width : obstacle.height) / 2 + OBSTACLE_MARGIN_PX + 4;
                // Prefer whichever direction actually clears every node in one
                // shot — the naive "nearest side of this one obstacle" direction
                // can walk straight into a second obstacle that starts right where
                // the first one ends (e.g. a lane-mate node whose right edge lines
                // up with another edge's corridor, leaving no valid gap on that
                // side at all).
                const preferredDirection = isVertical
                    ? (p1.x >= (obstacle.x ?? 0) ? 1 : -1)
                    : (p1.y >= (obstacle.y ?? 0) ? 1 : -1);
                const direction = pickClearDirection(state.edges, state.nodes, edge, p1, p2, isVertical, clearance, preferredDirection);
                const offset = direction * clearance;
                const nudged = nudgeSegment(points, si, offset);
                if (nudged) {
                    resolvedCount += 1;
                    touchedEdgeIds.add(edge.id);
                    state.provenanceLog.push(`node-obstacle-resolved:${edge.id}:around=${obstacle.id}:pass=${iteration}:offsetPx=${offset.toFixed(1)}`);
                    si += 1;
                }
                else {
                    unresolvedCount += 1;
                    si += 1;
                }
            }
        }
        if (!foundAny)
            break;
    }
    for (const edge of state.edges) {
        if (touchedEdgeIds.has(edge.id) && edge.routing?.waypoints) {
            edge.routing.waypoints = dedupeConsecutivePoints(edge.routing.waypoints);
        }
    }
    if (unresolvedCount > 0) {
        state.diagnostics.warnings.push(`${unresolvedCount} edge/node overlap(s) could not be auto-resolved (no interior waypoint to nudge).`);
    }
    if (resolvedCount > 0) {
        state.provenanceLog.push(`NodeObstacleAvoidance: ${resolvedCount} edge/node overlap(s) nudged clear.`);
    }
}
