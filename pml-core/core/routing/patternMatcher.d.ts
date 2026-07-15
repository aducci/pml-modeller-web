/**
 * Pattern Matcher — evaluates DetectCriteria against a resolved edge context
 * and returns the first matching PatternDefinition (sorted by priority desc).
 *
 * This is the single function that owns the "which pattern fires?" decision.
 * All match logic lives here; callers just pass a MatchContext.
 */
import { PatternDefinition, DetectNodeType } from './patternDefinition';
import { LayoutNode, Lane } from '../processLayout/layoutTypes';
interface MatchContext {
    sourceIsBoundary: boolean;
    targetIsBoundary: boolean;
    sameLane: boolean;
    isLoopback: boolean;
    loopbackSide: 'top' | 'bottom';
    sourceNodeType: DetectNodeType;
    sourceOutDegree: number;
    targetInDegree: number;
    allTargetsInSourceLane: boolean;
    laneDirection: 'same' | 'upward' | 'downward';
    deltaYRatio: number;
}
interface PatternMatchResult {
    pattern: PatternDefinition;
    scenarioKey: string;
}
/** Build a MatchContext from layout nodes, lane map, and neighborhood data. */
export declare function buildMatchContext(source: LayoutNode, target: LayoutNode, laneMap: Map<string, Lane>, sourceOutDegree: number, targetInDegree: number, outgoingTargetLaneIds: string[]): MatchContext;
/** Evaluate a pattern table against a context; returns first matching pattern or null. */
export declare function matchPattern(table: PatternDefinition[], ctx: MatchContext): PatternMatchResult | null;
export {};
//# sourceMappingURL=patternMatcher.d.ts.map