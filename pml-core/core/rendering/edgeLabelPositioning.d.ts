import type { RoutingTypeCode } from '../routing/routingRuleDefinition';
import type { LayoutEdge } from '../processLayout/layoutTypes';
export type EdgeLabelAnchor = 'start' | 'mid' | 'end' | 'elbow-1' | 'elbow-2' | 'elbow-3';
export type EdgeLabelSide = 'above' | 'center' | 'below' | 'left' | 'right';
export interface EdgeLabelPlacement {
    anchor: EdgeLabelAnchor;
    side: EdgeLabelSide;
    offsetPx: number;
    secondaryAnchor: EdgeLabelAnchor;
    secondarySide: EdgeLabelSide;
    secondaryOffsetPx: number;
}
export interface EdgeLabelPositioning {
    defaults: EdgeLabelPlacement;
    perType: Partial<Record<RoutingTypeCode, EdgeLabelPlacement>>;
}
export interface ResolvedEdgeLabelPosition {
    x: number;
    y: number;
    side: EdgeLabelSide;
}
export declare function resolveEdgeLabelPosition(edge: LayoutEdge, positioning: EdgeLabelPositioning, padding: number): ResolvedEdgeLabelPosition | null;
//# sourceMappingURL=edgeLabelPositioning.d.ts.map