/**
 * Graph Window — Subgraph Extraction
 *
 * Extracts a focused subgraph from a NormalizedProcessGraph based on a
 * focus type and optional focus ID. The result is a trimmed graph that
 * is deterministic (zero AI involvement) and PML-faithful.
 *
 * Focus types supported in v1:
 *   'actor'     — all nodes + edges scoped to a single actor
 *   'decision'  — a decision/route node plus its reachable branches
 *   'flow-path' — linear or branching path traced from a start node
 *   'full'      — passthrough, returns entire graph
 */
import { NormalizedProcessGraph } from '../normalizedGraph';
export type GraphFocusType = 'actor' | 'decision' | 'flow-path' | 'full';
export interface GraphWindowOptions {
    /** The kind of subgraph to extract. */
    focusType: GraphFocusType;
    /** The ID of the focus element (actor id, node id). Required unless 'full'. */
    focusId?: string;
    /** Max traversal depth from focus node (0 = single node, 1 = immediate neighbours). Default 2. */
    maxDepth?: number;
    /** Include metadata annotations (notes, kpis, risks)? Default false — keeps prompt tokens low. */
    includeMetadata?: boolean;
    /** Include edge conditions/labels? Default true. */
    includeEdgeDetails?: boolean;
}
export interface GraphWindowResult {
    /** The extracted subgraph. */
    graph: NormalizedProcessGraph;
    /** Number of nodes in the window. */
    nodeCount: number;
    /** Number of edges in the window. */
    edgeCount: number;
    /** The computed depth of the window. */
    depth: number;
    /** Human-readable summary for AI context. */
    summary: string;
}
export declare function extractGraphWindow(fullGraph: NormalizedProcessGraph, options: GraphWindowOptions): GraphWindowResult;
//# sourceMappingURL=graphWindow.d.ts.map