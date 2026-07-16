import type { LayoutEdge } from '../processLayout/layoutTypes';
import type { EdgeLabelSide, EdgeLabelPositioning } from '../styling/styleSchema';
export type { EdgeLabelAnchor, EdgeLabelSide, EdgeLabelPlacement, EdgeLabelPositioning } from '../styling/styleSchema';
interface ResolvedEdgeLabelPosition {
    x: number;
    y: number;
    side: EdgeLabelSide;
    /**
     * True when this routing type has an explicit, non-zero nudgeX/nudgeY —
     * a deliberate manual correction. Callers use this to skip the automatic
     * label-overlap-avoidance pass (labelController.ts's nudgeEdgeLabel), which
     * otherwise silently fights a manual nudge with its own discrete escape
     * jumps (±12/14px) the moment the nudged box grazes another label.
     */
    hasManualNudge: boolean;
}
export declare function resolveEdgeLabelPosition(edge: LayoutEdge, positioning: EdgeLabelPositioning, padding: number): ResolvedEdgeLabelPosition | null;
//# sourceMappingURL=edgeLabelPositioning.d.ts.map