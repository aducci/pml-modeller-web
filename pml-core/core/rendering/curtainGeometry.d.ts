/**
 * Curtain Geometry Controller
 *
 * Single controller for all curtain width and position calculations.
 * ProcessCanvas is a renderer — it must not contain geometry logic.
 * All curtain sizing decisions belong here.
 *
 * A curtain is the inbound (left) or outbound (right) interface zone that
 * frames boundary events at the edges of the process model.
 */
import { LayoutNode } from '../processLayout/layoutTypes';
import { ProcessThemeCanvasTokens } from '../styling/styleSchema';
export interface CurtainGeometry {
    /** Inbound (left) curtain */
    left: {
        x: number;
        center: number;
        width: number;
    };
    /** Outbound (right) curtain */
    right: {
        x: number;
        center: number;
        width: number;
    };
}
interface CurtainGeometryInput {
    inboundEventNodes: LayoutNode[];
    outboundEventNodes: LayoutNode[];
    /** Left edge of the first swimlane, in canvas coordinates. */
    minLaneX: number;
    /** Right edge of the last swimlane, in canvas coordinates. */
    maxLaneX: number;
    /** Canvas padding offset (canvasPaddingX from settings). */
    padding: number;
    /** Right edge of the layout bounds, in model coordinates (before padding). */
    boundsWidth: number;
    canvasTokens: ProcessThemeCanvasTokens;
    /** Approximate px-per-character for the current font. */
    estimatedCharWidth: number;
    /** Horizontal inner padding added to measured text. */
    textPaddingX: number;
}
/**
 * Derives the pixel geometry for both interface curtains from the current
 * layout result. All sizing decisions are made here and returned as a plain
 * value object for the renderer to consume without further calculation.
 */
export declare function computeCurtainGeometry(input: CurtainGeometryInput): CurtainGeometry;
export {};
//# sourceMappingURL=curtainGeometry.d.ts.map