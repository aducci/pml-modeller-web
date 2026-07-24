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
    /**
     * Color for the small secondary caption under a node's label (e.g. its
     * type). Previously not themeable at all — labelController.ts hardcoded
     * this to `stroke` (the border color), so editing Border visibly
     * recolored this text too. Defaults to `label`'s value when unset (see
     * defaultProcessTheme.ts) rather than reusing `stroke`, so changing
     * Border never again silently affects text.
     */
    secondaryLabel?: string;
    /**
     * Color of the text-stroke halo painted behind the primary label (see
     * ProcessCanvas.tsx's `paintOrder: 'stroke'` technique) — keeps a label
     * legible when it sits outside/over the shape's own edge (common for
     * decision/gateway labels, which can render outside the diamond).
     * Previously hardcoded to reuse `fill` directly, so changing a node's
     * Fill also silently changed this halo. Defaults to `fill`'s value when
     * unset (see defaultProcessTheme.ts) so nothing changes visually until
     * explicitly overridden — fully independent from Fill from then on.
     */
    labelHalo?: string;
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
    /**
     * Stroke/fill for the open (hollow-triangle) arrowhead used on
     * semanticRole=messageFlow edges — BPMN convention distinguishes message
     * flow with an unfilled arrowhead, distinct from sequence flow's solid
     * filled one. Falls back to `stroke ?? fill` if unset (see
     * defaultProcessTheme.ts), so this is optional rather than required.
     */
    openStroke?: string;
}
export interface HaloStyle {
    color: string;
    width: number;
}
export interface EdgeStyle {
    default: EdgeVisual;
    crossLane: EdgeVisual;
    loopback: EdgeVisual;
    /**
     * Visual for semanticRole=messageFlow edges — a genuine semantic edge
     * kind (cross-actor communication), not a geometry-driven style like
     * crossLane (chosen by whether the routed path happens to cross a lane
     * boundary) or loopback (chosen by edge.loop). Rendered dashed with an
     * open arrowhead by default, matching BPMN's message-flow convention.
     */
    message: EdgeVisual;
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
export interface ProcessNodeEffects {
    /** Drop shadow behind every node shape (the feDropShadow filter already used for depth). */
    shadow: boolean;
    /** Subtle top-to-bottom gradient (derived from each shape's own fill) instead of a flat fill. */
    gradient: boolean;
    /**
     * The text-stroke halo behind every node's primary label (see
     * appearance.labelHalo and ProcessCanvas.tsx's paintOrder: 'stroke'
     * rendering) — a global on/off, matching shadow/gradient above. Off means
     * plain text with no legibility backing; mainly useful if a label's halo
     * color ever looks wrong against a particular background rather than
     * tuning every element type's labelHalo color individually.
     */
    labelHalo: boolean;
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
    nodeEffects: ProcessNodeEffects;
    lanes: LaneStyle;
    curtains: {
        inbound: CurtainStyle;
        outbound: CurtainStyle;
    };
    /**
     * Small per-node status dot (node.metadata.status: approved/pending/
     * rejected) and the task-type marker glyph color — previously both
     * hardcoded literals with no schema field and no admin UI control at all.
     * Not per-element-type (a status dot can appear on any node kind), so
     * these live here rather than in elementStyles — edited in the Advanced
     * Style tab alongside other non-per-element settings.
     */
    statusIndicators: {
        approved: string;
        pending: string;
        rejected: string;
        /** Fallback for any other/unknown status value. */
        default: string;
    };
    /** Color of the small task-type marker glyph (e.g. the service/user/script icon). */
    taskTypeMarkerColor: string;
}
/**
 * Resolves the style for a node type.
 * `decision` and `route` both map to the unified `gateway` token.
 */
export declare function getElementStyle(theme: ProcessThemeSchema, nodeType: string): ProcessElementStyleSchema;
//# sourceMappingURL=styleSchema.d.ts.map