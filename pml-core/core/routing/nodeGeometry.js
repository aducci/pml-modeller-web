/**
 * Node Geometry
 *
 * Calculates node bounds (shape only, text separate). geometryRealizer.ts
 * only reads .bounds off the result — connection-point and routing-preference
 * computation (getConnectionPointsForType, getRoutingPreferencesForType) was
 * removed as unused output; nothing in the repo read connectionPoints,
 * exitPreference, or entryPreference.
 */
import { nodeRect } from '../layoutGeometry';
/**
 * Calculates the shape bounds for a node. Text is excluded from shape
 * bounds for clean separation.
 */
export function calculateNodeGeometry(node) {
    if (node.x === undefined || node.y === undefined) {
        throw new Error(`Node ${node.id} has no position (x, y).`);
    }
    return {
        id: node.id,
        type: node.type,
        bounds: nodeRect(node),
    };
}
