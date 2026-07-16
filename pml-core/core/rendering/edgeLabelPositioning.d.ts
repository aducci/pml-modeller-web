import type { LayoutEdge } from '../processLayout/layoutTypes';
import type { EdgeLabelPositioning } from '../styling/styleSchema';
export type { EdgeLabelAnchor, EdgeLabelMirrorAxis, EdgeLabelPlacement, EdgeLabelPositioning } from '../styling/styleSchema';
interface ResolvedEdgeLabelPosition {
    x: number;
    y: number;
    /** Straight passthrough of the placement's own flag — see EdgeLabelPlacement.avoidOverlap. */
    avoidOverlap: boolean;
}
export declare function resolveEdgeLabelPosition(edge: LayoutEdge, positioning: EdgeLabelPositioning, padding: number): ResolvedEdgeLabelPosition | null;
//# sourceMappingURL=edgeLabelPositioning.d.ts.map