import { NormalizedProcessGraph } from '../normalizedGraph';
import { GroupingStrategy } from './layoutTypes';
export interface BackEdge {
    from: string;
    to: string;
}
export interface RankingResult {
    ranks: Map<string, number>;
    topologicalOrder: string[];
    backEdges: BackEdge[];
    sources: string[];
    sinks: string[];
    unreachableNodes: string[];
}
export declare function detectBackEdges(graph: NormalizedProcessGraph): BackEdge[];
export declare function topologicalSort(graph: NormalizedProcessGraph, backEdges: BackEdge[]): string[];
export declare function longestPathRanking(graph: NormalizedProcessGraph, topologicalOrder: string[], backEdges: BackEdge[]): Map<string, number>;
export declare function computeRanking(graph: NormalizedProcessGraph, groupingStrategy: GroupingStrategy): RankingResult;
//# sourceMappingURL=ranking.d.ts.map