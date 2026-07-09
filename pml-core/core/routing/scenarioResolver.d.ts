import { FlowLayer, SemanticRole } from '../normalizedGraph';
import { PatternDefinition } from './patternDefinition';
import { PortAssignmentRule } from '../processLayout/layoutTypes';
/**
 * Scenario Resolver — Single controller for Layer A classification.
 *
 * Resolves: scenario key (all 11, kebab-case per spec Section 25.1),
 * flow layer, semantic role, applied policies, and CrossLaneAlignmentContext.
 *
 * IP-1: Full 11-scenario registry, boundary detection, decision-split detection,
 *        fan-in detection, same-lane-straight vs elbow discrimination.
 */
import { LayoutNode, LayoutEdge, Lane, CrossLaneAlignmentContext, RouteIntent } from '../processLayout/layoutTypes';
export interface EdgeNeighborhoodContext {
    sourceOutDegree: number;
    targetInDegree: number;
    sourceOutgoingTargetLaneIds?: string[];
}
/** Routing implications of the edge's flow layer — consumed by portResolver and worldEvaluator. */
export interface FlowLayerBias {
    /** Alternate flows prefer outer corridors — not the primary spine channel. */
    preferOuterCorridors: boolean;
    /** Alternate flows must not use `locked` port hardness (except boundary scenarios). */
    downgradeLockedPorts: boolean;
    /** Message flows are biased toward cross-lane geometry modes. */
    preferCrossLaneMode: boolean;
    /** Annotation flows skip pattern heuristics entirely. */
    skipPatternHeuristics: boolean;
}
export interface ScenarioResolution {
    scenarioKey: string;
    isLoopback: boolean;
    isSameLane: boolean;
    laneDirection: 'same' | 'downward' | 'upward';
    flowLayer: FlowLayer;
    semanticRole: SemanticRole;
    routeIntent: RouteIntent;
    flowLayerBias: FlowLayerBias;
    appliedPolicies: string[];
    crossLaneContext?: CrossLaneAlignmentContext;
    /** Flow rule from the matched PatternDefinition (present when patternTable was used). */
    matchedFlow?: PortAssignmentRule;
}
export declare function resolveScenario(source: LayoutNode, target: LayoutNode, edge: LayoutEdge, laneMap: Map<string, Lane>, neighborhood?: EdgeNeighborhoodContext, patternTable?: PatternDefinition[]): ScenarioResolution;
//# sourceMappingURL=scenarioResolver.d.ts.map