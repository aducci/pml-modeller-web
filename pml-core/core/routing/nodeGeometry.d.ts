/**
 * Node Geometry
 *
 * Calculates node bounds (shape only, text separate). geometryRealizer.ts
 * only reads .bounds off the result — connection-point and routing-preference
 * computation (getConnectionPointsForType, getRoutingPreferencesForType) was
 * removed as unused output; nothing in the repo read connectionPoints,
 * exitPreference, or entryPreference.
 */
import { LayoutNode } from '../processLayout/layoutTypes';
interface NodeGeometry {
    id: string;
    type: string;
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
/**
 * Calculates the shape bounds for a node. Text is excluded from shape
 * bounds for clean separation.
 */
export declare function calculateNodeGeometry(node: LayoutNode): NodeGeometry;
export {};
//# sourceMappingURL=nodeGeometry.d.ts.map