// Shared defect-counting used by both the post-routing conflict-resolution
// controller (postRoutingConflictResolution.ts) and the lane-relocation
// search (layoutAutoArrange.ts), so "how bad is this layout" means exactly
// the same thing in both places: the number of true edge-vs-edge crossings
// plus the number of edge segments that cut through a node they don't
// connect to.
import { segmentIntersection } from './convergenceLoop';
function nodeOverlapsSegment(node, a, b) {
    if (node.x === undefined || node.y === undefined)
        return false;
    const left = node.x - node.width / 2;
    const right = node.x + node.width / 2;
    const top = node.y - node.height / 2;
    const bottom = node.y + node.height / 2;
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    return maxX > left && minX < right && maxY > top && minY < bottom;
}
export function countLayoutDefects(nodes, edges) {
    const nodeIds = new Set();
    let count = 0;
    const routed = edges.filter((e) => (e.routing?.waypoints?.length ?? 0) >= 2);
    for (let i = 0; i < routed.length; i++) {
        const a = routed[i];
        const aPoints = a.routing.waypoints;
        for (let j = i + 1; j < routed.length; j++) {
            const b = routed[j];
            if (a.source === b.source || a.source === b.target || a.target === b.source || a.target === b.target) {
                continue;
            }
            const bPoints = b.routing.waypoints;
            for (let si = 1; si < aPoints.length; si++) {
                for (let sj = 1; sj < bPoints.length; sj++) {
                    if (segmentIntersection(aPoints[si - 1], aPoints[si], bPoints[sj - 1], bPoints[sj])) {
                        count += 1;
                        nodeIds.add(a.source).add(a.target).add(b.source).add(b.target);
                    }
                }
            }
        }
    }
    for (const edge of routed) {
        const points = edge.routing.waypoints;
        for (let si = 1; si < points.length; si++) {
            for (const node of nodes) {
                if (node.id === edge.source || node.id === edge.target)
                    continue;
                if (nodeOverlapsSegment(node, points[si - 1], points[si])) {
                    count += 1;
                    nodeIds.add(edge.source).add(edge.target).add(node.id);
                }
            }
        }
    }
    return { count, nodeIds };
}
