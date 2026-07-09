// Stage: Lane Consensus
// reads:  nodes (laneId, depth), edges (source, target)
// writes: nothing — returns LaneConsensusResult (caller applies assignments)
function stableNodeOrder(nodes) {
    return nodes
        .slice()
        .sort((a, b) => {
        const depthA = a.depth ?? 0;
        const depthB = b.depth ?? 0;
        if (depthA !== depthB)
            return depthA - depthB;
        return a.id.localeCompare(b.id);
    });
}
function pickWinner(votes, laneIds) {
    const ranked = Array.from(votes.entries()).sort((a, b) => {
        if (a[1] !== b[1])
            return b[1] - a[1];
        return laneIds.indexOf(a[0]) - laneIds.indexOf(b[0]);
    });
    const [winner, winCount] = ranked[0];
    const total = ranked.reduce((s, [, c]) => s + c, 0);
    return [winner, winCount, total];
}
/**
 * Propagate lane assignments using predecessor votes (forward pass) optionally
 * blended with successor votes (backward pass) when successorWeight > 0.
 *
 * successorWeight = 0  → pure predecessor behaviour (original)
 * successorWeight = 0.5 → balanced (default)
 */
export function propagateLaneConsensus(nodes, edges, lanes, successorWeight = 0, fallbackLaneId) {
    const laneIds = lanes.map((l) => l.id);
    const defaultLaneId = fallbackLaneId || laneIds[0] || 'default';
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    // Build incoming and outgoing adjacency
    const incoming = new Map();
    const outgoing = new Map();
    for (const n of nodes) {
        incoming.set(n.id, []);
        outgoing.set(n.id, []);
    }
    for (const e of edges) {
        incoming.get(e.target)?.push(e.source);
        outgoing.get(e.source)?.push(e.target);
    }
    // ── Forward pass: vote by predecessor lanes ─────────────────────────────
    const forwardAssignments = new Map();
    for (const node of stableNodeOrder(nodes)) {
        if (node.laneId) {
            forwardAssignments.set(node.id, node.laneId);
            continue;
        }
        const votes = new Map();
        for (const predId of incoming.get(node.id) ?? []) {
            const lane = forwardAssignments.get(predId) ?? nodeMap.get(predId)?.laneId;
            if (lane)
                votes.set(lane, (votes.get(lane) ?? 0) + 1);
        }
        if (votes.size === 0) {
            forwardAssignments.set(node.id, defaultLaneId);
        }
        else {
            const [winner] = pickWinner(votes, laneIds);
            forwardAssignments.set(node.id, winner);
        }
    }
    // ── Backward pass: vote by successor lanes (only for unanchored nodes) ──
    const backwardWinners = new Map();
    if (successorWeight > 0) {
        const reverseOrder = stableNodeOrder(nodes).reverse();
        const backAssignments = new Map();
        for (const node of reverseOrder) {
            if (node.laneId) {
                backAssignments.set(node.id, node.laneId);
                continue;
            }
            const votes = new Map();
            for (const succId of outgoing.get(node.id) ?? []) {
                const lane = backAssignments.get(succId) ?? nodeMap.get(succId)?.laneId;
                if (lane)
                    votes.set(lane, (votes.get(lane) ?? 0) + 1);
            }
            if (votes.size > 0) {
                const [winner] = pickWinner(votes, laneIds);
                backAssignments.set(node.id, winner);
                backwardWinners.set(node.id, winner);
            }
        }
    }
    // ── Merge passes ────────────────────────────────────────────────────────
    const decisions = [];
    const assignments = new Map();
    for (const node of stableNodeOrder(nodes)) {
        if (node.laneId) {
            assignments.set(node.id, node.laneId);
            decisions.push({ nodeId: node.id, assignedLaneId: node.laneId, reason: 'actor', confidence: 1, voteCounts: {} });
            continue;
        }
        const fwd = forwardAssignments.get(node.id);
        const bwd = backwardWinners.get(node.id);
        const conflict = fwd !== undefined && bwd !== undefined && fwd !== bwd;
        let chosen;
        let reason;
        let confidence;
        if (conflict) {
            // Build blended vote tally
            const blended = new Map();
            // Predecessor votes (weight = 1)
            for (const predId of incoming.get(node.id) ?? []) {
                const lane = forwardAssignments.get(predId) ?? nodeMap.get(predId)?.laneId;
                if (lane)
                    blended.set(lane, (blended.get(lane) ?? 0) + 1);
            }
            // Successor votes (weight = successorWeight)
            for (const succId of outgoing.get(node.id) ?? []) {
                const lane = nodeMap.get(succId)?.laneId ?? forwardAssignments.get(succId);
                if (lane)
                    blended.set(lane, (blended.get(lane) ?? 0) + successorWeight);
            }
            const [winner, winCount, total] = pickWinner(blended, laneIds);
            chosen = winner;
            reason = 'consensus';
            confidence = total > 0 ? winCount / total : 0.5;
        }
        else if (fwd && fwd !== defaultLaneId) {
            chosen = fwd;
            reason = 'consensus';
            const preds = incoming.get(node.id) ?? [];
            const predVotes = new Map();
            for (const predId of preds) {
                const lane = forwardAssignments.get(predId) ?? nodeMap.get(predId)?.laneId;
                if (lane)
                    predVotes.set(lane, (predVotes.get(lane) ?? 0) + 1);
            }
            const total = Array.from(predVotes.values()).reduce((s, c) => s + c, 0);
            confidence = total > 0 ? (predVotes.get(chosen) ?? 0) / total : 0.5;
        }
        else {
            chosen = defaultLaneId;
            reason = 'default';
            confidence = 0.4;
        }
        assignments.set(node.id, chosen);
        decisions.push({
            nodeId: node.id,
            assignedLaneId: chosen,
            reason,
            confidence,
            voteCounts: {},
            bidirectionalConflict: conflict || undefined,
        });
    }
    return { assignments, decisions };
}
export function analyzeDecisionLaneAffinity(nodes, edges, settings) {
    if (settings.mode === 'off')
        return [];
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const outgoingEdges = new Map();
    for (const n of nodes)
        outgoingEdges.set(n.id, []);
    for (const e of edges)
        outgoingEdges.get(e.source)?.push(e);
    const recommendations = [];
    for (const node of stableNodeOrder(nodes)) {
        if (node.type !== 'decision')
            continue;
        if (!node.laneId)
            continue;
        const edges = outgoingEdges.get(node.id) ?? [];
        if (edges.length < settings.minOutgoingEdges)
            continue;
        const laneVotes = new Map();
        for (const e of edges) {
            const tgt = nodeById.get(e.target)?.laneId;
            if (tgt)
                laneVotes.set(tgt, (laneVotes.get(tgt) ?? 0) + 1);
        }
        if (laneVotes.size === 0)
            continue;
        const ranked = Array.from(laneVotes.entries()).sort((a, b) => a[1] !== b[1] ? b[1] - a[1] : a[0].localeCompare(b[0]));
        const [suggestedLaneId, dominantVotes] = ranked[0];
        const totalVotes = ranked.reduce((s, [, c]) => s + c, 0);
        const dominantOutgoingRatio = totalVotes > 0 ? dominantVotes / totalVotes : 0;
        if (suggestedLaneId === node.laneId)
            continue;
        if (dominantOutgoingRatio < settings.minDominantOutgoingRatio)
            continue;
        recommendations.push({
            nodeId: node.id,
            currentLaneId: node.laneId,
            suggestedLaneId,
            dominantOutgoingRatio,
            outgoingEdgeCount: totalVotes,
            voteCounts: Object.fromEntries(ranked),
        });
    }
    return recommendations;
}
