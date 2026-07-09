import { mustGetNode } from '../nodeLookup';
import { DEFAULT_PORT_RULES, resolvePortAssignment } from './portResolver';
import { realizeWaypoints } from './geometryRealizer';
import { resolveScenario } from './scenarioResolver';
import { countPolylineCrossings, distance, polylineLength } from '../layoutGeometry';
/**
 * Detects edges whose routed paths are stacked on top of another edge's path
 * within the given pixel tolerance. Returns the ID of the *secondary* edge in
 * each stacked pair (the one that should be re-routed with a parallel-offset
 * alternate). The primary edge (lower array index) keeps its route unchanged.
 *
 * "Stacked" = two edges share a spine segment within tolerancePx on the same
 * axis for at least minOverlapPx of run length.
 */
export function detectStackedEdges(edges, tolerancePx = 6, minOverlapPx = 20) {
    const stacked = new Set();
    const routed = edges.filter(e => (e.routing?.waypoints?.length ?? 0) >= 2);
    for (let i = 0; i < routed.length; i++) {
        for (let j = i + 1; j < routed.length; j++) {
            const a = routed[i].routing.waypoints;
            const b = routed[j].routing.waypoints;
            if (segmentsStack(a, b, tolerancePx, minOverlapPx)) {
                // Mark the secondary edge (j) for re-routing
                stacked.add(routed[j].id);
            }
        }
    }
    return stacked;
}
/** Returns true if any horizontal or vertical segment pair across two polylines
 *  runs closer than tolerancePx apart and overlaps by at least minOverlapPx. */
function segmentsStack(a, b, tol, minOverlap) {
    for (let ai = 1; ai < a.length; ai++) {
        const a0 = a[ai - 1], a1 = a[ai];
        const aHoriz = a0.y === a1.y;
        const aVert = a0.x === a1.x;
        if (!aHoriz && !aVert)
            continue;
        for (let bi = 1; bi < b.length; bi++) {
            const b0 = b[bi - 1], b1 = b[bi];
            const bHoriz = b0.y === b1.y;
            const bVert = b0.x === b1.x;
            if (aHoriz && bHoriz && Math.abs(a0.y - b0.y) <= tol) {
                const overlap = Math.min(Math.max(a0.x, a1.x), Math.max(b0.x, b1.x))
                    - Math.max(Math.min(a0.x, a1.x), Math.min(b0.x, b1.x));
                if (overlap >= minOverlap)
                    return true;
            }
            if (aVert && bVert && Math.abs(a0.x - b0.x) <= tol) {
                const overlap = Math.min(Math.max(a0.y, a1.y), Math.max(b0.y, b1.y))
                    - Math.max(Math.min(a0.y, a1.y), Math.min(b0.y, b1.y));
                if (overlap >= minOverlap)
                    return true;
            }
        }
    }
    return false;
}
// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
export function evaluateAndApplyBundlesWithResults(edges, bundles, nodeMap, laneMap, backgroundWaypointsByEdgeId) {
    const edgeById = new Map(edges.map((e) => [e.id, { ...e }]));
    const bundleResults = [];
    for (const bundle of bundles) {
        const bundleEdgeIds = new Set(bundle.edges.map((e) => e.id));
        const backgroundWaypoints = backgroundWaypointsByEdgeId
            ? Array.from(backgroundWaypointsByEdgeId.entries())
                .filter(([id]) => !bundleEdgeIds.has(id))
                .map(([, wp]) => wp)
            : [];
        const result = evaluateBundle(bundle, nodeMap, laneMap, backgroundWaypoints);
        bundleResults.push(result);
        for (const updatedEdge of result.updatedEdges) {
            edgeById.set(updatedEdge.id, updatedEdge);
        }
    }
    const updatedEdges = edges.map((e) => edgeById.get(e.id) ?? e);
    return { updatedEdges, bundleResults };
}
// ---------------------------------------------------------------------------
// Bundle evaluation
// ---------------------------------------------------------------------------
function evaluateBundle(bundle, nodeMap, laneMap, backgroundWaypoints = []) {
    const worlds = generateBundleWorlds(bundle, nodeMap, laneMap);
    if (worlds.length === 0) {
        return {
            windowId: bundle.windowId,
            selectedWorldId: 'unchanged',
            updatedEdges: bundle.edges,
            evaluatedWorlds: 0,
            candidateScores: [],
        };
    }
    // Score all worlds — background waypoints make cross-bundle crossings visible
    for (const world of worlds) {
        world.score = scoreBundleWorld(world, nodeMap, laneMap, backgroundWaypoints);
    }
    // Lexicographic selection: geometry → perceptual → coherence → semantic-fit → worldId
    const winner = selectBestWorld(worlds);
    // Apply winner's waypoints back to edges
    const updatedEdges = bundle.edges.map((edge) => {
        const winning = winner.candidates.find((c) => c.edge.id === edge.id);
        if (!winning || winning.waypoints === edge.routing?.waypoints)
            return edge;
        return {
            ...edge,
            routing: edge.routing
                ? {
                    ...edge.routing,
                    waypoints: winning.waypoints,
                    pattern: winning.bendCount <= 1 ? 'straight' : winning.bendCount <= 2 ? 'h-first' : 'h-v-h',
                    preferences: {
                        ...edge.routing.preferences,
                        selectedGeometryMode: winning.geometryMode,
                        worldSelectedId: winner.worldId,
                    },
                }
                : undefined,
        };
    });
    const candidateScores = worlds.flatMap((w) => w.candidates.map((c) => ({
        candidateId: c.candidateId,
        geometry: aggregateDomain(w.score.geometry),
        perceptual: aggregateDomain(w.score.perceptual),
        coherence: aggregateDomain(w.score.coherence),
        semanticFit: aggregateDomain(w.score.semanticFit),
    })));
    return {
        windowId: bundle.windowId,
        selectedWorldId: winner.worldId,
        updatedEdges,
        evaluatedWorlds: worlds.length,
        candidateScores,
    };
}
// ---------------------------------------------------------------------------
// World generation — current routing + alternative geometry modes
// ---------------------------------------------------------------------------
function generateBundleWorlds(bundle, nodeMap, laneMap) {
    const worldA = buildWorldFromCurrentRouting(bundle, 'A');
    // Try alternative geometry modes for cross-lane edges
    const alternativeWorlds = buildAlternativeWorlds(bundle, nodeMap, laneMap);
    return [worldA, ...alternativeWorlds];
}
function buildWorldFromCurrentRouting(bundle, worldSuffix) {
    const candidates = bundle.edges.map((edge) => ({
        edge,
        waypoints: edge.routing?.waypoints ?? [],
        bendCount: countBends(edge.routing?.waypoints ?? []),
        scenarioKey: edge.routing?.scenario ?? 'same-lane-straight',
        geometryMode: edge.routing?.preferences?.selectedGeometryMode,
        candidateId: `${edge.id}-${worldSuffix}`,
    }));
    return { worldId: `${bundle.windowId}-${worldSuffix}`, candidates, score: emptyScore() };
}
function buildAlternativeWorlds(bundle, nodeMap, laneMap) {
    const worlds = [];
    // Identify cross-lane edges that have alternative geometry modes available
    const crossLaneEdges = bundle.edges.filter((edge) => {
        const rule = DEFAULT_PORT_RULES[edge.routing?.scenario ?? ''];
        return rule?.geometryModePreference && rule.geometryModePreference.length > 1;
    });
    if (crossLaneEdges.length === 0)
        return worlds;
    // For each alternative mode of the first cross-lane edge, generate a world
    const firstEdge = crossLaneEdges[0];
    const rule = DEFAULT_PORT_RULES[firstEdge.routing?.scenario ?? ''];
    const currentMode = firstEdge.routing?.preferences?.selectedGeometryMode;
    const altModes = (rule?.geometryModePreference ?? []).filter((m) => m !== currentMode);
    for (let i = 0; i < Math.min(altModes.length, 2); i++) {
        const altMode = altModes[i];
        const altCandidates = bundle.edges.map((edge, edgeIdx) => {
            if (edge !== firstEdge) {
                return {
                    edge,
                    waypoints: edge.routing?.waypoints ?? [],
                    bendCount: countBends(edge.routing?.waypoints ?? []),
                    scenarioKey: edge.routing?.scenario ?? 'same-lane-straight',
                    geometryMode: edge.routing?.preferences?.selectedGeometryMode,
                    candidateId: `${edge.id}-alt${i}`,
                };
            }
            const src = mustGetNode(nodeMap, edge.source);
            const tgt = mustGetNode(nodeMap, edge.target);
            const scenario = resolveScenario(src, tgt, edge, laneMap);
            const allLanes = Array.from(laneMap.values());
            const portResult = resolvePortAssignment(scenario.scenarioKey, src, tgt, {
                sourceLane: src.laneId ? laneMap.get(src.laneId) : undefined,
                targetLane: tgt.laneId ? laneMap.get(tgt.laneId) : undefined,
                allLanes,
            }, scenario.crossLaneContext);
            let geom;
            try {
                geom = realizeWaypoints(portResult.resolution, scenario, src, tgt, portResult.rule, {
                    sourceLane: src.laneId ? laneMap.get(src.laneId) : undefined,
                    targetLane: tgt.laneId ? laneMap.get(tgt.laneId) : undefined,
                    allLanes,
                    edgeChannel: edge.routing?.channel ?? 0,
                }, edge.routing?.channel ?? 0, 20, altMode);
            }
            catch (error) {
                console.warn('[routing] bundle alternative generation skipped after geometry error', {
                    edgeId: edge.id,
                    scenario: scenario.scenarioKey,
                    geometryMode: altMode,
                    error: error instanceof Error ? error.message : String(error),
                });
                return {
                    edge,
                    waypoints: edge.routing?.waypoints ?? [],
                    bendCount: countBends(edge.routing?.waypoints ?? []),
                    scenarioKey: scenario.scenarioKey,
                    geometryMode: edge.routing?.preferences?.selectedGeometryMode,
                    candidateId: `${edge.id}-alt${i}`,
                };
            }
            return {
                edge,
                waypoints: geom.waypoints,
                bendCount: countBends(geom.waypoints),
                scenarioKey: scenario.scenarioKey,
                geometryMode: altMode,
                candidateId: `${edge.id}-alt${i}`,
            };
        });
        worlds.push({ worldId: `${bundle.windowId}-alt${i}`, candidates: altCandidates, score: emptyScore() });
    }
    return worlds;
}
// ---------------------------------------------------------------------------
// 4-domain scoring
// ---------------------------------------------------------------------------
function scoreBundleWorld(world, nodeMap, laneMap, backgroundWaypoints = []) {
    const bundleWaypoints = world.candidates.map((c) => c.waypoints);
    // Include background (already-routed non-bundle edges) so cross-bundle crossings
    // are visible. The background contribution is constant across all worlds of this
    // bundle, so it doesn't distort relative comparisons — it only ensures a world
    // that avoids crossing a background edge wins over one that doesn't.
    const allWaypoints = backgroundWaypoints.length > 0
        ? [...bundleWaypoints, ...backgroundWaypoints]
        : bundleWaypoints;
    return {
        geometry: {
            crossingCount: countPolylineCrossings(allWaypoints),
            bendCount: world.candidates.reduce((s, c) => s + c.bendCount, 0),
            spacingScore: computeSpacingScore(world.candidates),
            displacementScore: computeDisplacementScore(world.candidates),
        },
        perceptual: {
            symmetryScore: computeSymmetryScore(world.candidates, nodeMap),
            parallelismScore: computeParallelismScore(world.candidates),
            corridorContinuityScore: computeCorridorContinuityScore(world.candidates, laneMap),
            visualNoiseScore: computeVisualNoiseScore(world.candidates),
            edgeRhythmScore: computeEdgeRhythmScore(world.candidates),
        },
        coherence: {
            patternAffinityScore: computePatternAffinityScore(world.candidates),
            stabilityScore: computeStabilityScore(world.candidates),
        },
        semanticFit: {
            semanticRoleFitScore: computeSemanticRoleFitScore(world.candidates),
            flowLayerAppropriatenessScore: computeFlowLayerScore(world.candidates),
        },
    };
}
// --- Geometry domain ---
function computeSpacingScore(candidates) {
    if (candidates.length < 2)
        return 1;
    let minDist = Infinity;
    for (let i = 0; i < candidates.length - 1; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
            const d = minPolylineDistance(candidates[i].waypoints, candidates[j].waypoints);
            minDist = Math.min(minDist, d);
        }
    }
    // Normalize: 0 = touching, 1 = well-spaced (≥40px)
    return Math.min(1, minDist / 40);
}
function computeDisplacementScore(candidates) {
    // Lower displacement (shorter paths) is better; normalize against worst case
    const total = candidates.reduce((s, c) => s + polylineApproxLength(c.waypoints), 0);
    const n = candidates.length;
    return n > 0 ? 1 / (1 + total / (n * 200)) : 1;
}
// --- Perceptual domain ---
function computeSymmetryScore(candidates, nodeMap) {
    // For a shared source gateway, check if branches are symmetric about source Y
    const bySource = groupBySource(candidates);
    let total = 0;
    let count = 0;
    for (const [sourceId, group] of bySource) {
        if (group.length < 2)
            continue;
        const sourceNode = nodeMap.get(sourceId);
        if (!sourceNode?.y)
            continue;
        const targetYs = group.map((c) => lastPoint(c.waypoints)?.y ?? 0);
        const mean = targetYs.reduce((s, y) => s + y, 0) / targetYs.length;
        const delta = Math.abs((sourceNode.y ?? 0) - mean);
        total += Math.max(0, 1 - delta / 80);
        count++;
    }
    return count > 0 ? total / count : 1;
}
function computeParallelismScore(candidates) {
    if (candidates.length < 2)
        return 1;
    // Check if sibling edge paths are parallel (same bend direction, same pattern family)
    const patterns = candidates.map((c) => c.scenarioKey);
    const unique = new Set(patterns);
    return 1 / unique.size; // More uniform = higher score
}
function computeCorridorContinuityScore(candidates, laneMap) {
    // Main-flow edges that form a continuous horizontal corridor score well
    const mainFlow = candidates.filter((c) => c.edge.flowLayer === 'main' || !c.edge.flowLayer);
    if (mainFlow.length === 0)
        return 1;
    // Check how horizontal the main segments are
    const horizontality = mainFlow.reduce((s, c) => s + segmentHorizontality(c.waypoints), 0) / mainFlow.length;
    return horizontality;
}
function computeVisualNoiseScore(candidates) {
    // Lower total bends = less visual noise
    const totalBends = candidates.reduce((s, c) => s + c.bendCount, 0);
    return Math.max(0, 1 - totalBends / (candidates.length * 4));
}
function computeEdgeRhythmScore(candidates) {
    // Edges should have similar path lengths for visual rhythm
    if (candidates.length < 2)
        return 1;
    const lengths = candidates.map((c) => polylineApproxLength(c.waypoints));
    const mean = lengths.reduce((s, l) => s + l, 0) / lengths.length;
    const variance = lengths.reduce((s, l) => s + Math.pow(l - mean, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(0, 1 - stdDev / 100);
}
// --- Coherence domain ---
function computePatternAffinityScore(candidates) {
    // Sibling edges using the same pattern family score higher
    if (candidates.length < 2)
        return 1;
    const patterns = candidates.map((c) => c.scenarioKey);
    const mode = mostCommon(patterns);
    const agreeing = patterns.filter((p) => p === mode).length;
    return agreeing / patterns.length;
}
function computeStabilityScore(candidates) {
    // Explicit preferred/alternate mode sets are deterministic and stable.
    return 1;
}
// --- Semantic fit domain ---
function computeSemanticRoleFitScore(candidates) {
    // Exception/compensation flows should not use corridor-primary patterns
    let score = 0;
    for (const c of candidates) {
        const role = c.edge.semanticRole;
        const isException = role === 'exceptionFlow' || role === 'compensationFlow';
        const usesMainPattern = c.scenarioKey === 'same-lane-straight' || c.scenarioKey === 'cross-lane-downward';
        if (isException && usesMainPattern) {
            score += 0.5; // mild penalty — semantic mismatch but not catastrophic
        }
        else {
            score += 1;
        }
    }
    return candidates.length > 0 ? score / candidates.length : 1;
}
function computeFlowLayerScore(candidates) {
    // Main-flow edges should use the primary routing path
    let score = 0;
    for (const c of candidates) {
        const layer = c.edge.flowLayer ?? 'main';
        if (layer === 'hidden')
            continue;
        if (layer === 'main' && c.bendCount <= 2)
            score += 1;
        else if (layer === 'alternate' && c.bendCount <= 3)
            score += 1;
        else if (layer === 'annotation')
            score += 1;
        else
            score += 0.7;
    }
    return candidates.length > 0 ? score / candidates.length : 1;
}
// ---------------------------------------------------------------------------
// Deterministic lexicographic selection (spec Section 8.3)
// ---------------------------------------------------------------------------
function selectBestWorld(worlds) {
    // 1. Sort by geometry (ascending crossings + bends)
    // 2. Among tied geometry, prioritize trunk corridor continuity
    // 3. Then sort by remaining perceptual quality (branch symmetry, rhythm, etc.)
    // 3. Among tied, sort by coherence, then semantic fit
    // 4. Final tie-break by worldId (lexicographic)
    return worlds.slice().sort((a, b) => {
        const gA = aggregateDomain(a.score.geometry, true);
        const gB = aggregateDomain(b.score.geometry, true);
        if (gA !== gB)
            return gA - gB;
        const corridorA = a.score.perceptual.corridorContinuityScore;
        const corridorB = b.score.perceptual.corridorContinuityScore;
        if (corridorA !== corridorB)
            return corridorB - corridorA;
        const pA = aggregatePerceptualWithoutCorridor(a.score.perceptual);
        const pB = aggregatePerceptualWithoutCorridor(b.score.perceptual);
        if (pA !== pB)
            return pB - pA; // higher perceptual = better
        const cA = aggregateDomain(a.score.coherence);
        const cB = aggregateDomain(b.score.coherence);
        if (cA !== cB)
            return cB - cA;
        const sA = aggregateDomain(a.score.semanticFit);
        const sB = aggregateDomain(b.score.semanticFit);
        if (sA !== sB)
            return sB - sA;
        return a.worldId.localeCompare(b.worldId);
    })[0];
}
function aggregatePerceptualWithoutCorridor(perceptual) {
    const values = [
        perceptual.symmetryScore,
        perceptual.parallelismScore,
        perceptual.visualNoiseScore,
        perceptual.edgeRhythmScore,
    ];
    const sum = values.reduce((s, v) => s + v, 0);
    return sum / values.length;
}
// ---------------------------------------------------------------------------
// Score helpers
// ---------------------------------------------------------------------------
function emptyScore() {
    return {
        geometry: { crossingCount: 0, bendCount: 0, spacingScore: 0, displacementScore: 0 },
        perceptual: { symmetryScore: 0, parallelismScore: 0, corridorContinuityScore: 0, visualNoiseScore: 0, edgeRhythmScore: 0 },
        coherence: { patternAffinityScore: 0, stabilityScore: 0 },
        semanticFit: { semanticRoleFitScore: 0, flowLayerAppropriatenessScore: 0 },
    };
}
function aggregateDomain(domain, lowerIsBetter = false) {
    const values = Object.values(domain);
    const sum = values.reduce((s, v) => s + v, 0);
    return lowerIsBetter ? sum : sum / (values.length || 1);
}
// ---------------------------------------------------------------------------
// Geometry utilities — all use shared primitives, no duplication
// ---------------------------------------------------------------------------
function countBends(waypoints) {
    return Math.max(0, waypoints.length - 2);
}
const polylineApproxLength = polylineLength;
function minPolylineDistance(a, b) {
    let min = Infinity;
    for (const pa of a) {
        for (const pb of b) {
            min = Math.min(min, distance(pa, pb));
        }
    }
    return min;
}
function lastPoint(waypoints) {
    return waypoints[waypoints.length - 1];
}
function segmentHorizontality(waypoints) {
    if (waypoints.length < 2)
        return 0;
    let horizLen = 0;
    let totalLen = 0;
    for (let i = 1; i < waypoints.length; i++) {
        const dx = Math.abs(waypoints[i].x - waypoints[i - 1].x);
        const dy = Math.abs(waypoints[i].y - waypoints[i - 1].y);
        const len = distance(waypoints[i - 1], waypoints[i]);
        totalLen += len;
        if (dx > dy)
            horizLen += len;
    }
    return totalLen > 0 ? horizLen / totalLen : 0;
}
function groupBySource(candidates) {
    const map = new Map();
    for (const c of candidates) {
        const src = c.edge.source;
        const arr = map.get(src) ?? [];
        arr.push(c);
        map.set(src, arr);
    }
    return map;
}
function mostCommon(arr) {
    const counts = new Map();
    for (const v of arr)
        counts.set(v, (counts.get(v) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
}
