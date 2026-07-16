/**
 * Layout Type Definitions
 *
 * Comprehensive type system for process layout computation,
 * routing contracts, and rendering output.
 */
import { deepMerge } from '../deepMerge';
import { CONTINUITY_ELIGIBLE_NODE_KINDS } from '../nodeKinds';
export const SPATIAL_NEGOTIATION_INVARIANTS = {
    maxNodeDeltaPx: 16,
    maxAffectedNodesPerWindow: 3,
    allowedAdjustmentAxes: ['x'],
    allowRankMutation: false,
    allowLaneMutation: false,
    allowTopologyMutation: false,
    requireDeterministicOutput: true,
    envelopeSaturationNudgePx: 8,
};
export const CONTINUITY_ELIGIBLE_TYPES = new Set(CONTINUITY_ELIGIBLE_NODE_KINDS);
export function computeLaneDirection(source, target, laneMap) {
    if (source.laneId === target.laneId)
        return 'same';
    const laneOrder = Array.from(laneMap.values())
        .slice()
        .sort((a, b) => a.y - b.y)
        .map((l) => l.id);
    const srcIdx = laneOrder.indexOf(source.laneId ?? '');
    const tgtIdx = laneOrder.indexOf(target.laneId ?? '');
    if (srcIdx < 0 || tgtIdx < 0)
        return 'downward';
    return tgtIdx > srcIdx ? 'downward' : 'upward';
}
// ============================================================================
// NODE LAYOUT STATE
// ============================================================================
/** Lane id for nodes with no `app` reference, in 'byApp' lane mode. */
export const UNASSIGNED_APP_LANE_ID = '__unassigned_app__';
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
export function createLayoutSettings(overrides) {
    const defaults = {
        densityMode: 'standard',
        canvas: {
            width: 1200,
            height: 700,
        },
        spacing: {
            nodeGap: 30,
            laneGap: 4,
            laneGapTop: 0,
            laneGapBottom: 4,
            lanePaddingTop: 8,
            lanePaddingBottom: 8,
            channelSpacing: 16,
            canvasPaddingX: 60,
            canvasPaddingY: 24,
        },
        sizing: {
            minNodeWidth: 80,
            minNodeHeight: 46,
            maxNodeWidth: 180,
            maxNodeHeight: 70,
            activitySizingMode: 'standard',
            standardActivityWidth: 100,
            fitActivityMinWidth: 56,
            fitActivityMaxWidth: 160,
            fitActivityWidthStep: 8,
            minLaneHeight: 0,
        },
        routing: {
            loopbackEscapeMode: 'in-lane',
            edgeChannelStrategy: 'follow-node',
            channelDensityMode: 'auto',
            crossLaneLaneTopBufferPx: 20,
            horizontalConnectionsOnly: false,
            autoRelocateToAvoidOverlap: false,
            decisionLaneAffinity: {
                mode: 'advisory',
                minDominantOutgoingRatio: 0.6,
                minOutgoingEdges: 2,
            },
            visibilityMode: 'default',
            revealGroups: [],
            protectedStructures: {
                preservePrimarySpine: true,
                preserveDecisionSymmetry: true,
                preserveParallelLanes: true,
            },
        },
        laneConsensus: {
            successorWeight: 0.5,
        },
        layout: {
            laneMode: 'standard',
            slotOrdering: 'chainIndex',
            keyFlowStrategy: 'longestPath',
            showLanes: true,
            showMetaIcons: true,
        },
        quality: {
            bendPenalty: 0.05,
            crossingPenalty: 0.1,
            collisionPenalty: 0.2,
        },
        heuristics: {
            stackingTolerancePx: 5,
            eventSize: 32,
            boundaryBandGapPx: 32,
            curtainZoneExtraOffsetPx: 32,
            laneSpaciousFactor: 0.25,
            continuityTolerancePx: 1,
            mixedRelayHorizontalMinOffsetPx: 24,
            mixedRelayVerticalMinGapPx: 24,
            decisionSize: 28,
            taskHeight: 54,
            estimatedCharWidth: 5.8,
            decisionCharWidth: 8,
            textPaddingX: 12,
            decisionTextPaddingX: 40,
        },
        canvasConfig: {
            laneHeaderHeight: 18,
            baseCurtainWidth: 72,
            curtainPadding: 32,
            visualBoundsPadding: 20,
            labelContainerWidth: 120,
            colors: {
                event: { fill: '#dbeafe', stroke: '#2563eb', label: '#0f172a' },
                decision: { fill: '#fef3c7', stroke: '#d97706', label: '#1f2937' },
                subprocess: { fill: '#fce7f3', stroke: '#db2777', label: '#1f2937' },
                task: { fill: '#dcfce7', stroke: '#059669', label: '#0f172a' },
                edge: {
                    loopbackMain: '#c2410c',
                    loopbackSec: '#ea580c',
                    up: '#2563eb',
                    down: '#0f766e',
                    default: '#334155'
                }
            }
        },
        viewport: {
            fitMarginPx: 32,
            fitMaxZoom: 1.5,
            zoomStep: 0.1,
            zoomMin: 0.1,
            zoomMax: 3,
        },
    };
    const resolvedSettings = deepMerge(defaults, overrides);
    // deepMerge replaces arrays wholesale rather than merging them; re-apply the
    // string-only guard the old hand-written merge had for this field.
    resolvedSettings.routing.revealGroups = resolvedSettings.routing.revealGroups.filter((group) => typeof group === 'string');
    if (resolvedSettings.densityMode === 'compact') {
        resolvedSettings.spacing = {
            ...resolvedSettings.spacing,
            nodeGap: Math.min(resolvedSettings.spacing.nodeGap, 20),
            laneGap: Math.min(resolvedSettings.spacing.laneGap, 2),
            laneGapTop: Math.min(resolvedSettings.spacing.laneGapTop, 2),
            laneGapBottom: Math.min(resolvedSettings.spacing.laneGapBottom, 2),
            lanePaddingTop: Math.min(resolvedSettings.spacing.lanePaddingTop, 4),
            lanePaddingBottom: Math.min(resolvedSettings.spacing.lanePaddingBottom, 4),
            channelSpacing: Math.min(resolvedSettings.spacing.channelSpacing, 8),
        };
        resolvedSettings.sizing = {
            ...resolvedSettings.sizing,
            standardActivityWidth: Math.min(resolvedSettings.sizing.standardActivityWidth, 84),
            fitActivityMinWidth: Math.min(resolvedSettings.sizing.fitActivityMinWidth, 48),
            fitActivityMaxWidth: Math.min(resolvedSettings.sizing.fitActivityMaxWidth, 136),
            maxNodeWidth: Math.min(resolvedSettings.sizing.maxNodeWidth, 152),
        };
    }
    return resolvedSettings;
}
/** Canonical defaults — reference this instead of re-declaring literal fallbacks elsewhere. */
export const DEFAULT_LAYOUT_SETTINGS = createLayoutSettings();
export function createEmptyLayoutState(groupingStrategy, settings) {
    return {
        nodes: [],
        edges: [],
        lanes: [],
        chains: [],
        stageName: 'ingest',
        stageHistory: [],
        provenanceLog: [],
        totalBounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
        settings: settings || createLayoutSettings(),
        groupingStrategy,
        diagnostics: {
            health: {
                totalNodes: 0,
                totalEdges: 0,
                cyclesDetected: 0,
                unreachableNodes: 0,
                overlappingNodes: [],
                routingQuality: 1,
            },
            boundaryPlacementLogs: [],
            routingProvenance: [],
            stageHistory: [],
            currentStage: 'ingest',
            provenanceLog: [],
            warnings: [],
            errors: [],
        },
    };
}
