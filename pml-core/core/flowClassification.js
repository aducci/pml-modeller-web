// Infers flowLayer/loop/keyFlow for edges the author left untagged, from graph topology alone.
// Runs at parse time (see adapters/pmlParser.ts), before layout — this classification feeds
// rendering (buildNodeRenderModels.ts) and any future validation, not just the canvas.
// Never infers semanticRole: whether an edge is a business "exception" is a judgment call,
// not something implied by graph shape.
function edgeKey(e) {
    return `${e.source}>${e.target}:${e.condition || ''}`;
}
/**
 * Fills in flowLayer/loop/keyFlow for edges the author left unset, using graph topology:
 * - AND-gateway branches (parallel, concurrent) are all "main" — they aren't alternatives.
 * - Any other branching node — an OR/XOR decision, a route, or an unmodeled fan-out — follows
 *   an explicit `*` (primary) outcome if one exists, else picks whichever branch is closer
 *   (fewer hops) to an outbound event; the rest of that node's branches are "alternate".
 * - An edge whose target is already an ancestor on the current path is a real back-edge (`loop`).
 *
 * Modes:
 * - 'explicit': no inference runs, model is returned unchanged.
 * - 'inferred' / 'hybrid': fills gaps using topology; explicit author tags always win
 *   regardless of which of these two is passed (they are currently equivalent — kept as
 *   two names since callers may want to say which behavior they mean).
 */
export function inferFlowClassification(model, mode) {
    if (mode === 'explicit' || !model.edges || model.edges.length === 0) {
        return model;
    }
    const edges = model.edges;
    const outgoing = new Map();
    for (const edge of edges) {
        const list = outgoing.get(edge.source) ?? [];
        list.push(edge);
        outgoing.set(edge.source, list);
    }
    const decisionsById = new Map((model.decisions ?? []).map((d) => [d.id, d]));
    const primaryInbound = (model.events ?? []).filter((e) => e.direction === 'inbound' && e.isPrimary);
    const seedNodes = primaryInbound.length > 0
        ? primaryInbound.map((e) => e.id)
        : (model.events ?? []).filter((e) => e.direction === 'inbound').map((e) => e.id);
    const classified = new Map();
    const visitedBranches = new Set();
    function classifyEdge(edge, layer) {
        const key = edgeKey(edge);
        const entry = classified.get(key) ?? {};
        // "main" is sticky — never downgraded by a later visit. Needed for join nodes reachable
        // from more than one branch: whichever branch's DFS reaches a shared downstream edge
        // FIRST used to permanently decide its classification, even when that first visit came
        // from the non-primary branch (see determinePrimaryOutcome below for the matching fix
        // on the "which branch is primary" side of this same problem).
        if (entry.flowLayer !== 'main')
            entry.flowLayer = layer;
        classified.set(key, entry);
    }
    function markLoop(edge) {
        const key = edgeKey(edge);
        const entry = classified.get(key) ?? {};
        entry.loop = true;
        classified.set(key, entry);
    }
    // Shortest distance (in hops) from each node to the nearest outbound event, via one reverse
    // BFS from all outbound events. Used to pick a decision's primary branch when there's no
    // explicit `*`: the branch closer to completion wins. This replaces an earlier "count all
    // reachable nodes" heuristic, which perversely favored longer, indirect branches whenever
    // they happened to rejoin the graph through more intermediate nodes before reaching the same
    // destination a shorter branch reached directly (e.g. a manual fallback step that eventually
    // funnels back into the same dispatch step outscored the direct dispatch branch itself).
    const reverseAdjacency = new Map();
    for (const edge of edges) {
        const list = reverseAdjacency.get(edge.target) ?? [];
        list.push(edge.source);
        reverseAdjacency.set(edge.target, list);
    }
    const distanceToOutbound = new Map();
    const outboundIds = (model.events ?? []).filter((e) => e.direction === 'outbound').map((e) => e.id);
    const bfsQueue = [];
    for (const id of outboundIds) {
        if (!distanceToOutbound.has(id)) {
            distanceToOutbound.set(id, 0);
            bfsQueue.push(id);
        }
    }
    while (bfsQueue.length > 0) {
        const current = bfsQueue.shift();
        const currentDist = distanceToOutbound.get(current);
        for (const pred of reverseAdjacency.get(current) ?? []) {
            if (!distanceToOutbound.has(pred)) {
                distanceToOutbound.set(pred, currentDist + 1);
                bfsQueue.push(pred);
            }
        }
    }
    /**
     * Determine the primary outcome of a branching node:
     * 1. Explicit `*` marker (author's choice — highest priority).
     * 2. Shortest distance to an outbound event — the branch closer to completion wins.
     * 3. First edge as tie-breaker (deterministic).
     */
    function determinePrimaryOutcome(decision, outgoing) {
        if (outgoing.length === 0)
            return undefined;
        if (decision?.outcomes) {
            const marked = decision.outcomes.find((o) => o.primary);
            if (marked) {
                const primaryEdge = outgoing.find((e) => e.target === marked.target);
                if (primaryEdge)
                    return primaryEdge;
            }
        }
        let bestEdge;
        let bestDistance = Infinity;
        for (const edge of outgoing) {
            const distance = distanceToOutbound.get(edge.target) ?? Infinity;
            if (distance < bestDistance) {
                bestDistance = distance;
                bestEdge = edge;
            }
        }
        return bestEdge ?? outgoing[0];
    }
    function visit(nodeId, isMainBranch, ancestors) {
        const outs = outgoing.get(nodeId);
        if (!outs || outs.length === 0)
            return;
        const decision = decisionsById.get(nodeId);
        const isParallel = decision?.gatewayKind === 'parallel';
        const mainTargets = new Set();
        if (isMainBranch) {
            if (isParallel) {
                // Parallel (AND) gateways: all branches run concurrently, not as alternatives —
                // every branch continues the main flow.
                for (const e of outs)
                    mainTargets.add(e);
            }
            else if (outs.length === 1) {
                // Simple node with single outgoing edge: it's main, trivially.
                mainTargets.add(outs[0]);
            }
            else {
                // Every other branching node — an OR/XOR decision (with or without an explicit `*`),
                // a route, or even a plain node with an unmodeled fan-out — gets the same treatment:
                // an explicit `*` wins if present (inside determinePrimaryOutcome), otherwise the
                // branch closer to an outbound event wins. `route` used to be hard-coded to "no
                // signal, all alternate" here, which is why main flow used to dead-end at any route
                // gateway even though decisions already got a fallback.
                const primaryEdge = determinePrimaryOutcome(decision, outs);
                if (primaryEdge)
                    mainTargets.add(primaryEdge);
            }
        }
        for (const edge of outs) {
            const isBackEdge = ancestors.has(edge.target);
            if (isBackEdge) {
                markLoop(edge);
                classifyEdge(edge, 'alternate');
                continue;
            }
            const edgeIsMain = mainTargets.has(edge);
            classifyEdge(edge, edgeIsMain ? 'main' : 'alternate');
            const branchKey = `${edge.target}::${edgeIsMain}`;
            if (visitedBranches.has(branchKey))
                continue;
            visitedBranches.add(branchKey);
            const nextAncestors = new Set(ancestors);
            nextAncestors.add(edge.target);
            visit(edge.target, edgeIsMain, nextAncestors);
        }
    }
    for (const seedId of seedNodes) {
        visit(seedId, true, new Set([seedId]));
    }
    const newEdges = edges.map((edge) => {
        const result = classified.get(edgeKey(edge));
        if (!result)
            return edge;
        const next = { ...edge };
        // Explicit author tags always win, in every mode that runs inference — only fill gaps.
        // (`loop`/`keyFlow` are parsed as concrete booleans defaulting `false`, never `undefined`,
        // so only an explicit `true` counts as authored; `false` is fair game to infer over.)
        const shouldInferFlowLayer = next.flowLayer === undefined;
        const shouldInferLoop = !next.loop;
        if (shouldInferFlowLayer && result.flowLayer) {
            next.flowLayer = result.flowLayer;
            if (result.flowLayer === 'main' && !next.keyFlow) {
                next.keyFlow = true;
            }
        }
        if (shouldInferLoop && result.loop) {
            next.loop = true;
        }
        return next;
    });
    return { ...model, edges: newEdges };
}
