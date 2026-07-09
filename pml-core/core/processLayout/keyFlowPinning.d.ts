import { NormalizedProcessGraph } from '../normalizedGraph';
import { RankingResult } from './ranking';
export interface KeyFlowResult {
    keyFlowPath: string[];
    keyFlowNodes: Set<string>;
    joinDepths: Map<string, number>;
    score: number;
}
/**
 * Strategy interface for key-flow identification.
 * Swap implementations without touching the orchestrator.
 */
export interface KeyFlowStrategy {
    identify(graph: NormalizedProcessGraph, ranking: RankingResult): KeyFlowResult;
}
/**
 * LongestPathStrategy — default. Selects the longest DAG path by hop count.
 * Deterministic via lexical tie-breaking on node IDs.
 */
export declare const LongestPathStrategy: KeyFlowStrategy;
/**
 * AnnotationKeyFlowStrategy — respects explicit `key:` PML annotations.
 * Scores annotated edges with a 10× hop bonus, so the user's marked path
 * wins over a longer un-annotated path. Falls back to longest-path when
 * no key-flow edges are present (identical output to LongestPathStrategy).
 */
export declare const AnnotationKeyFlowStrategy: KeyFlowStrategy;
export declare function identifyKeyFlow(graph: NormalizedProcessGraph, ranking: RankingResult): KeyFlowResult;
export declare function pinKeyFlowJoinDepths(ranking: RankingResult, keyFlowPath: string[]): Map<string, number>;
//# sourceMappingURL=keyFlowPinning.d.ts.map