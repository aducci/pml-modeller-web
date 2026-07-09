/**
 * Bundle Windows — routing-stage sibling grouping.
 *
 * Constructs optimization windows over already-routed edges.
 * A window = one edge + its immediate siblings sharing the same source
 * OR the same target. This is the operational scope for world evaluation.
 *
 * Distinct from spatialNegotiation.ts (which works on unrouted topology
 * before channel allocation). Bundle windows operate on fully routed edges.
 */
import { LayoutEdge, LayoutNode } from '../processLayout/layoutTypes';
export interface EdgeBundle {
    windowId: string;
    sharedNodeId: string;
    sharedRole: 'source' | 'target';
    edges: LayoutEdge[];
}
/**
 * Groups routed edges into sibling bundles.
 * Each bundle contains 2+ edges sharing a source or target node.
 * Single-edge connections are not bundled (no siblings to evaluate against).
 * Output is deterministically ordered by windowId.
 */
export declare function buildBundleWindows(edges: LayoutEdge[], nodeMap: Map<string, LayoutNode>): EdgeBundle[];
//# sourceMappingURL=bundleWindows.d.ts.map