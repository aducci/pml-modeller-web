/**
 * Node Geometry & Connection Points
 *
 * Calculates node bounds (shape only, text separate) and determines
 * discrete connection anchor points for each node type.
 *
 * Supports smart elbow pattern selection based on node types and
 * relative positions (vertical vs horizontal flow preference).
 */
import { LayoutNode } from '../processLayout/layoutTypes';
export interface NodeGeometry {
    id: string;
    type: string;
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    textBounds?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    connectionPoints: ConnectionPoint[];
    exitPreference: 'right' | 'bottom' | 'any';
    entryPreference: 'left' | 'top' | 'any';
}
export interface ConnectionPoint {
    id: string;
    x: number;
    y: number;
    side: 'top' | 'bottom' | 'left' | 'right';
    role: 'entry' | 'exit' | 'both';
}
/**
 * Calculates the shape bounds and connection points for a node.
 * Text is excluded from shape bounds for clean separation.
 */
export declare function calculateNodeGeometry(node: LayoutNode): NodeGeometry;
//# sourceMappingURL=nodeGeometry.d.ts.map