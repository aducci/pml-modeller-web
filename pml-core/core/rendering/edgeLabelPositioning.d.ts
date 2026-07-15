import type { LayoutEdge } from '../processLayout/layoutTypes';
import type { EdgeLabelSide, EdgeLabelPositioning } from '../styling/styleSchema';
export type { EdgeLabelAnchor, EdgeLabelSide, EdgeLabelPlacement, EdgeLabelPositioning } from '../styling/styleSchema';
interface ResolvedEdgeLabelPosition {
    x: number;
    y: number;
    side: EdgeLabelSide;
}
export declare function resolveEdgeLabelPosition(edge: LayoutEdge, positioning: EdgeLabelPositioning, padding: number): ResolvedEdgeLabelPosition | null;
//# sourceMappingURL=edgeLabelPositioning.d.ts.map