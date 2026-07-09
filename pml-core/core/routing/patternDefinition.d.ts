/**
 * Pattern Definition — first-class routing pattern records.
 *
 * Each PatternDefinition encodes:
 *   detect  — declarative criteria evaluated against an edge's resolved context
 *   flow    — the PortAssignmentRule applied when this pattern matches
 *
 * The matcher evaluates patterns in descending priority order and returns
 * the first fully-matching record. Priority replaces the old cascade order.
 *
 * Adding a new pattern = adding one record to DEFAULT_PATTERN_TABLE.
 * Enabling/disabling = flipping `enabled` on that record.
 * Reordering = changing `priority` values.
 */
import { PortAssignmentRule } from '../processLayout/layoutTypes';
import type { NormalizedNode } from '../normalizedGraph';
export type DetectNodeType = NormalizedNode['type'] | 'unknown';
export interface DetectCriteria {
    /** Source node is a boundary-attached event (highest-priority gate). */
    sourceIsBoundary?: boolean;
    /** Target node is a boundary-attached event. */
    targetIsBoundary?: boolean;
    /** Source and target share the same swimlane. */
    sameLane?: boolean;
    /** Edge direction is a backward cycle (target depth < source depth). */
    isLoopback?: boolean;
    /**
     * Which side of the lane the loopback arc routes through.
     * Resolved spatially at match time; only meaningful when isLoopback=true.
     */
    loopbackSide?: 'top' | 'bottom';
    /** Source node types that must match (any of). */
    sourceNodeTypes?: DetectNodeType[];
    /** Minimum (exclusive) outgoing edge count from source. */
    sourceOutDegreeGt?: number;
    /** Minimum (exclusive) incoming edge count to target. */
    targetInDegreeGt?: number;
    /**
     * All outgoing edges from source go to the same lane as source.
     * Used to discriminate vertical vs horizontal decision splits.
     */
    allTargetsInSourceLane?: boolean;
    /** Cross-lane direction (only meaningful when sameLane=false). */
    laneDirection?: 'upward' | 'downward';
    /**
     * Ratio of vertical node offset to max node height, compared gt.
     * Used to discriminate same-lane-elbow from same-lane-straight.
     * e.g. { gt: 0.5 } matches when deltaY > 50% of max(srcH, tgtH).
     */
    deltaYRatioGt?: number;
}
export interface PatternDefinition {
    /** Unique stable key — becomes the scenarioKey threaded through the pipeline. */
    id: string;
    /** Human-readable name shown in admin UI. */
    label: string;
    /** Longer description of when and why this pattern fires. */
    description: string;
    /** Whether this pattern participates in matching. */
    enabled: boolean;
    /**
     * Match priority — higher wins. Evaluated in descending order; first match wins.
     * Reordering patterns = changing these numbers.
     */
    priority: number;
    /** Declarative detection criteria. All defined fields must pass. */
    detect: DetectCriteria;
    /** Routing flow parameters applied when this pattern matches. */
    flow: PortAssignmentRule;
}
export declare const DEFAULT_PATTERN_TABLE: PatternDefinition[];
//# sourceMappingURL=patternDefinition.d.ts.map