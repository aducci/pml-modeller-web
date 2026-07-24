/**
 * NodeRenderModel — canonical render contract between layout engine and SVG output.
 *
 * The renderer consumes this exclusively. Nothing in ProcessCanvas reads
 * LayoutNode directly — it reads NodeRenderModel.
 *
 * Policy: All rendering decisions (colours, visibility, icon layout) are made
 * in buildNodeRenderModels(). ProcessCanvas is a pure renderer — no decision logic.
 *
 * Policy: Interaction state (isHovered, isSelected) is NOT in this model.
 * It is applied as CSS classes on the <g> element at render time, not as
 * fields in NodeRenderModel. This keeps the model stable across interaction
 * events and avoids triggering re-computation on hover/select.
 */
import type { LayoutNode, Rect } from '../processLayout/layoutTypes';
export type ShapeKind = 'circle' | 'diamond' | 'rounded-rect' | 'rect' | 'pill';
export interface ShapeDescriptor {
    kind: ShapeKind;
    fill: string;
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
    cornerRadius: number;
}
export interface ResolvedLabelLine {
    text: string;
    x: number;
    /** dy offset relative to label origin */
    dy: number;
}
export interface NodeLabelRenderModel {
    lines: ResolvedLabelLine[];
    x: number;
    y: number;
    fontSize: number;
    fontWeight: number;
    fill: string;
    /**
     * Color of the text-stroke halo painted behind the label (legibility aid
     * for labels sitting outside/over the shape's edge — see ProcessCanvas.tsx's
     * paintOrder: 'stroke' rendering). Previously the caller reused the
     * shape's own fill directly, so changing a node's Fill silently changed
     * this too. Independently themeable now via appearance.labelHalo.
     */
    haloFill: string;
    /** CSS letter-spacing value (e.g. '0.2px') — was computed for the
     *  secondary caption only; the primary label's own `text.tracking`
     *  setting was silently dropped and never reached rendering. */
    letterSpacing?: string;
    textAnchor: 'middle' | 'start' | 'end';
    dominantBaseline: 'middle' | 'auto' | 'hanging';
}
export interface SecondaryLabelRenderModel {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontWeight: number;
    fill: string;
    /** Same purpose as NodeLabelRenderModel.haloFill — previously the caller
     *  (ProcessCanvas.tsx) hardcoded this to the shape's own fill directly,
     *  the exact bug already fixed for the primary label. */
    haloFill: string;
    opacity: number;
    letterSpacing?: string;
}
export interface MetaIconDescriptor {
    key: string;
    title: string;
    paths: string[];
    color: string;
    bg: string;
    /** Pre-computed bounds in canvas space for hit-testing */
    bounds: Rect;
}
export interface StatusIndicatorDescriptor {
    cx: number;
    cy: number;
    r: number;
    fill: string;
    title: string;
}
export interface TaskTypeMarkerDescriptor {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fill: string;
}
export interface OverlayDescriptor {
    kind: string;
    /** Pre-computed bounds in canvas space for hit-testing */
    bounds: Rect;
    fill: string;
    opacity: number;
    interactive: boolean;
}
export interface PortDescriptor {
    anchor: string;
    cx: number;
    cy: number;
    r: number;
    fill: string;
    stroke: string;
    strokeWidth: number;
}
export interface ActorPillDescriptor {
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rx: number;
    bg: string;
    stroke: string;
    textX: number;
    textY: number;
    fontSize: number;
    fontWeight: number;
    fill: string;
}
export interface NodeRenderModel {
    /** Identity */
    id: string;
    type: LayoutNode['type'];
    /** Position — top-left origin, canvas space */
    x: number;
    y: number;
    width: number;
    height: number;
    /** Centre point for label/port alignment */
    cx: number;
    cy: number;
    /** Shape */
    shape: ShapeDescriptor;
    /** Node opacity (used for actor spotlight dimming) */
    opacity: number;
    /** Labels */
    primaryLabel?: NodeLabelRenderModel;
    secondaryLabel?: SecondaryLabelRenderModel;
    /** Decorations — bottom icon strip */
    metaIcons: MetaIconDescriptor[];
    /** Status dot — top-right */
    statusIndicator?: StatusIndicatorDescriptor;
    /** Task-type marker — top-left emoji */
    taskTypeMarker?: TaskTypeMarkerDescriptor;
    /** Gateway kind marker — center of diamond */
    gatewayMarker?: TaskTypeMarkerDescriptor;
    /** Connection ports — shown when this node's edge is selected */
    ports: PortDescriptor[];
    /** Actor pill — shown only when swimlanes are off */
    actorPill?: ActorPillDescriptor | null;
    /** Overlays — rendered in dedicated layer above shapes */
    overlays: OverlayDescriptor[];
}
export interface EdgeRenderModel {
    id: string;
    source: string;
    target: string;
    /** Waypoints in canvas space */
    waypoints: Array<{
        x: number;
        y: number;
    }>;
    /** Visual style */
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
    opacity: number;
    /** Halo */
    haloColor: string;
    haloWidth: number;
    /** Whether to show the arrow marker */
    showArrow: boolean;
    /**
     * Arrowhead shape — 'solid' (filled triangle, sequence flow) or 'open'
     * (hollow triangle, semanticRole=messageFlow) per BPMN's convention for
     * distinguishing message flow from sequence flow. Defaults to 'solid'
     * everywhere this isn't explicitly set.
     */
    arrowStyle?: 'solid' | 'open';
    /** Edge label (if any) */
    label?: {
        text: string;
        x: number;
        y: number;
        width: number;
        height: number;
        fontSize: number;
        fontWeight: number;
        fill: string;
        haloFill: string;
        haloWidth: number;
    };
}
export interface LaneRenderModel {
    id: string;
    label?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    headerHeight: number;
    headerFill: string;
    bodyFill: string;
    borderColor: string;
    borderWidth: number;
    headerBorderColor: string;
    labelColor: string;
    cornerRadius: number;
    headerFontWeight: number;
    headerLabelOpacity: number;
}
export interface CurtainRenderModel {
    side: 'inbound' | 'outbound';
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    labelColor: string;
    label: string;
    labelX: number;
    labelY: number;
}
export interface SceneRenderModel {
    nodes: NodeRenderModel[];
    edges: EdgeRenderModel[];
    lanes: LaneRenderModel[];
    curtains: CurtainRenderModel[];
    visualBounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    contentWidth: number;
    contentHeight: number;
}
export interface BuildNodeRenderModelsOptions {
    padding: number;
    laneHeaderHeight: number;
    showLanes: boolean;
    viewAsActor?: string | null;
    /** General-purpose node-set spotlight — see ViewPanelState.highlightNodeIds
     *  (types/index.ts) and buildNodeRenderModels.ts's opacity logic. */
    highlightNodeIds?: string[] | null;
    selectedElementId?: string | null;
    effectiveShowLanes: boolean;
    metaIconSize: number;
    metaIconGap: number;
    metaIconCornerRadius: number;
    showMetaIcons: boolean;
}
//# sourceMappingURL=nodeRenderModel.d.ts.map