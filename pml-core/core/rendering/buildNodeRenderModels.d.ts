/**
 * buildNodeRenderModels — pure function that transforms LayoutResult + theme
 * into a SceneRenderModel that ProcessCanvas consumes exclusively.
 *
 * Policy: All rendering decisions (colours, visibility, icon layout) are made
 * in this builder. ProcessCanvas is a pure renderer — no decision logic.
 *
 * Policy: Interaction state (hover, selection) is NOT included in the output.
 * It is applied as CSS classes on the <g> element at render time. The model
 * is stable until the layout or theme changes.
 */
import type { LayoutResult, LayoutNode, LayoutEdge } from '../processLayout/layoutTypes';
import type { ProcessThemeSchema } from '../styling/styleSchema';
import type { LabelControllerResult } from './labelController';
import { type CurtainGeometry } from './curtainGeometry';
import type { SceneRenderModel, EdgeRenderModel, BuildNodeRenderModelsOptions } from './nodeRenderModel';
export declare function buildNodeRenderModels(layoutResult: LayoutResult, labelScene: LabelControllerResult | null, theme: ProcessThemeSchema, options: BuildNodeRenderModelsOptions, visibilityMode: string, revealGroups: string[], selectedElementId?: string | null, flowVisibility?: {
    main: boolean;
    alternate: boolean;
    exception: boolean;
    termination: boolean;
}, curtainGeometry?: CurtainGeometry | null, inboundNodes?: LayoutNode[], outboundNodes?: LayoutNode[], connectorStyle?: ConnectorStyle): SceneRenderModel;
/**
 * The single, authoritative edge category — decides which theme.edges.*
 * bucket an edge's color/dash/width come from, in EVERY connector-style
 * mode. Previously this same decision was made twice, inconsistently:
 * buildEdgeModels() picked a theme bucket via semanticRole + a routing.scenario
 * STRING match (forced to '' in 'flowTypes'/'uniform' modes, so cross-lane/
 * loopback-by-geometry never applied there), while alternateEdgeStyle()
 * separately re-derived a category via semanticRole + the boolean edge.loop
 * field + flowLayer — using a hardcoded color palette the admin Theme panel
 * had no way to see or edit. The two chains disagreed on cross-lane entirely
 * (alternateEdgeStyle had no cross-lane branch at all) and used different
 * signals for loopback. One category, one place, used everywhere.
 */
export type EdgeCategory = 'message' | 'exception' | 'loopback' | 'crossLane' | 'default';
export declare function resolveEdgeCategory(edge: LayoutEdge, nodesById: Map<string, LayoutNode>): EdgeCategory;
export declare function buildEdgeModels(edges: LayoutEdge[], padding: number, theme: ProcessThemeSchema, visibilityMode: string, revealGroups: string[], selectedElementId?: string | null, flowVisibility?: {
    main: boolean;
    alternate: boolean;
    exception: boolean;
    termination: boolean;
}, labelScene?: LabelControllerResult | null, connectorStyle?: ConnectorStyle, nodes?: LayoutNode[]): EdgeRenderModel[];
export type ConnectorStyle = 'uniform' | 'keyFlow' | 'flowTypes';
//# sourceMappingURL=buildNodeRenderModels.d.ts.map