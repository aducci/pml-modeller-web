import type { NormalizedProcessGraph } from '../core/normalizedGraph';
import type { LayoutSettings } from '../core/processLayout/layoutTypes';
import type { LayoutResult } from '../core/processLayout/layoutTypes';
/**
 * LayoutEngine manages the pipeline for parsing the graph and determining
 * the geometric positions of nodes and lanes.
 */
export declare class LayoutEngine {
    constructor();
    /**
     * Main entrypoint for layout computation.
     */
    computeLayout(normalizedGraph: NormalizedProcessGraph | null, settings?: Partial<LayoutSettings>): LayoutResult | null;
}
//# sourceMappingURL=LayoutEngine.d.ts.map