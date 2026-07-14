// Stage: Post-Routing Conflict Resolution (Phase C master controller)
// reads:  the fully routed LayoutState (edges with waypoints, nodes with
//         final x/y/width/height)
// writes: edges (routing.waypoints — via the two sub-resolvers below)
//
// This is the single owner of "clean up whatever's left after routing."
// It does not itself know how to fix anything — that's nodeObstacleAvoidance
// (edges cutting through a node they don't connect to) and crossingResolution
// (edges genuinely crossing each other) — it only knows how to run them
// safely together and verify they actually helped.
//
// Why a controller and not just "call both once": each sub-resolver reacts
// only to the conflicts it personally understands, so fixing one kind of
// conflict can incidentally create — or re-create — the other kind (e.g.
// dodging a node can push a segment straight into an edge's path; clearing
// that can push it back toward the node). Two resolvers with no shared
// memory of that will happily oscillate forever. This controller breaks
// that by measuring the total defect count (layoutDefects.ts) before and
// after each round and keeping the change ONLY if it strictly improved —
// otherwise it reverts to the last known-good state and stops. That makes
// the whole thing monotonic: defect count can only go down or stay flat
// across calls to this function, never up.
import { countLayoutDefects } from './layoutDefects';
import { resolveNodeObstacles } from './nodeObstacleAvoidance';
import { resolveEdgeCrossings } from './crossingResolution';
const MAX_ROUNDS = 4;
function cloneEdges(edges) {
    return edges.map((e) => ({
        ...e,
        routing: e.routing ? { ...e.routing, waypoints: e.routing.waypoints.map((p) => ({ ...p })) } : e.routing,
    }));
}
export function resolvePostRoutingConflicts(state) {
    let bestEdges = cloneEdges(state.edges);
    let bestCount = countLayoutDefects(state.nodes, state.edges).count;
    if (bestCount === 0) {
        return;
    }
    for (let round = 0; round < MAX_ROUNDS; round++) {
        resolveNodeObstacles(state);
        resolveEdgeCrossings(state);
        const roundCount = countLayoutDefects(state.nodes, state.edges).count;
        if (roundCount < bestCount) {
            bestCount = roundCount;
            bestEdges = cloneEdges(state.edges);
            if (bestCount === 0)
                break;
            continue;
        }
        // No improvement (or it got worse) — revert to the last good state and
        // stop; further rounds from a reverted state would just repeat this.
        state.edges = bestEdges;
        break;
    }
    state.edges = bestEdges;
    if (bestCount > 0) {
        state.diagnostics.warnings.push(`${bestCount} routed edge conflict(s) (crossings and/or node overlaps) remain after conflict resolution.`);
    }
    state.provenanceLog.push(`PostRoutingConflictResolution: settled at ${bestCount} remaining defect(s).`);
}
