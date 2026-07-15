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
export declare function computeRanking(graph: NormalizedProcessGraph, groupingStrategy: GroupingStrategy): RankingResult;
//# sourceMappingURL=ranking.d.ts.map