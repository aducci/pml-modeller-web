import { LayoutEdge, Point } from './layoutTypes';
export interface ConvergencePassMetrics {
    iteration: number;
    totalElbows: number;
    degenerateElbows: number;
    edgeCrossings: number;
    straightnessScore: number;
    deltaElbows?: number;
    deltaCrossings?: number;
    deltaStraightness?: number;
}
export interface ConvergenceSummary {
    passes: ConvergencePassMetrics[];
    converged: boolean;
}
export declare function segmentIntersection(a1: Point, a2: Point, b1: Point, b2: Point): boolean;
export interface RoutedSegment {
    edgeId: string;
    source: string;
    target: string;
    a: Point;
    b: Point;
}
/**
 * Shared O(n²) segment-pair scan used by both convergence-loop crossing
 * counting (below) and layoutDefects.ts's defect scoring — each caller
 * supplies its own pair-skip rule (same edge vs. shares an endpoint) since
 * the two consumers need different subsets, not the same crossing
 * definition. Only the scan/loop itself is shared.
 */
export declare function forEachSegmentCrossing(edges: LayoutEdge[], shouldSkipPair: (a: RoutedSegment, b: RoutedSegment) => boolean, onCrossing: (a: RoutedSegment, b: RoutedSegment) => void): void;
export declare function runConvergenceLoop(edges: LayoutEdge[], maxPasses?: number): ConvergenceSummary;
//# sourceMappingURL=convergenceLoop.d.ts.map