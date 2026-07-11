/**
 * Process Layout Orchestrator
 *
 * Four-phase pipeline that transforms a normalized process graph into a fully
 * positioned and routed layout result.
 *
 * Phase A — Graph:    ingest → rank → key-flow → chain detection
 * Phase B — Geometry: lane geometry → depth folding → coordinates → gateway → spatial negotiation
 * Phase C — Routing:  channel allocation → lane expansion → edge routing
 * Phase D — Analysis: convergence metrics → diagnostics → bounds finalization
 */
import { createLayoutSettings, createEmptyLayoutState, } from './layoutTypes';
import { buildLayoutDiagnostics } from './layoutResultDiagnostics';
import { routeAllEdges } from '../routing/pathRouter';
import { allocateChannels } from './channelAllocation';
import { runConvergenceLoop } from './convergenceLoop';
import { appendStageReport, assertChannelStageContracts, assertCoordinateStageContracts, assertRoutingStageContractsWithNodes, } from './stageContractAssertions';
import { applyGatewayPlacementHeuristics } from './gatewayPlacement';
import { evaluateBoundedSpatialOpportunities, DEFAULT_SPATIAL_SETTINGS, } from './spatialNegotiation';
import { measureNodeDimensions, effectiveSize } from './elementSizing';
import { runPreCoordinateStages } from './preCoordinate';
import { computeLaneGeometry, applyDepthFolding } from './laneGeometry';
import { assignNodeSlotsWithinLaneDepth, recomputeTotalBounds, preReserveCorridorSpace } from './coordinateAssignment';
import { applyLaneDensityPolicy, updateLaneActiveChannels, expandLanesForRoutingChannels, applyContinuityAlignmentLocks, applyMixedRelayXLocks, resolveLoopbackStyle, } from './routingPost';
import { resolveEdgeCrossings } from './crossingResolution';
import { recordStage } from './stageHelpers';
import { isVirtualLaneMode, normalizeForVirtualLanes } from './virtualLane';
import { resolveGroupingStrategy } from './groupingStrategy';
import { getNodeDirection, isBoundaryBandDirection, isEventNodeKind } from '../nodeKinds';
// ============================================================================
// PUBLIC ENTRY POINT
// ============================================================================
export function computeProcessLayout(graph, settingOverrides) {
    const graphResult = runGraphPhase(graph, settingOverrides);
    const geoResult = runGeometryPhase(graphResult);
    const routingResult = runRoutingPhase(geoResult);
    return runAnalysisPhase(routingResult);
}
// ============================================================================
// PHASE A — GRAPH
// Reads:  NormalizedProcessGraph, settingOverrides
// Writes: nodes (depth, chainId, chainIndex), edges, lanes (initial height),
//         chains, diagnostics (health, back-edges, unreachable)
// ============================================================================
function runGraphPhase(graph, settingOverrides) {
    let state = buildInitialState(graph, settingOverrides);
    state = runPreCoordinateStages(state, graph);
    return state;
}
// ============================================================================
// PHASE B — GEOMETRY
// Reads:  GraphPhaseResult (nodes with depth+chain, lanes, settings)
// Writes: nodes (x, y, laneId), lanes (x, y, width, height after density policy),
//         gateway envelopes (captured in node metadata), spatial nudges applied
//
// node.y and lane.y/height are NOT settled by the end of this phase — see
// phaseContract.ts NODE_FIELD_OWNERSHIP.y / LANE_FIELD_OWNERSHIP.y/height for
// the disclosed C-routing handoffs (channel-driven lane expansion, continuity
// alignment) that revise them before edge routing runs.
// ============================================================================
function runGeometryPhase(input) {
    let state = input;
    const isVirtual = isVirtualLaneMode(state.settings);
    if (!isVirtual) {
        recordStage(state, 'lane-geometry');
        state = computeLaneGeometry(state);
        recordStage(state, 'depth-folding');
        state = applyDepthFolding(state);
    }
    recordStage(state, 'lane-density-policy');
    applyLaneDensityPolicy(state);
    recordStage(state, 'coordinate-assignment');
    state = assignNodeSlotsWithinLaneDepth(state);
    appendStageReport(state.diagnostics, assertCoordinateStageContracts(state.nodes));
    recordStage(state, 'gateway-placement');
    const gatewayEnvelopes = applyGatewayPlacementHeuristics(state);
    recordStage(state, 'spatial-negotiation');
    const spatialResult = evaluateBoundedSpatialOpportunities(state.nodes, state.edges, new Map(state.lanes.map((l) => [l.id, l])), gatewayEnvelopes, DEFAULT_SPATIAL_SETTINGS);
    if (spatialResult.acceptedAdjustments.length > 0) {
        state.diagnostics.provenanceLog?.push(`SpatialNegotiation: ${spatialResult.acceptedAdjustments.length} adjustments accepted, ` +
            `${spatialResult.rejectedProposals.length} rejected, ` +
            `${spatialResult.windowDiagnostics.filter((w) => w.triggered).length}/${spatialResult.windowDiagnostics.length} windows triggered`);
    }
    else if (spatialResult.skipped) {
        state.diagnostics.provenanceLog?.push(`SpatialNegotiation: skipped (${spatialResult.skipReason})`);
    }
    applyMixedRelayXLocks(state);
    if (!isVirtual) {
        recordStage(state, 'corridor-pre-reservation');
        preReserveCorridorSpace(state);
    }
    return state;
}
// ============================================================================
// PHASE C — ROUTING
// Reads:  GeometryPhaseResult (positioned nodes + lanes)
// Writes: edges (routing.waypoints, scenario, channel), lane.activeChannels,
//         lane heights expanded for channels, continuity locks applied
//
// The channel-expansion and continuity-alignment steps below also revise
// node.y and lane.y/height — disclosed B-geometry handoffs, not an
// undisclosed ownership violation; see phaseContract.ts.
// ============================================================================
function runRoutingPhase(input) {
    let state = input;
    recordStage(state, 'channel-allocation');
    const allocation = allocateChannels(state.edges, state.nodes, state.lanes, state.settings);
    const channelOverrides = Object.fromEntries(allocation.edgeChannels.entries());
    appendStageReport(state.diagnostics, assertChannelStageContracts(state.edges, channelOverrides));
    updateLaneActiveChannels(state, allocation.edgeChannels);
    state.diagnostics.routingMetrics = {
        straightnessScore: 1,
        edgeCrossings: 0,
        totalElbows: 0,
        degenerateElbows: 0,
        maxChannelTier: allocation.stats.maxTier,
        allocatedEdges: allocation.stats.allocatedEdges,
    };
    if (allocation.stats.maxTier > 3) {
        state.diagnostics.warnings.push(`Routing channel tier reached ${allocation.stats.maxTier}; consider lane compaction.`);
    }
    recordStage(state, 'lane-channel-expansion');
    expandLanesForRoutingChannels(state);
    applyContinuityAlignmentLocks(state);
    recordStage(state, 'routing');
    state.edges = routeAllEdges(state.edges, state.nodes, state.lanes, {
        loopbackStyle: resolveLoopbackStyle(state.settings.routing.loopbackEscapeMode),
        edgeChannelStrategy: state.settings.routing.edgeChannelStrategy,
        channelDensityMode: state.settings.routing.channelDensityMode,
        crossLaneLaneTopBufferPx: state.settings.routing.crossLaneLaneTopBufferPx,
        horizontalConnectionsOnly: state.settings.routing.horizontalConnectionsOnly,
        channelOverrides,
        stackingTolerancePx: state.settings.heuristics.stackingTolerancePx,
        patternTable: state.settings.routing.patternTable,
        routingRules: state.settings.routing.routingRules,
        compactMode: state.settings.routing.compactMode,
    }).map((e) => ({ ...e, routing: e.routing }));
    appendStageReport(state.diagnostics, assertRoutingStageContractsWithNodes(state.edges, state.nodes));
    recordStage(state, 'crossing-resolution');
    resolveEdgeCrossings(state);
    return state;
}
// ============================================================================
// PHASE D — ANALYSIS
// Reads:  RoutingPhaseResult (routed edges)
// Writes: convergenceMetrics, routingMetrics, warnings, LayoutResult
// No node/edge/lane mutation after this point.
// ============================================================================
function runAnalysisPhase(input) {
    const state = input;
    recordStage(state, 'convergence-analysis');
    const convergence = runConvergenceLoop(state.edges, 5);
    const lastPass = convergence.passes[convergence.passes.length - 1];
    state.diagnostics.convergenceMetrics = {
        converged: convergence.converged,
        passCount: convergence.passes.length,
        passes: convergence.passes.map((p) => ({
            iteration: p.iteration,
            totalElbows: p.totalElbows,
            degenerateElbows: p.degenerateElbows,
            edgeCrossings: p.edgeCrossings,
            straightnessScore: p.straightnessScore,
            deltaElbows: p.deltaElbows,
            deltaCrossings: p.deltaCrossings,
            deltaStraightness: p.deltaStraightness,
        })),
    };
    if (lastPass) {
        state.diagnostics.routingMetrics = {
            ...(state.diagnostics.routingMetrics ?? {
                straightnessScore: 1,
                edgeCrossings: 0,
                totalElbows: 0,
                degenerateElbows: 0,
            }),
            straightnessScore: lastPass.straightnessScore,
            edgeCrossings: lastPass.edgeCrossings,
            totalElbows: lastPass.totalElbows,
            degenerateElbows: lastPass.degenerateElbows,
        };
        if (lastPass.edgeCrossings > 0) {
            state.diagnostics.warnings.push(`Routing analysis detected ${lastPass.edgeCrossings} edge crossing(s).`);
        }
        if (lastPass.straightnessScore < 0.5) {
            state.diagnostics.warnings.push(`Routing straightness score is low (${lastPass.straightnessScore.toFixed(2)}).`);
        }
        if (!convergence.converged) {
            state.diagnostics.warnings.push('Convergence analysis reached max passes without full reduction of degenerate elbows.');
        }
    }
    recordStage(state, 'finalize');
    recomputeTotalBounds(state);
    return {
        nodes: state.nodes,
        edges: state.edges,
        lanes: state.lanes,
        bounds: {
            x: state.totalBounds.minX,
            y: state.totalBounds.minY,
            width: state.totalBounds.maxX - state.totalBounds.minX,
            height: state.totalBounds.maxY - state.totalBounds.minY,
        },
        diagnostics: buildLayoutDiagnostics(state),
        settings: state.settings,
    };
}
// ============================================================================
// INITIAL STATE CONSTRUCTION (Phase A helper)
// ============================================================================
function buildInitialState(graph, settingOverrides) {
    const settings = createLayoutSettings(settingOverrides);
    const groupingStrategy = resolveGroupingStrategy(settings.layout.laneMode);
    const state = createEmptyLayoutState(groupingStrategy, settings);
    recordStage(state, 'ingest');
    state.nodes = graph.nodes.map((n) => {
        const dimensions = measureNodeDimensions(n.type, n.label || '', settings);
        return {
            id: n.id,
            type: n.type,
            label: n.label || '',
            width: dimensions.width,
            height: dimensions.height,
            layoutWidth: dimensions.layoutWidth,
            layoutHeight: dimensions.layoutHeight,
            actor: n.actor,
            isBoundary: Boolean(n.isBoundary),
            metadata: {
                ...(n.metadata || {}),
                scope: n.scope,
                direction: n.direction,
                eventType: n.eventType,
                taskType: n.taskType,
                outcomes: n.outcomes,
                gatewayKind: n.gatewayKind,
            },
            sourceRange: n.sourceRange,
        };
    });
    state.edges = graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        condition: e.condition,
        flowLayer: e.flowLayer,
        semanticRole: e.semanticRole,
        keyFlow: e.keyFlow,
        loop: e.loop,
        visibilityDefault: e.visibilityDefault,
        revealGroup: e.revealGroup,
        narrative: e.narrative,
        sourceRange: e.sourceRange,
    }));
    state.lanes = groupingStrategy.buildLanes(state, graph);
    if (isVirtualLaneMode(settings)) {
        normalizeForVirtualLanes(state);
    }
    let laneY = settings.spacing.laneGapTop;
    for (let i = 0; i < state.lanes.length; i++) {
        state.lanes[i].y = laneY;
        laneY += state.lanes[i].height + (i < state.lanes.length - 1 ? settings.spacing.laneGap : settings.spacing.laneGapBottom);
    }
    // Pre-compute boundary band gap from label widths.
    const CURTAIN_LANE_GAP = 10;
    const boundaryNodes = state.nodes.filter((n) => isEventNodeKind(n.type) && isBoundaryBandDirection(getNodeDirection(n)));
    if (boundaryNodes.length > 0) {
        const maxLabelWidth = Math.max(...boundaryNodes.map((n) => n.label.length * settings.heuristics.estimatedCharWidth + settings.heuristics.textPaddingX));
        const maxEventHalfWidth = Math.max(...boundaryNodes.map((n) => effectiveSize(n).width / 2));
        const requiredBoundaryBandGap = Math.ceil(maxLabelWidth / 2 - maxEventHalfWidth + CURTAIN_LANE_GAP);
        state.settings.heuristics.boundaryBandGapPx = Math.max(settings.heuristics.boundaryBandGapPx, requiredBoundaryBandGap);
    }
    return state;
}
