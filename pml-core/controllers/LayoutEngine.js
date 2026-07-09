import { computeProcessLayout } from '../core/processLayout/index';
/**
 * LayoutEngine manages the pipeline for parsing the graph and determining
 * the geometric positions of nodes and lanes.
 */
export class LayoutEngine {
    constructor() { }
    /**
     * Main entrypoint for layout computation.
     */
    computeLayout(normalizedGraph, settings) {
        if (!normalizedGraph)
            return null;
        try {
            return computeProcessLayout(normalizedGraph, settings);
        }
        catch (err) {
            console.error('Layout computation failed:', err);
            return null;
        }
    }
}
