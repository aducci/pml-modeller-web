import { LayoutState, LayoutNode, LayoutEdge, Lane } from './layoutTypes';
/**
 * Refines node.y for continuity alignment across the whole node set. Mutates
 * node.y (this stage's real job) but returns provenance text rather than
 * pushing to state.provenanceLog itself — the caller (assignNodeSlotsWithinLaneDepth
 * in coordinateAssignment.ts) is the single place that attaches provenance to
 * state, per 00_coding_Standards.md's "diagnostics stay out of geometry
 * functions" rule.
 */
export declare function applyContinuityRefinements(state: LayoutState, depthLaneMap: Map<string, LayoutNode[]>, laneById: Map<string, Lane>, nodeById: Map<string, LayoutNode>, incomingByTarget: Map<string, LayoutEdge[]>, outgoingBySource: Map<string, LayoutEdge[]>): string[];
//# sourceMappingURL=continuityAlignment.d.ts.map