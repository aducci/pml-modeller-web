/**
 * Path Router — Layer A→B→C Orchestrator
 *
 * Coordinates the three routing layers per edge:
 *   Layer A: resolveScenario → resolvePortAssignment
 *   Layer B: spatialNegotiation (IP-2)
 *   Layer C: realizeWaypoints → buildRouteWhyPacket
 *
 * Zero inline routing logic. All decisions delegated to specialist modules.
 */
import { buildById } from '../processLayout/stageHelpers';
import { resolveScenario } from './scenarioResolver';
import { resolvePortAssignment } from './portResolver';
import { matchRoutingRule, } from './routingRuleDefinition';
import { codeToPortRule } from './routingTypeToPortRule';
import { realizeWaypoints } from './geometryRealizer';
import { buildRouteWhyPacket, buildProvenanceString, buildRoutingDiagnosticsV2, applyBundleResultToDiagnostics, } from './routingDiagnostics';
import { deriveRoutingTypeCode } from './routingDiagnostics';
import { determineRailTier, buildRailOffset, distance, midpoint, isStraightPolyline } from '../layoutGeometry';
import { mustGetNode } from '../nodeLookup';
import { buildBundleWindows } from './bundleWindows';
import { evaluateAndApplyBundlesWithResults, detectStackedEdges } from './worldEvaluator';
class PathRouter {
    constructor(nodes, lanes) {
        Object.defineProperty(this, "nodeMap", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "laneMap", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.nodeMap = buildById(nodes);
        this.laneMap = new Map(lanes.map((l) => [l.id, l]));
    }
    routeEdge(edge, options = {}) {
        if (edge.flowLayer === 'hidden') {
            const hiddenSnapshot = this.buildDebugSnapshot(edge, 'hidden-layer', 'none', 'right', 'left', { x: 0, y: 0 }, { x: 0, y: 0 }, { allLanes: Array.from(this.laneMap.values()) }, [], 'error', 'Edge flowLayer is hidden and intentionally not routed.');
            return {
                id: `route-${edge.id}`,
                channel: 0,
                waypoints: [],
                scenario: 'hidden-layer',
                pattern: 'unrouted',
                policies: [],
                preferences: {
                    channelSource: 'router-hidden-layer',
                    debugSnapshot: hiddenSnapshot,
                },
                corridorReason: 'hidden-layer edge skipped from rendering',
                provenance: `scenario=hidden-layer | edge=${edge.id}`,
                labelAnchor: { x: 0, y: 0 },
                labelPosition: 'center',
            };
        }
        const source = mustGetNode(this.nodeMap, edge.source);
        const target = mustGetNode(this.nodeMap, edge.target);
        if (source.x === undefined || source.y === undefined ||
            target.x === undefined || target.y === undefined) {
            const unresolvedSnapshot = this.buildDebugSnapshot(edge, 'unresolved-precondition', 'none', 'right', 'left', { x: source.x ?? 0, y: source.y ?? 0 }, { x: target.x ?? 0, y: target.y ?? 0 }, {
                sourceLane: source.laneId ? this.laneMap.get(source.laneId) : undefined,
                targetLane: target.laneId ? this.laneMap.get(target.laneId) : undefined,
                allLanes: Array.from(this.laneMap.values()),
            }, [], 'error', 'Missing source/target node geometry; routing preconditions failed.');
            return {
                id: `route-${edge.id}`,
                channel: 0,
                waypoints: [],
                scenario: 'unresolved-precondition',
                pattern: 'unrouted',
                policies: [],
                preferences: {
                    channelSource: 'router-precondition-failure',
                    debugSnapshot: unresolvedSnapshot,
                },
                corridorReason: 'routing skipped after precondition failure',
                provenance: `scenario=unresolved-precondition | edge=${edge.id}`,
                labelAnchor: { x: 0, y: 0 },
                labelPosition: 'center',
            };
        }
        // --- Layer A ---
        const neighborhood = options.neighborhoodContext
            ? {
                sourceOutDegree: options.neighborhoodContext.outDegreeMap.get(edge.source) ?? 1,
                targetInDegree: options.neighborhoodContext.inDegreeMap.get(edge.target) ?? 1,
                sourceOutgoingTargetLaneIds: options.neighborhoodContext.outTargetLaneIdsMap.get(edge.source) ?? [],
            }
            : undefined;
        const scenario = resolveScenario(source, target, edge, this.laneMap, neighborhood, options.patternTable);
        const channel = this.resolveEdgeChannel(edge.id, source, target, options);
        const context = {
            sourceLane: source.laneId ? this.laneMap.get(source.laneId) : undefined,
            targetLane: target.laneId ? this.laneMap.get(target.laneId) : undefined,
            allLanes: Array.from(this.laneMap.values()),
            edgeChannel: channel,
            loopbackStyle: options.loopbackStyle ?? 'edge-slot',
            edgeChannelStrategy: options.edgeChannelStrategy ?? 'follow-node',
            horizontalConnectionsOnly: Boolean(options.horizontalConnectionsOnly),
        };
        // Rules table lookup — sits above the hardcoded portResolver registry.
        // patternTable (PatternDefinition) takes precedence if it already set matchedFlow.
        // Condition priority: parallel-offset > compact-mode > primary (path-blocked is post-resolution).
        const matchedAdminRule = (() => {
            if (scenario.matchedFlow)
                return null; // pattern already resolved
            if (!options.routingRules?.length)
                return null;
            const ruleCtx = {
                sourceType: nodeTypeToRuleType(source.type),
                targetType: nodeTypeToRuleType(target.type),
                laneConfig: scenarioKeyToLaneConfig(scenario.scenarioKey),
            };
            return matchRoutingRule(options.routingRules, ruleCtx);
        })();
        const activePreCondition = options.parallelOffsetEdgeIds?.has(edge.id) ? 'parallel-offset'
            : options.compactMode ? 'compact-mode'
                : null;
        const primaryFlow = matchedAdminRule
            ? resolveAdminTypeCode(matchedAdminRule, activePreCondition)
            : scenario.matchedFlow;
        let { rule, resolution, selectedGeometryMode } = resolvePortAssignment(scenario.scenarioKey, source, target, context, scenario.crossLaneContext, undefined, scenario.flowLayerBias, primaryFlow ?? undefined);
        // Phase 2: path-blocked — primary port was significantly downgraded, try alternates.
        if (matchedAdminRule && portWasBlocked(resolution)) {
            const fallback = tryAlternates(matchedAdminRule.alternates, 'path-blocked', scenario.scenarioKey, source, target, context, scenario.crossLaneContext, scenario.flowLayerBias);
            if (fallback)
                ({ rule, resolution, selectedGeometryMode } = fallback);
        }
        // --- Layer B (IP-2: spatial negotiation inserted here) ---
        // --- Layer C ---
        let geometry;
        try {
            geometry = realizeWaypoints(resolution, scenario, source, target, rule, context, channel, options.crossLaneLaneTopBufferPx ?? 20, selectedGeometryMode);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorSnapshot = this.buildDebugSnapshot(edge, scenario.scenarioKey, selectedGeometryMode ?? 'none', resolution.sourceSelected, resolution.targetSelected, { x: source.x ?? 0, y: source.y ?? 0 }, { x: target.x ?? 0, y: target.y ?? 0 }, context, [], 'error', errorMessage);
            console.warn('[routing] skipping edge after geometry validation/precondition failure', {
                edgeId: edge.id,
                scenario: scenario.scenarioKey,
                selectedGeometryMode,
                error: errorMessage,
            });
            return {
                id: `route-${edge.id}`,
                channel,
                waypoints: [],
                scenario: scenario.scenarioKey,
                pattern: 'unrouted',
                policies: scenario.appliedPolicies,
                preferences: {
                    loopbackStyle: context.loopbackStyle,
                    edgeChannelStrategy: context.edgeChannelStrategy,
                    channelDensityMode: options.channelDensityMode ?? 'auto',
                    channelSource: 'router-geometry-failure',
                    sourcePortRequested: resolution.sourceRequested,
                    sourcePortSelected: resolution.sourceSelected,
                    sourceDowngradeReason: resolution.sourceDowngradeReason,
                    targetPortRequested: resolution.targetRequested,
                    targetPortSelected: resolution.targetSelected,
                    targetDowngradeReason: resolution.targetDowngradeReason,
                    lockedPortViolations: resolution.lockedViolations,
                    portRuleKey: rule.scenarioKey,
                    portRuleElbowYPolicy: rule.elbowYPolicy,
                    selectedGeometryMode,
                    debugSnapshot: errorSnapshot,
                },
                corridorReason: `channel=${channel} (${channel === 0 ? 'PRIMARY' : channel < 0 ? 'TOP' : 'BOTTOM'}) | routing-error`,
                provenance: `scenario=${scenario.scenarioKey} | channel=${channel} | geoMode=${selectedGeometryMode ?? 'none'} | routing-error=${errorMessage}`,
                labelAnchor: { x: source.x ?? 0, y: source.y ?? 0 },
                labelPosition: 'center',
            };
        }
        const why = buildRouteWhyPacket(scenario, resolution, geometry, rule.elbowYPolicy, scenario.scenarioKey);
        const diagnosticsV2 = buildRoutingDiagnosticsV2(scenario, resolution, geometry, rule, channel);
        const debugSnapshot = options.debugRoutingSnapshots !== false
            ? this.buildDebugSnapshot(edge, scenario.scenarioKey, selectedGeometryMode ?? 'none', geometry.sourceAnchor.side, geometry.targetAnchor.side, { x: geometry.sourceAnchor.x, y: geometry.sourceAnchor.y }, { x: geometry.targetAnchor.x, y: geometry.targetAnchor.y }, context, geometry.waypoints, geometry.waypoints.length < 2 ? 'error' : 'ok', geometry.waypoints.length < 2
                ? 'Missing or degenerate waypoint sequence; edge is not renderable.'
                : undefined)
            : undefined;
        const actualChannel = determineRailTier(scenario.isLoopback, scenario.isSameLane, channel, Array.from(this.laneMap.values()).length);
        const railOffset = buildRailOffset(actualChannel, actualChannel, scenario.isLoopback, 20);
        const boundaryTokens = [];
        if (source.type === 'event' && source.isBoundary)
            boundaryTokens.push(`source=${source.id}-inbound`);
        if (target.type === 'event' && target.isBoundary)
            boundaryTokens.push(`target=${target.id}-outbound`);
        if (selectedGeometryMode)
            boundaryTokens.push(`geoMode=${selectedGeometryMode}`);
        const provenance = buildProvenanceString(why, channel, [
            `nodeTypes=${source.type}→${target.type}`,
            `railTier=${railOffset.sourceRail.tier}`,
            `escapeMode=${railOffset.escapeMode}`,
            `connectors=${geometry.sourceAnchor.side}→${geometry.targetAnchor.side}`,
            `loopbackStyle=${context.loopbackStyle}`,
            `elbow=${geometry.description}`,
            ...boundaryTokens,
        ]);
        const usedOverride = Boolean(options.channelOverrides &&
            Object.prototype.hasOwnProperty.call(options.channelOverrides, edge.id));
        return {
            id: `route-${edge.id}`,
            channel,
            waypoints: geometry.waypoints,
            scenario: scenario.scenarioKey,
            pattern: geometry.bendType,
            policies: scenario.appliedPolicies,
            // The routing TYPE CODE describes the resulting shape (what the user
            // sees), not which algorithm produced it — those can diverge when an
            // algorithm picked for the general case (e.g. "h-first" for a
            // decision's fan-out) happens to collapse to a straight line for this
            // specific edge because its endpoints align. geometry.bendType (used
            // above for `pattern`/diagnostics) correctly keeps recording which
            // algorithm ran; only the classification fed to deriveRoutingTypeCode
            // needs to reflect the actual waypoints.
            routingType: deriveRoutingTypeCode(isStraightPolyline(geometry.waypoints) ? 'straight' : geometry.bendType, geometry.sourceAnchor.side, geometry.targetAnchor.side, rule.elbowYPolicy, scenario.scenarioKey, channel, edge.source === edge.target).code,
            preferences: {
                loopbackStyle: context.loopbackStyle,
                edgeChannelStrategy: context.edgeChannelStrategy,
                channelDensityMode: options.channelDensityMode ?? 'auto',
                channelSource: usedOverride ? 'allocator-override' : 'router-default',
                sourceAnchor: geometry.sourceAnchor.side,
                targetAnchor: geometry.targetAnchor.side,
                sourcePortRequested: resolution.sourceRequested,
                sourcePortSelected: resolution.sourceSelected,
                sourceDowngradeReason: resolution.sourceDowngradeReason,
                targetPortRequested: resolution.targetRequested,
                targetPortSelected: resolution.targetSelected,
                targetDowngradeReason: resolution.targetDowngradeReason,
                lockedPortViolations: resolution.lockedViolations,
                portRuleKey: rule.scenarioKey,
                portRuleElbowYPolicy: rule.elbowYPolicy,
                hardSideContractCorrected: geometry.hardSideContractCorrected,
                sourceConnectorId: geometry.sourceAnchor.side,
                targetConnectorId: geometry.targetAnchor.side,
                bendType: geometry.bendType,
                selectedGeometryMode,
                whyPacket: why,
                diagnosticsV2,
                debugSnapshot,
            },
            corridorReason: `channel=${channel} (${channel === 0 ? 'PRIMARY' : channel < 0 ? 'TOP' : 'BOTTOM'}) | ports=${resolution.sourceSelected}→${resolution.targetSelected}`,
            provenance,
            labelAnchor: selectLabelAnchor(geometry.waypoints),
            labelPosition: 'center',
        };
    }
    resolveEdgeChannel(edgeId, source, target, options) {
        if (options.channelOverrides &&
            Object.prototype.hasOwnProperty.call(options.channelOverrides, edgeId)) {
            return options.channelOverrides[edgeId];
        }
        return selectEdgeChannel(source, target, this.laneMap);
    }
    buildDebugSnapshot(edge, scenarioKey, geometryMode, srcSide, tgtSide, srcAnchor, tgtAnchor, context, waypoints, status = 'ok', errorMessage) {
        return {
            edgeId: edge.id,
            fromNodeId: edge.source,
            toNodeId: edge.target,
            scenario: scenarioKey,
            geometryMode,
            srcPortSide: srcSide,
            tgtPortSide: tgtSide,
            srcAnchor,
            tgtAnchor,
            sourceLane: context.sourceLane
                ? {
                    id: context.sourceLane.id,
                    y: context.sourceLane.y,
                    height: context.sourceLane.height,
                }
                : undefined,
            targetLane: context.targetLane
                ? {
                    id: context.targetLane.id,
                    y: context.targetLane.y,
                    height: context.targetLane.height,
                }
                : undefined,
            waypoints,
            status,
            errorMessage,
        };
    }
}
function selectEdgeChannel(source, target, laneMap) {
    if (!source.laneId || !target.laneId)
        return 0;
    const laneOrder = Array.from(laneMap.values())
        .slice()
        .sort((a, b) => a.y - b.y)
        .map((l) => l.id);
    const srcIdx = laneOrder.indexOf(source.laneId);
    const tgtIdx = laneOrder.indexOf(target.laneId);
    if (srcIdx < 0 || tgtIdx < 0)
        return 0;
    const delta = tgtIdx - srcIdx;
    if (delta === 0) {
        const srcDepth = source.depth ?? 0;
        const tgtDepth = target.depth ?? 0;
        return tgtDepth < srcDepth ? -1 : 0;
    }
    return delta;
}
function selectLabelAnchor(waypoints) {
    if (waypoints.length === 0)
        return { x: 0, y: 0 };
    let longestIdx = 0;
    let longestLen = 0;
    for (let i = 1; i < waypoints.length; i++) {
        const len = distance(waypoints[i - 1], waypoints[i]);
        if (len > longestLen) {
            longestLen = len;
            longestIdx = i;
        }
    }
    const start = waypoints[longestIdx - 1];
    const end = waypoints[longestIdx];
    return midpoint(start, end);
}
function createPathRouter(nodes, lanes) {
    return new PathRouter(nodes, lanes);
}
export function routeAllEdges(edges, nodes, lanes, options = {}) {
    // Build neighborhood context from the full edge set.
    const inDegreeMap = new Map();
    const outDegreeMap = new Map();
    const outTargetLaneIdsMap = new Map();
    const nodeMap = buildById(nodes);
    for (const edge of edges) {
        outDegreeMap.set(edge.source, (outDegreeMap.get(edge.source) ?? 0) + 1);
        inDegreeMap.set(edge.target, (inDegreeMap.get(edge.target) ?? 0) + 1);
        const targetLaneId = nodeMap.get(edge.target)?.laneId;
        const laneList = outTargetLaneIdsMap.get(edge.source) ?? [];
        if (targetLaneId) {
            laneList.push(targetLaneId);
            outTargetLaneIdsMap.set(edge.source, laneList);
        }
    }
    for (const [sourceId, laneIds] of outTargetLaneIdsMap.entries()) {
        const uniqueSorted = Array.from(new Set(laneIds)).sort((a, b) => a.localeCompare(b));
        outTargetLaneIdsMap.set(sourceId, uniqueSorted);
    }
    const optionsWithContext = {
        ...options,
        neighborhoodContext: { inDegreeMap, outDegreeMap, outTargetLaneIdsMap },
    };
    const router = createPathRouter(nodes, lanes);
    let routedEdges = edges.map((edge) => {
        const routing = router.routeEdge(edge, optionsWithContext);
        return { ...edge, routing: routing ?? undefined };
    });
    // Bundle world evaluation — score sibling groups and apply best candidate routing.
    // Build a background waypoints map from all initially-routed edges so the evaluator
    // can detect cross-bundle crossings (not just crossings within each bundle).
    const routingNodeMap = buildById(nodes);
    const laneMap = new Map(lanes.map((l) => [l.id, l]));
    const bundles = buildBundleWindows(routedEdges, routingNodeMap);
    if (bundles.length > 0) {
        const backgroundWaypointsByEdgeId = new Map(routedEdges
            .filter((e) => (e.routing?.waypoints?.length ?? 0) >= 2)
            .map((e) => [e.id, e.routing.waypoints]));
        const { updatedEdges, bundleResults } = evaluateAndApplyBundlesWithResults(routedEdges, bundles, routingNodeMap, laneMap, backgroundWaypointsByEdgeId);
        routedEdges = updatedEdges;
        for (const result of bundleResults) {
            for (const edge of result.updatedEdges) {
                const idx = routedEdges.findIndex((e) => e.id === edge.id);
                if (idx >= 0 && routedEdges[idx].routing?.preferences?.diagnosticsV2) {
                    applyBundleResultToDiagnostics(routedEdges[idx].routing.preferences.diagnosticsV2, result);
                }
            }
        }
    }
    // Phase 4: parallel-offset second pass.
    // After bundle evaluation has settled waypoints, detect any edges whose path
    // still overlaps another edge's path. Re-route only those edges using their
    // parallel-offset alternate (if one is defined in the rules table).
    if (optionsWithContext.routingRules?.length) {
        const stackedIds = detectStackedEdges(routedEdges);
        if (stackedIds.size > 0) {
            const secondPassOptions = {
                ...optionsWithContext,
                parallelOffsetEdgeIds: stackedIds,
            };
            routedEdges = routedEdges.map((edge) => {
                if (!stackedIds.has(edge.id))
                    return edge;
                const routing = router.routeEdge(edge, secondPassOptions);
                if (!routing || routing.waypoints.length === 0)
                    return edge;
                return {
                    ...edge,
                    routing: {
                        ...routing,
                        preferences: { ...routing.preferences, parallelOffsetApplied: true },
                    },
                };
            });
        }
    }
    return routedEdges;
}
// ---------------------------------------------------------------------------
// Mapping helpers — scenarioKey and node type to rule dimension types.
// These live here because they translate engine-internal concepts to the
// admin rule vocabulary. One definition, used only in pathRouter.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Rules table helpers — all logic touching RoutingRuleDefinition lives here
// ---------------------------------------------------------------------------
/**
 * Given a matched admin rule and an optional active condition, returns the
 * PortAssignmentRule to use. Compact-mode picks the first compact alternate
 * before resolution. Other conditions are evaluated post-resolution.
 */
function resolveAdminTypeCode(rule, activeCondition) {
    if (activeCondition) {
        const alt = rule.alternates
            .filter(a => a.condition === activeCondition)
            .sort((a, b) => a.priority - b.priority)[0];
        if (alt)
            return codeToPortRule(alt.type);
    }
    return codeToPortRule(rule.primary);
}
/**
 * Returns true when the primary port resolution was significantly blocked —
 * a locked port violated or the primary preferred port was downgraded.
 */
function portWasBlocked(resolution) {
    return (resolution.lockedViolations.length > 0 ||
        resolution.sourceDowngradeReason !== undefined ||
        resolution.targetDowngradeReason !== undefined);
}
/**
 * Tries each path-blocked alternate in priority order. Returns the first
 * PortAssignmentResult whose port resolution is clean (no downgrades),
 * or null if all alternates are also blocked.
 */
function tryAlternates(alternates, condition, scenarioKey, source, target, context, crossLaneContext, flowLayerBias) {
    const candidates = alternates
        .filter(a => a.condition === condition)
        .sort((a, b) => a.priority - b.priority);
    for (const alt of candidates) {
        const portRule = codeToPortRule(alt.type);
        if (!portRule)
            continue;
        const result = resolvePortAssignment(scenarioKey, source, target, context, crossLaneContext, undefined, flowLayerBias, portRule);
        if (!portWasBlocked(result.resolution))
            return result;
    }
    return null;
}
function nodeTypeToRuleType(type) {
    switch (type) {
        case 'task': return 'task';
        case 'event': return 'event';
        case 'decision':
        case 'route':
        case 'gateway': return 'gateway';
        case 'annotation': return 'annotation';
        case 'subprocess': return 'subprocess';
        default: return '*';
    }
}
function scenarioKeyToLaneConfig(scenarioKey) {
    if (scenarioKey === 'self-loop')
        return 'self-loop';
    if (scenarioKey.includes('loopback'))
        return 'loopback';
    if (scenarioKey === 'cross-lane-downward')
        return 'cross-lane-downward';
    if (scenarioKey === 'cross-lane-upward')
        return 'cross-lane-upward';
    // same-lane-straight, same-lane-elbow, decision-split-*, fan-in-join,
    // boundary-* all stay within the same lane from a rules perspective.
    return 'same-lane';
}
