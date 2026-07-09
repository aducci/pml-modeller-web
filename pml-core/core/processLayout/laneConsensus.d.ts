import { LayoutEdge, LayoutNode, Lane, LayoutSettings } from './layoutTypes';
export interface LaneDecision {
    nodeId: string;
    assignedLaneId: string;
    reason: 'actor' | 'consensus' | 'default';
    confidence: number;
    voteCounts: Record<string, number>;
    bidirectionalConflict?: boolean;
}
export interface LaneConsensusResult {
    assignments: Map<string, string>;
    decisions: LaneDecision[];
}
export interface DecisionLaneAffinityRecommendation {
    nodeId: string;
    currentLaneId: string;
    suggestedLaneId: string;
    dominantOutgoingRatio: number;
    outgoingEdgeCount: number;
    voteCounts: Record<string, number>;
}
/**
 * Propagate lane assignments using predecessor votes (forward pass) optionally
 * blended with successor votes (backward pass) when successorWeight > 0.
 *
 * successorWeight = 0  → pure predecessor behaviour (original)
 * successorWeight = 0.5 → balanced (default)
 */
export declare function propagateLaneConsensus(nodes: LayoutNode[], edges: LayoutEdge[], lanes: Lane[], successorWeight?: number, fallbackLaneId?: string): LaneConsensusResult;
export declare function analyzeDecisionLaneAffinity(nodes: LayoutNode[], edges: LayoutEdge[], settings: LayoutSettings['routing']['decisionLaneAffinity']): DecisionLaneAffinityRecommendation[];
//# sourceMappingURL=laneConsensus.d.ts.map