import { LayoutEdge } from './layoutTypes';
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
export declare function runConvergenceLoop(edges: LayoutEdge[], maxPasses?: number): ConvergenceSummary;
//# sourceMappingURL=convergenceLoop.d.ts.map