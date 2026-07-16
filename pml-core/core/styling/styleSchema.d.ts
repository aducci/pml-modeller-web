/**
 * Process model styling schema contracts.
 *
 * This module defines declarative styling and info-policy types that sit on top
 * of the canonical DSL-derived model.
 */
import { NormalizedNode } from '../normalizedGraph';
import type { RoutingTypeCode } from '../routing/routingRuleDefinition';
export type ProcessElementType = NormalizedNode['type'];
export type StyleShapeKind = 'circle' | 'diamond' | 'rounded-rect' | 'rect' | 'pill' | 'custom';
export type LabelPlacement = 'inside' | 'outside-top' | 'outside-bottom' | 'auto';
export type InfoPlacement = 'inside' | 'bottom-inside' | 'below' | 'badge' | 'hidden';
export type TextWrapMode = 'clamp' | 'wrap' | 'truncate';
export interface ProcessTextStyle {
    fontSizePx: number;
    weight: number;
    maxLines?: number;
    wrap?: TextWrapMode;
    uppercase?: boolean;
    tracking?: 'normal' | 'wide' | 'wider';
    opacity?: number;
    ellipsis?: string;
}
export interface ProcessElementAppearance {
    fill: string;
    stroke: string;
    label: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    cornerRadiusPx?: number;
}
export interface ProcessElementInfoPolicy {
    primaryField: string;
    secondaryFields?: string[];
    placement: InfoPlacement;
    secondaryStyle?: ProcessTextStyle;
}
export interface ProcessElementInteractionStyle {
    selectedStroke?: string;
    selectedStrokeWidth?: number;
}
export interface ProcessElementStyleSchema {
    shape: StyleShapeKind;
    appearance: ProcessElementAppearance;
    text: ProcessTextStyle;
    labelPlacement: LabelPlacement;
    infoPolicy: ProcessElementInfoPolicy;
    interaction?: ProcessElementInteractionStyle;
}
export interface LaneStyle {
    bodyFill: string;
    headerFill: string;
    borderColor: string;
    borderWidth: number;
    selectedBorderColor: string;
    selectedBorderWidth: number;
    headerSelectedColor: string;
    labelColor: string;
    /** Lane corner radius. 0 = sharp corners. */
    cornerRadiusPx?: number;
    /** Header font weight. */
    headerFontWeight?: number;
    /** Header text opacity. */
    headerLabelOpacity?: number;
}
export interface CurtainStyle {
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    labelColor: string;
}
export interface EdgeVisual {
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
}
export interface EdgeMarker {
    fill: string;
    stroke?: string;
}
export interface HaloStyle {
    color: string;
    width: number;
}
export interface EdgeStyle {
    default: EdgeVisual;
    crossLane: EdgeVisual;
    loopback: EdgeVisual;
    selected: EdgeVisual;
    halo: {
        default: HaloStyle;
        selected: HaloStyle;
    };
    marker: EdgeMarker;
    label: {
        fill: string;
        background: string;
        border: string;
        fontSize: number;
        fontWeight: number;
        haloColor?: string;
        haloWidth: number;
        charWidthPx: number;
        paddingX: number;
        minWidth: number;
        maxWidth: number;
    };
}
export type EdgeLabelAnchor = 'start' | 'mid' | 'end' | 'elbow-1' | 'elbow-2' | 'elbow-3';
/**
 * Which axis this routing type's label offset mirrors per edge instance.
 * 'vertical' flips the offset's y sign (above/below) — used by the
 * horizontal-bend routing types, where a gateway's up-branch and
 * down-branch need to land on opposite sides without knowing about each
 * other. 'horizontal' flips x (left/right) — used by the vertical-bend
 * types. 'none' skips mirroring; the offset is a fixed vector for every
 * edge of that type. See edgeLabelPositioning.ts's applyMirror().
 */
export type EdgeLabelMirrorAxis = 'none' | 'vertical' | 'horizontal';
export interface EdgeLabelPlacement {
    /** Which point on the routed path the offset is measured from. */
    anchor: EdgeLabelAnchor;
    /** Raw pixel offset from the anchor point (+x = right, +y = down). The only placement mechanism — always linear, always both axes. */
    offset: {
        x: number;
        y: number;
    };
    mirrorAxis: EdgeLabelMirrorAxis;
}
export interface EdgeLabelPositioning {
    defaults: EdgeLabelPlacement;
    perType: Partial<Record<RoutingTypeCode, EdgeLabelPlacement>>;
}
export interface ProcessThemeTypography {
    laneHeader: ProcessTextStyle;
    curtainLabel: ProcessTextStyle;
    edgeLabel: ProcessTextStyle;
    nodeLabel: ProcessTextStyle;
}
export interface ProcessThemeCanvasTokens {
    laneHeaderHeight: number;
    baseCurtainWidth: number;
    curtainPadding: number;
    visualBoundsPadding: number;
    labelContainerWidth: number;
}
/**
 * `decision` and `route` node types both resolve to the `gateway` style token.
 * Use getElementStyle() — it handles the mapping automatically.
 */
export interface ProcessThemeSchema {
    id: string;
    name: string;
    description?: string;
    elementStyles: Record<ProcessElementType | 'unknown' | 'gateway', ProcessElementStyleSchema>;
    /**
     * @deprecated Use `edges` instead. Kept for one release cycle; must not be
     * read by renderer code.
     */
    edgeStyle?: {
        loopbackMain: string;
        loopbackSecondary: string;
        up: string;
        down: string;
        default: string;
        baseWidth: number;
    };
    edges: EdgeStyle;
    edgeLabelPositions: EdgeLabelPositioning;
    typography: ProcessThemeTypography;
    canvasTokens: ProcessThemeCanvasTokens;
    lanes: LaneStyle;
    curtains: {
        inbound: CurtainStyle;
        outbound: CurtainStyle;
    };
}
/**
 * Resolves the style for a node type.
 * `decision` and `route` both map to the unified `gateway` token.
 */
export declare function getElementStyle(theme: ProcessThemeSchema, nodeType: string): ProcessElementStyleSchema;
//# sourceMappingURL=styleSchema.d.ts.map