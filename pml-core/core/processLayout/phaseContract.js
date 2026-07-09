// Phase ownership contract for LayoutState fields.
//
// Single source of truth for which pipeline phase (see index.ts: A-graph,
// B-geometry, C-routing, D-analysis) may write which node/lane/edge field.
// Per 00_coding_Standards.md: check this file before writing to any
// node/lane/edge field in the layout pipeline — register the write here, as
// either the field's owning phase or a disclosed handoff, or don't write it.
//
// A field has exactly one owning phase: the phase whose output is expected to
// hold its settled value for every downstream stage. A handoff is a later
// phase that legitimately still needs to revise the field, plus the reason
// the dependency can't be satisfied earlier (usually: the revision depends on
// a computation — e.g. channel allocation — that only exists in that later
// phase). Undisclosed writes outside a field's owning phase or handoff list
// are exactly the class of bug this file exists to prevent: a stage silently
// touching state a neighboring stage's contract claims to own.
/** LayoutNode field ownership. */
export const NODE_FIELD_OWNERSHIP = {
    depth: { owningPhase: 'A-graph' },
    chainId: { owningPhase: 'A-graph' },
    chainIndex: { owningPhase: 'A-graph' },
    laneId: { owningPhase: 'B-geometry' },
    x: { owningPhase: 'B-geometry' },
    y: {
        owningPhase: 'B-geometry',
        handoffs: [
            {
                phase: 'C-routing',
                reason: 'Lane channel expansion depends on channel-allocation results, which only exist once ' +
                    'C-routing runs, and must shift node.y before edge waypoints are generated — the write ' +
                    'cannot happen in B-geometry despite being geometric in nature.',
                writtenBy: 'expandLanesForRoutingChannels (routingPost.ts)',
            },
            {
                phase: 'C-routing',
                reason: 'Continuity alignment locks a single-predecessor node to its predecessor\'s y, applied ' +
                    'after channel allocation so the lock reflects post-expansion lane geometry.',
                writtenBy: 'applyContinuityAlignmentLocks (routingPost.ts)',
            },
        ],
    },
};
/** Lane field ownership. */
export const LANE_FIELD_OWNERSHIP = {
    x: { owningPhase: 'B-geometry' },
    y: {
        owningPhase: 'B-geometry',
        handoffs: [
            {
                phase: 'C-routing',
                reason: 'Lane position must shift to fit routing-channel counts, only known after channel allocation.',
                writtenBy: 'expandLanesForRoutingChannels (routingPost.ts)',
            },
        ],
    },
    height: {
        owningPhase: 'B-geometry',
        handoffs: [
            {
                phase: 'C-routing',
                reason: 'Same dependency as lane.y — height must expand to fit allocated routing channels.',
                writtenBy: 'expandLanesForRoutingChannels (routingPost.ts)',
            },
        ],
    },
    activeChannels: { owningPhase: 'C-routing' },
};
/** LayoutEdge field ownership. */
export const EDGE_FIELD_OWNERSHIP = {
    routing: { owningPhase: 'C-routing' },
};
/** No node/lane/edge field may be written after D-analysis begins (see index.ts runAnalysisPhase). */
export const FINAL_PHASE = 'D-analysis';
