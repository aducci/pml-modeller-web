// mustGetNode — the parser-guaranteed node lookup.
//
// Strict-mode validateNormalizedGraphContract (pmlToNormalizedGraph.ts) confirms
// every edge's source/target id exists in graph.nodes before the graph leaves the
// parser. Once that's true, `nodeMap.get(edge.source)` can never miss for an id
// sourced from graph.edges — so `.get()` typing as `T | undefined` and reaching
// for a `!node` guard is fighting the compiler into re-adding a check the parser
// already made redundant. Use mustGetNode(nodeMap, id) instead: it throws with the
// offending id on a miss (a bug detector) rather than silently early-returning (a
// bug concealer that hides a broken invariant behind a no-op).
//
// Do NOT use this for fields assigned by a pipeline stage (laneId, x, y, routing,
// …) — those are genuinely undefined before their owning phase runs; that's a
// real optional check, not a parser guarantee, and belongs in the caller.
export function mustGetNode(nodeMap, id) {
    const node = nodeMap.get(id);
    if (!node) {
        throw new Error(`mustGetNode: node "${id}" not found. This id came from an edge, and edge ` +
            `endpoints are parser-guaranteed to exist in graph.nodes (strict-mode ` +
            `validateNormalizedGraphContract) — a miss here means that invariant was ` +
            `violated upstream, not that this is a normal "not found" case to handle quietly.`);
    }
    return node;
}
