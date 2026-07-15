/**
 * Shared stage-boundary helpers for the layout pipeline.
 */
import { LayoutState, Lane, LayoutEdge } from './layoutTypes';
export declare function recordStage(state: LayoutState, stageName: string): void;
/** Push a value onto the array stored at map[key], initialising the array if absent. */
export declare function appendToMap<K, V>(map: Map<K, V[]>, key: K, value: V): void;
/** Return a stable sorted copy of an array, ordered by each element's `id`. */
export declare function stableSortById<T extends {
    id: string;
}>(arr: T[]): T[];
/**
 * Build a lane-index lookup: lane.id → position index (0 = topmost lane).
 * Lanes are ordered by ascending y coordinate.
 */
export declare function getLaneIndexMap(lanes: Lane[]): Map<string, number>;
/** Index an array of id-bearing items by their `id`. */
export declare function buildById<T extends {
    id: string;
}>(items: T[]): Map<string, T>;
/** Index edges by target (incoming) and by source (outgoing) in one pass. */
export declare function buildIncomingOutgoingMaps(edges: LayoutEdge[]): {
    incomingByTarget: Map<string, LayoutEdge[]>;
    outgoingBySource: Map<string, LayoutEdge[]>;
};
//# sourceMappingURL=stageHelpers.d.ts.map