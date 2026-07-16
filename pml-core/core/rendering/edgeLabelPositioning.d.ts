import type { LayoutEdge } from '../processLayout/layoutTypes';
import type { EdgeLabelPositioning } from '../styling/styleSchema';
export type { EdgeLabelAnchor, EdgeLabelMirrorAxis, EdgeLabelPlacement, EdgeLabelPositioning } from '../styling/styleSchema';
interface ResolvedEdgeLabelPosition {
    x: number;
    y: number;
}
/**
 * Resolves an edge label's final position deterministically from anchor +
 * offset (+ mirror) alone. This is the label's ONLY placement mechanism —
 * there is no further automatic adjustment downstream (no collision
 * avoidance, no decluttering). Two edges of the same routing type, with the
 * same config, always land at the same offset from their own anchor point,
 * full stop — that determinism is the entire point of a per-routing-type
 * config, and is why edge labels deliberately don't participate in the
 * node-label overlap-avoidance pass (see labelController.ts).
 */
export declare function resolveEdgeLabelPosition(edge: LayoutEdge, positioning: EdgeLabelPositioning, padding: number): ResolvedEdgeLabelPosition | null;
//# sourceMappingURL=edgeLabelPositioning.d.ts.map