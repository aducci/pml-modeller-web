/**
 * World Evaluator — 4-domain scoring with deterministic candidate selection.
 *
 * Operates on already-routed edge bundles (post-channel-allocation).
 * For each bundle, generates alternative geometry-mode candidates for
 * cross-lane edges, scores all worlds in 4 domains (geometry → perceptual →
 * coherence → semantic-fit), and selects the winner via lexicographic ordering.
 *
 * Shared primitives used: countPolylineCrossings, polylinesCross (layoutGeometry).
 * No geometry or port logic is duplicated here — realizeWaypoints/portResolver
 * are imported for alternative candidate generation only.
 */
import { LayoutEdge, LayoutNode, Lane } from '../processLayout/layoutTypes';
import { EdgeBundle } from './bundleWindows';
export interface BundleEvaluationResult {
    windowId: string;
    selectedWorldId: string;
    updatedEdges: LayoutEdge[];
    evaluatedWorlds: number;
    candidateScores: Array<{
        candidateId: string;
        geometry: number;
        perceptual: number;
        coherence: number;
        semanticFit: number;
    }>;
}
/**
 * Detects edges whose routed paths are stacked on top of another edge's path
 * within the given pixel tolerance. Returns the ID of the *secondary* edge in
 * each stacked pair (the one that should be re-routed with a parallel-offset
 * alternate). The primary edge (lower array index) keeps its route unchanged.
 *
 * "Stacked" = two edges share a spine segment within tolerancePx on the same
 * axis for at least minOverlapPx of run length.
 */
export declare function detectStackedEdges(edges: LayoutEdge[], tolerancePx?: number, minOverlapPx?: number): Set<string>;
export declare function evaluateAndApplyBundlesWithResults(edges: LayoutEdge[], bundles: EdgeBundle[], nodeMap: Map<string, LayoutNode>, laneMap: Map<string, Lane>, backgroundWaypointsByEdgeId?: Map<string, {
    x: number;
    y: number;
}[]>): {
    updatedEdges: LayoutEdge[];
    bundleResults: BundleEvaluationResult[];
};
//# sourceMappingURL=worldEvaluator.d.ts.map