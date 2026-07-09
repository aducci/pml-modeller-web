/**
 * Shared stage-boundary helpers for the layout pipeline.
 */
export function recordStage(state, stageName) {
    state.stageName = stageName;
    state.stageHistory.push(stageName);
    state.diagnostics.currentStage = stageName;
    state.diagnostics.stageHistory = [...state.stageHistory];
    state.diagnostics.provenanceLog = [...state.provenanceLog];
}
/** Push a value onto the array stored at map[key], initialising the array if absent. */
export function appendToMap(map, key, value) {
    const arr = map.get(key) ?? [];
    arr.push(value);
    map.set(key, arr);
}
/** Return a stable sorted copy of an array, ordered by each element's `id`. */
export function stableSortById(arr) {
    return arr.slice().sort((a, b) => a.id.localeCompare(b.id));
}
/**
 * Build a lane-index lookup: lane.id → position index (0 = topmost lane).
 * Lanes are ordered by ascending y coordinate.
 */
export function getLaneIndexMap(lanes) {
    const indexMap = new Map();
    lanes
        .slice()
        .sort((a, b) => a.y - b.y)
        .forEach((lane, index) => indexMap.set(lane.id, index));
    return indexMap;
}
