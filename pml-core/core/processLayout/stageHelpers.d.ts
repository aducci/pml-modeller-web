/**
 * Shared stage-boundary helpers for the layout pipeline.
 */
import { LayoutState, Lane } from './layoutTypes';
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
//# sourceMappingURL=stageHelpers.d.ts.map