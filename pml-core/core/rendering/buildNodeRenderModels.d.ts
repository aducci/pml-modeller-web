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
export declare function buildEdgeModels(edges: LayoutEdge[], padding: number, theme: ProcessThemeSchema, visibilityMode: string, revealGroups: string[], selectedElementId?: string | null, flowVisibility?: {
    main: boolean;
    alternate: boolean;
    exception: boolean;
    termination: boolean;
}, labelScene?: LabelControllerResult | null, connectorStyle?: ConnectorStyle): EdgeRenderModel[];
export type ConnectorStyle = 'uniform' | 'keyFlow' | 'flowTypes';
//# sourceMappingURL=buildNodeRenderModels.d.ts.map