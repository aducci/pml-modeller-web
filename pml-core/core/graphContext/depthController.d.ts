/**
 * Depth Controller — Depth-Limited BFS Traversal
 *
 * Provides bounded graph traversal with cycle safety via visited set.
 * Used by graphWindow to limit extraction depth.
 *
 * The controller supports both forward-only (outgoing edges) and
 * bidirectional (incoming + outgoing) traversal modes.
 */
import { NormalizedProcessGraph } from '../normalizedGraph';
export type TraversalDirection = 'forward' | 'bidirectional';
export interface TraversalConfig {
    /** Starting node ID(s). */
    startIds: string[];
    /** Max depth from start (0 = start nodes only, 1 = immediate neighbours). Default 3. */
    maxDepth: number;
    /** Direction of traversal. */
    direction: TraversalDirection;
}
export interface TraversalResult {
    /** All nodes visited during traversal. */
    nodeIds: Set<string>;
    /** All edges traversed during traversal. */
    edgeIds: Set<string>;
    /** Map of node ID → depth from start. */
    depthMap: Map<string, number>;
}
export declare function traverseGraph(graph: NormalizedProcessGraph, config: TraversalConfig): TraversalResult;
/**
 * Expands a node set by one level (outgoing edges only).
 * Useful for adding boundary-adjacent context nodes.
 */
export declare function expandOneLevel(graph: NormalizedProcessGraph, nodeIds: Set<string>): {
    nodeIds: Set<string>;
    edgeIds: Set<string>;
};
//# sourceMappingURL=depthController.d.ts.map