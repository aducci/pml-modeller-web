import { LayoutState, LayoutNode, LayoutEdge, Lane } from './layoutTypes';
/**
 * Aligned Y for a solo node occupying its depth-lane cell, or undefined if
 * this node isn't a continuity-alignment candidate. Only handles the
 * terminal-outbound-event and linear-bridge cases — applyContinuityRefinements
 * (below) handles those plus source-inbound events and spine gateways, and
 * additionally checks for sibling collisions.
 *
 * NOTE: applyContinuityRefinements runs as a full second pass immediately
 * after this function's caller finishes, and appears to be a strict superset
 * for the two cases this function handles. It's plausible this function's
 * alignment is always overwritten by that later pass, making it redundant —
 * unverified as of the extraction that moved this here (see
 * docs/FINAL/08_Architecture_Deepening_Review.md's coordinateAssignment.ts
 * restructuring plan, Phase 3). Do not delete without re-running that
 * investigation; do not assume it's live behavior either.
 */
export declare function resolveContinuityAlignedY(node: LayoutNode, lane: Lane, laneHeaderHeight: number, incomingByTarget: Map<string, LayoutEdge[]>, outgoingBySource: Map<string, LayoutEdge[]>, nodeById: Map<string, LayoutNode>): number | undefined;
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