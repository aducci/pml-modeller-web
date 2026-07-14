import { LayoutEdge, LayoutNode } from './layoutTypes';
export interface LayoutDefects {
    /** Total defect count: edge-vs-edge crossings + edge-vs-node overlaps. */
    count: number;
    /** Node ids involved in at least one defect — candidates for relocation. */
    nodeIds: Set<string>;
}
export declare function countLayoutDefects(nodes: LayoutNode[], edges: LayoutEdge[]): LayoutDefects;
//# sourceMappingURL=layoutDefects.d.ts.map