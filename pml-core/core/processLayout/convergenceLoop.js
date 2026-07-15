function angleBetween(a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x);
}
function normalizeAngle(angle) {
    while (angle > Math.PI)
        angle -= Math.PI * 2;
    while (angle < -Math.PI)
        angle += Math.PI * 2;
    return Math.abs(angle);
}
export function segmentIntersection(a1, a2, b1, b2) {
    const det = (p, q, r) => {
        return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    };
    const d1 = det(a1, a2, b1);
    const d2 = det(a1, a2, b2);
    const d3 = det(b1, b2, a1);
    const d4 = det(b1, b2, a2);
    return d1 * d2 < 0 && d3 * d4 < 0;
}
function buildRoutedSegments(edges) {
    const segments = [];
    for (const edge of edges) {
        const points = edge.routing?.waypoints || [];
        for (let i = 1; i < points.length; i++) {
            segments.push({ edgeId: edge.id, source: edge.source, target: edge.target, a: points[i - 1], b: points[i] });
        }
    }
    return segments;
}
/**
 * Shared O(n²) segment-pair scan used by both convergence-loop crossing
 * counting (below) and layoutDefects.ts's defect scoring — each caller
 * supplies its own pair-skip rule (same edge vs. shares an endpoint) since
 * the two consumers need different subsets, not the same crossing
 * definition. Only the scan/loop itself is shared.
 */
export function forEachSegmentCrossing(edges, shouldSkipPair, onCrossing) {
    const segments = buildRoutedSegments(edges);
    for (let i = 0; i < segments.length; i++) {
        for (let j = i + 1; j < segments.length; j++) {
            const s1 = segments[i];
            const s2 = segments[j];
            if (shouldSkipPair(s1, s2))
                continue;
            if (segmentIntersection(s1.a, s1.b, s2.a, s2.b)) {
                onCrossing(s1, s2);
            }
        }
    }
}
function computeElbowMetrics(edges) {
    let totalElbows = 0;
    let degenerateElbows = 0;
    for (const edge of edges) {
        const points = edge.routing?.waypoints || [];
        if (points.length < 3) {
            continue;
        }
        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1];
            const inAngle = angleBetween(prev, curr);
            const outAngle = angleBetween(curr, next);
            const turn = normalizeAngle(outAngle - inAngle);
            if (turn < 0.001) {
                continue;
            }
            totalElbows += 1;
            if (turn < 0.2) {
                degenerateElbows += 1;
            }
        }
    }
    return { total: totalElbows, degenerate: degenerateElbows };
}
function computeCrossings(edges) {
    let crossings = 0;
    forEachSegmentCrossing(edges, (a, b) => a.edgeId === b.edgeId, () => { crossings += 1; });
    return crossings;
}
export function runConvergenceLoop(edges, maxPasses = 5) {
    const passes = [];
    let converged = false;
    for (let iteration = 0; iteration < maxPasses; iteration++) {
        const elbows = computeElbowMetrics(edges);
        const crossings = computeCrossings(edges);
        const straightnessScore = edges.length === 0
            ? 1
            : Math.max(0, (edges.length - elbows.total) / edges.length);
        const metrics = {
            iteration,
            totalElbows: elbows.total,
            degenerateElbows: elbows.degenerate,
            edgeCrossings: crossings,
            straightnessScore,
        };
        const previous = passes[passes.length - 1];
        if (previous) {
            metrics.deltaElbows = metrics.totalElbows - previous.totalElbows;
            metrics.deltaCrossings = metrics.edgeCrossings - previous.edgeCrossings;
            metrics.deltaStraightness = metrics.straightnessScore - previous.straightnessScore;
        }
        passes.push(metrics);
        // Current pass only analyzes. Convergence here means no degenerate elbows left.
        if (elbows.degenerate === 0) {
            converged = true;
            break;
        }
    }
    return { passes, converged };
}
