import { LayoutSettings } from './layoutTypes';
export interface NodeDimensions {
    width: number;
    height: number;
    layoutWidth: number;
    layoutHeight: number;
}
/**
 * A node's effective size — layoutWidth/layoutHeight (which include external
 * label space) when present, falling back to width/height otherwise. This
 * exact `layoutHeight ?? height` / `layoutWidth ?? width` ternary was
 * independently repeated 14 times across processLayout/*.ts; this names it
 * once. Callers needing the half-value divide by 2 themselves rather than
 * this module adding four near-identical half-size variants.
 */
export declare function effectiveSize(node: {
    width: number;
    height: number;
    layoutWidth?: number;
    layoutHeight?: number;
}): {
    width: number;
    height: number;
};
export declare function measureNodeDimensions(type: string, label: string, settings: LayoutSettings): NodeDimensions;
//# sourceMappingURL=elementSizing.d.ts.map