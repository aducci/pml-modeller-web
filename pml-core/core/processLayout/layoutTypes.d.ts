/**
 * Layout Type Definitions
 *
 * Comprehensive type system for process layout computation,
 * routing contracts, and rendering output.
 */
import { NormalizedNode, NormalizedProcessGraph, FlowLayer, SemanticRole } from '../normalizedGraph';
import type { ProcessDiagnostic } from '../diagnostics';
import type { RoutingTypeCode } from '../routing/routingRuleDefinition';
export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface Point {
    x: number;
    y: number;
}
export type PortSide = 'top' | 'bottom' | 'left' | 'right' | 'auto';
export type ConcretePortSide = Exclude<PortSide, 'auto'>;
export type PortHardness = 'locked' | 'preferred' | 'fallback';
export type SegmentLeadDirection = 'horizontal-first' | 'vertical-first' | 'straight';
export type CrossLaneGeometryMode = 'cross-up-r_to_l-buffer-rail-drop' | 'cross-up-r_to_l-top-exit' | 'cross-down-r_to_l-buffer-rail-rise' | 'cross-down-b_to_l-buffer-rail-rise';
export type ElbowYPolicy = 'matchTargetConnectionY' | 'matchSourceConnectionY' | 'midpointY' | 'channelY' | 'fixed';
export interface PortPreference {
    side: PortSide;
    hardness: PortHardness;
}
export interface CrossLaneAlignmentContext {
    xOverlapPx: number;
    xCenterDeltaPx: number;
    straightClearPx: number;
    laneGapPx: number;
}
export interface PortAssignmentRule {
    scenarioKey: string;
    sourcePortPriority: PortPreference[];
    targetPortPriority: PortPreference[];
    firstSegmentDirection: SegmentLeadDirection;
    exitBufferPx: number;
    entryBufferPx: number;
    elbowYPolicy: ElbowYPolicy;
    elbowYFixedValue?: number;
    geometryModePreference?: CrossLaneGeometryMode[];
    straightDownAlignmentThresholdPx?: number;
    labelAffinityHint?: 'nearSource' | 'nearTarget' | 'midSegment' | 'firstBend';
}
export declare const SPATIAL_NEGOTIATION_INVARIANTS: {
    readonly maxNodeDeltaPx: 16;
    readonly maxAffectedNodesPerWindow: 3;
    readonly allowedAdjustmentAxes: readonly ["x"];
    readonly allowRankMutation: false;
    readonly allowLaneMutation: false;
    readonly allowTopologyMutation: false;
    readonly requireDeterministicOutput: true;
    readonly envelopeSaturationNudgePx: 8;
};
export declare const CONTINUITY_ELIGIBLE_TYPES: Set<"event" | "task" | "decision" | "subprocess">;
export declare function computeLaneDirection(source: LayoutNode, target: LayoutNode, laneMap: Map<string, Lane>): 'same' | 'downward' | 'upward';
export interface WorldScore {
    geometry: {
        crossingCount: number;
        bendCount: number;
        spacingScore: number;
        displacementScore: number;
    };
    perceptual: {
        symmetryScore: number;
        parallelismScore: number;
        corridorContinuityScore: number;
        visualNoiseScore: number;
        edgeRhythmScore: number;
    };
    coherence: {
        patternAffinityScore: number;
        stabilityScore: number;
    };
    semanticFit: {
        semanticRoleFitScore: number;
        flowLayerAppropriatenessScore: number;
    };
}
export interface ScoringWeights {
    geometry: {
        bendWeight: number;
        crossingWeight: number;
        spacingWeight: number;
        displacementWeight: number;
    };
    perceptual: {
        symmetryWeight: number;
        parallelismWeight: number;
        corridorContinuityWeight: number;
        visualNoiseWeight: number;
        edgeRhythmWeight: number;
    };
    coherence: {
        patternAffinityWeight: number;
        stabilityWeight: number;
    };
    semanticFit: {
        semanticRoleFitWeight: number;
        flowLayerWeight: number;
    };
}
export interface Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}
/** Lane id for nodes with no `app` reference, in 'byApp' lane mode. */
export declare const UNASSIGNED_APP_LANE_ID = "__unassigned_app__";
export type LaneMode = 'standard' | 'virtual' | 'byApp';
/**
 * Single source of truth for how nodes are grouped into lanes. Every stage that
 * needs to know "what group does this node belong to" (ranking's cross-lane
 * penalty, lane geometry, lane consensus, diagnostics copy) reads it from here
 * instead of re-branching on `laneMode`. Resolved once in buildInitialState and
 * carried on LayoutState so it stays consistent across the whole pipeline.
 */
export interface GroupingStrategy {
    readonly id: LaneMode;
    /** The group key a node belongs to, or undefined if it has no explicit group. */
    groupKeyOf(node: {
        actor?: string;
        metadata?: Record<string, any>;
    }): string | undefined;
    /** Builds the initial Lane[] for this grouping mode. */
    buildLanes(state: LayoutState, graph: NormalizedProcessGraph): Lane[];
    /** Lane id nodes with no group key fall back to, if this mode has a dedicated one. */
    readonly unassignedLaneId?: string;
    /** User-facing noun phrase for convergence-suggestion copy, e.g. "adding explicit actor assignments". */
    readonly convergenceAdvice: string;
}
export interface LayoutNode {
    id: string;
    type: NormalizedNode['type'];
    label: string;
    x?: number;
    y?: number;
    width: number;
    height: number;
    layoutWidth?: number;
    layoutHeight?: number;
    depth?: number;
    laneId?: string;
    channel?: number;
    chainId?: string;
    chainIndex?: number;
    isBoundary?: boolean;
    actor?: string;
    metadata?: Record<string, any>;
    sourceRange?: {
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    };
}
export interface LayoutEdge {
    id: string;
    source: string;
    target: string;
    condition?: string;
    flowLayer?: FlowLayer;
    semanticRole?: SemanticRole;
    keyFlow?: boolean;
    loop?: boolean;
    visibilityDefault?: 'shown' | 'hidden';
    revealGroup?: string;
    narrative?: string;
    routing?: RoutingChannel;
    metadata?: Record<string, any>;
    sourceRange?: {
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    };
}
export interface Lane {
    id: string;
    actorId?: string;
    label?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    activeChannels: number[];
    channelDensityMode: 'spacious' | 'fit-to-lane' | 'auto';
    preReservedTopChannels?: number;
    preReservedBottomChannels?: number;
}
/** Identifies a routing rail (invisible lane for edge spacing) */
export type RailTier = 'PRIMARY' | `TOP_${number}` | `BOTTOM_${number}`;
/** Metadata about a specific routing rail */
export interface RailPosition {
    tier: RailTier;
    channel: number;
    offsetY: number;
    density: number;
    escapeToCorridor: boolean;
}
/** Offset for waypoint routing with rail assignment */
export interface RailOffset {
    sourceRail: RailPosition;
    targetRail: RailPosition;
    sourceOffsetY: number;
    targetOffsetY: number;
    escapeMode?: 'same-lane' | 'top-corridor' | 'bottom-corridor' | 'cross-lane';
}
export interface RoutingDebugEdgeSnapshot {
    edgeId: string;
    fromNodeId: string;
    toNodeId: string;
    scenario: string;
    geometryMode: string;
    srcPortSide: ConcretePortSide;
    tgtPortSide: ConcretePortSide;
    srcAnchor: Point;
    tgtAnchor: Point;
    sourceLane?: {
        id: string;
        y: number;
        height: number;
    };
    targetLane?: {
        id: string;
        y: number;
        height: number;
    };
    waypoints: Point[];
    status?: 'ok' | 'error';
    errorMessage?: string;
}
export interface RoutingChannelPreferences {
    [key: string]: any;
    whyPacket?: unknown;
    diagnosticsV2?: RoutingDiagnosticsV2;
    debugSnapshot?: RoutingDebugEdgeSnapshot;
}
export interface RoutingChannel {
    id: string;
    channel: number;
    waypoints: Point[];
    scenario?: string;
    pattern?: string;
    policies?: string[];
    provenance?: string;
    preferences?: RoutingChannelPreferences;
    corridorReason?: string;
    routingType?: RoutingTypeCode;
    labelAnchor?: Point;
    labelPosition?: 'top' | 'center' | 'bottom';
}
export interface FlowChain {
    id: string;
    nodeIds: string[];
    laneId?: string;
    isPrimary: boolean;
}
export interface RoutingPattern {
    id: string;
    name: string;
    sourceExitSide: 'top' | 'bottom' | 'left' | 'right' | 'any';
    targetEntrySide: 'top' | 'bottom' | 'left' | 'right' | 'any';
    bendCount: number;
    crossingRisk: number;
    spacingPreference: number;
    generateWaypoints(srcBounds: Rect, tgtBounds: Rect, context: RoutingContext): Point[];
}
export interface RoutingContext {
    sourceLane?: Lane;
    targetLane?: Lane;
    allLanes: Lane[];
    edgeChannel?: number;
    loopbackStyle?: 'edge-slot' | 'over-swimlane' | 'cross-lane';
    edgeChannelStrategy?: 'follow-node' | 'adaptive';
    horizontalConnectionsOnly?: boolean;
    /** Key: `${nodeId}:${side}`. Value: count of edges already assigned to that port side. */
    portSideEdgeCounts?: Map<string, number>;
    /** Key: `${nodeId}:${side}`. Set of port sides claimed by a locked port assignment. */
    lockedPortClaims?: Set<string>;
}
export interface RouteIntent {
    priority: 'main' | 'alternate' | 'background';
    visualRole: 'spine' | 'branch' | 'loopback' | 'exception';
    preserveStraightness: boolean;
    corridorAffinity?: string;
    flowLayer: FlowLayer;
    semanticRole: SemanticRole;
}
export interface RoutingConfidence {
    scenarioConfidence: number;
    patternFitConfidence: number;
    spatialCompromiseLevel: number;
    portDowngradeOccurred: boolean;
    elbowYPolicyApplied: ElbowYPolicy;
    flowLayerHonored: boolean;
}
export interface RoutingDiagnosticsV2 {
    scenarioKey: string;
    flowLayer: FlowLayer;
    semanticRole: SemanticRole;
    routeIntent: RouteIntent;
    portAssignment: {
        sourcePortSelected: ConcretePortSide;
        sourcePortRequested: PortSide;
        sourceDowngradeReason?: string;
        targetPortSelected: ConcretePortSide;
        targetPortRequested: PortSide;
        targetDowngradeReason?: string;
    };
    crossLaneGeometry?: {
        selectedMode: CrossLaneGeometryMode;
        modeCandidates: CrossLaneGeometryMode[];
        xCenterDeltaPx: number;
        alignmentThresholdPx: number;
        verticalStraightEligible: boolean;
    };
    elbowYResolved: number;
    elbowYPolicy: ElbowYPolicy;
    spatialAdjustmentsTested: Array<{
        id: string;
        delta: Record<string, number>;
        accepted: boolean;
        reason?: string;
    }>;
    evaluatedBundleCandidates: Array<{
        candidateId: string;
        geometryScore: number;
        perceptualScore: number;
        coherenceScore: number;
        semanticFitScore: number;
    }>;
    selectedWorldId?: string;
    confidence: RoutingConfidence;
    optimizationWindowId?: string;
}
export interface RoutingScenario {
    name: string;
    description: string;
    candidates: RoutingPattern[];
}
export interface LayoutState {
    nodes: LayoutNode[];
    edges: LayoutEdge[];
    lanes: Lane[];
    chains: FlowChain[];
    stageName: string;
    stageHistory: string[];
    provenanceLog: string[];
    determinismFingerprint?: string;
    totalBounds: Bounds;
    settings: LayoutSettings;
    groupingStrategy: GroupingStrategy;
    diagnostics: LayoutDiagnostics;
}
export type LayoutDensityMode = 'standard' | 'compact';
export type ActivitySizingMode = 'standard' | 'fit-to-text';
export interface LayoutSettings {
    densityMode: LayoutDensityMode;
    /**
     * Available canvas area — the layout engine distributes nodes to fill this.
     * Pass actual container pixel dimensions from ResizeObserver for best results.
     */
    canvas: {
        width: number;
        height: number;
    };
    spacing: {
        nodeGap: number;
        laneGap: number;
        /**
         * Extra vertical gap at the very top of the lane stack (above the first lane).
         * Defaults to 0 (collapses to laneGap when non-zero).
         */
        laneGapTop: number;
        /**
         * Extra vertical gap at the very bottom of the lane stack (below the last lane).
         * Defaults to 0 (collapses to laneGap when non-zero).
         */
        laneGapBottom: number;
        /**
         * Minimum internal top padding inside each lane body (above the node row).
         * Defaults to 0; combined with lanePaddingBottom for minimum lane height.
         */
        lanePaddingTop: number;
        /**
         * Minimum internal bottom padding inside each lane body (below the node row).
         * Defaults to 0; combined with lanePaddingTop for minimum lane height.
         */
        lanePaddingBottom: number;
        channelSpacing: number;
        /** Horizontal padding reserved on each side of the canvas (left + right guard). */
        canvasPaddingX: number;
        /** Vertical gap between nodes stacked within a lane cell. */
        canvasPaddingY: number;
    };
    sizing: {
        minNodeWidth: number;
        minNodeHeight: number;
        /** Upper cap on computed node width (prevents giant nodes on sparse graphs). */
        maxNodeWidth: number;
        /** Upper cap on computed node height. */
        maxNodeHeight: number;
        /** Activity node sizing strategy: fixed standard width or bounded fit-to-text. */
        activitySizingMode: ActivitySizingMode;
        /** Fixed activity width used in standard mode. */
        standardActivityWidth: number;
        /** Minimum activity width used in fit-to-text mode. */
        fitActivityMinWidth: number;
        /** Maximum activity width used in fit-to-text mode. */
        fitActivityMaxWidth: number;
        /** Width snapping step used in fit-to-text mode. */
        fitActivityWidthStep: number;
        minLaneHeight: number;
    };
    routing: {
        /**
         * First-class pattern table — when provided, replaces the hardcoded
         * computeScenarioKey() cascade in scenarioResolver. Loaded from
         * PatternTableController (localStorage, falls back to DEFAULT_PATTERN_TABLE).
         */
        patternTable?: import('../routing/patternDefinition').PatternDefinition[];
        routingRules?: import('../routing/routingRuleDefinition').RoutingRuleDefinition[];
        compactMode?: boolean;
        loopbackEscapeMode: 'in-lane' | 'cross-lane' | 'over-swimlane' | 'auto';
        edgeChannelStrategy: 'follow-node' | 'adaptive';
        channelDensityMode: 'spacious' | 'fit-to-lane' | 'auto';
        /**
         * Distance in pixels from lane edges to cross-lane routing bands.
         * Upward patterns use (targetLane.y - crossLaneLaneTopBufferPx).
         * Downward patterns use (targetLane.y + targetLane.height + crossLaneLaneTopBufferPx).
         */
        crossLaneLaneTopBufferPx: number;
        horizontalConnectionsOnly: boolean;
        decisionLaneAffinity: {
            mode: 'off' | 'advisory' | 'adaptive';
            minDominantOutgoingRatio: number;
            minOutgoingEdges: number;
        };
        /** Controls which flow layers are rendered (not which are routed). */
        visibilityMode: 'default' | 'guided' | 'focus' | 'full';
        revealGroups: string[];
        protectedStructures: {
            preservePrimarySpine: boolean;
            preserveDecisionSymmetry: boolean;
            preserveParallelLanes: boolean;
        };
    };
    quality: {
        bendPenalty: number;
        crossingPenalty: number;
        collisionPenalty: number;
    };
    laneConsensus: {
        /**
         * Weight applied to successor (downstream) lane votes relative to predecessor votes.
         * 0 = predecessor-only (original behaviour). 0.5 = balanced. 1 = equal weight.
         * Values > 1 make successors dominate predecessors.
         */
        successorWeight: number;
    };
    layout: {
        /**
         * Lane mode: 'standard' uses normal swimlane-based layout (grouped by actor).
         * 'virtual' collapses all lanes into a single virtual lane, eliminating lateral separation
         * while keeping the layout and routing engines functional with simplified scenario logic.
         * 'byApp' groups lanes by each node's first `app` reference instead of its actor, with an
         * "Unassigned" lane for nodes with no `app` reference.
         */
        laneMode: LaneMode;
        /**
         * Vertical stacking order within a depth-lane cell.
         * 'chainIndex' — deterministic by chain index then lexical ID (default).
         * 'barycenter' — sort by mean Y of already-positioned neighbours (reduces bends in dense cells).
         */
        slotOrdering: 'chainIndex' | 'barycenter';
        /**
         * Key-flow identification strategy.
         * 'longestPath' — longest DAG path by hop count (default, fully automatic).
         * 'annotation'  — respects `key:` PML edge annotations with a 10× hop bonus; falls back to longest path.
         */
        keyFlowStrategy: 'longestPath' | 'annotation';
        /**
         * Render swimlanes when true; hide them when false.
         * Layout and routing remain unchanged — this is a visual-only toggle.
         */
        showLanes: boolean;
        /** Show the metadata icon strip on task shapes. */
        showMetaIcons: boolean;
    };
    heuristics: {
        stackingTolerancePx: number;
        eventSize: number;
        boundaryBandGapPx: number;
        curtainZoneExtraOffsetPx: number;
        laneSpaciousFactor: number;
        continuityTolerancePx: number;
        mixedRelayHorizontalMinOffsetPx: number;
        mixedRelayVerticalMinGapPx: number;
        decisionSize: number;
        taskHeight: number;
        estimatedCharWidth: number;
        decisionCharWidth: number;
        textPaddingX: number;
        decisionTextPaddingX: number;
    };
    canvasConfig: {
        laneHeaderHeight: number;
        baseCurtainWidth: number;
        curtainPadding: number;
        visualBoundsPadding: number;
        labelContainerWidth: number;
        /**
         * @deprecated Colors are now owned by the theme system (defaultProcessTheme.ts).
         * This field is kept for one release cycle but must not be read by renderer
         * code. Use resolveThemePresetById() or DEFAULT_PROCESS_THEME instead.
         */
        colors: {
            event: {
                fill: string;
                stroke: string;
                label: string;
            };
            decision: {
                fill: string;
                stroke: string;
                label: string;
            };
            subprocess: {
                fill: string;
                stroke: string;
                label: string;
            };
            task: {
                fill: string;
                stroke: string;
                label: string;
            };
            edge: {
                loopbackMain: string;
                loopbackSec: string;
                up: string;
                down: string;
                default: string;
            };
        };
    };
}
/** User-facing layout suggestion produced from convergence or quality analysis. */
export interface LayoutSuggestion {
    /** Category for filtering/display in the editor UI. */
    category: 'density' | 'routing' | 'readability' | 'structure';
    /** Short label shown in the UI. */
    label: string;
    /** Human-readable explanation of why this is suggested and what it will improve. */
    description: string;
    /** The settings key to change, if this suggestion is actionable via settings. */
    settingKey?: string;
    /** The suggested value for `settingKey`. */
    suggestedValue?: string | number | boolean;
}
export interface LayoutDiagnostics {
    health: LayoutHealth;
    boundaryPlacementLogs: BoundaryLog[];
    routingProvenance: RoutingProvenance[];
    routingMetrics?: RoutingMetrics;
    convergenceMetrics?: ConvergenceMetrics;
    stageHistory?: string[];
    currentStage?: string;
    determinismFingerprint?: string;
    provenanceLog?: string[];
    /**
     * Structured diagnostics contract shared across parser/validator/layout/editor.
     * Keep warnings/errors for backward compatibility while the pipeline migrates.
     */
    issues?: ProcessDiagnostic[];
    warnings: string[];
    errors: string[];
    /** User-facing actionable suggestions derived from convergence and quality metrics. */
    suggestions?: LayoutSuggestion[];
}
export interface RoutingMetrics {
    straightnessScore: number;
    edgeCrossings: number;
    totalElbows: number;
    degenerateElbows: number;
    maxChannelTier?: number;
    allocatedEdges?: number;
}
export interface ConvergencePass {
    iteration: number;
    totalElbows: number;
    degenerateElbows: number;
    edgeCrossings: number;
    straightnessScore: number;
    deltaElbows?: number;
    deltaCrossings?: number;
    deltaStraightness?: number;
}
export interface ConvergenceMetrics {
    converged: boolean;
    passCount: number;
    passes: ConvergencePass[];
}
export interface LayoutHealth {
    totalNodes: number;
    totalEdges: number;
    cyclesDetected: number;
    unreachableNodes: number;
    overlappingNodes: string[][];
    routingQuality: number;
}
export interface BoundaryLog {
    nodeId: string;
    lane?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    channel?: number;
    timestamp?: string;
}
export interface RoutingProvenance {
    edgeId: string;
    scenario: string;
    selectedPattern: string;
    appliedPolicies: string[];
    preferences: Record<string, any>;
    portTrace?: {
        sourceRequested?: PortSide;
        sourceSelected?: ConcretePortSide;
        sourceDowngradeReason?: string;
        targetRequested?: PortSide;
        targetSelected?: ConcretePortSide;
        targetDowngradeReason?: string;
        lockedPortViolations?: string[];
        portRuleKey?: string;
        portRuleElbowYPolicy?: ElbowYPolicy;
        hardSideContractCorrected?: boolean;
    };
    reasoning: string;
}
export interface LayoutResult {
    nodes: LayoutNode[];
    edges: LayoutEdge[];
    lanes: Lane[];
    bounds: Rect;
    diagnostics: LayoutDiagnostics;
    settings: LayoutSettings;
}
export interface LayoutContext extends LayoutState {
}
/** Output of Phase A: graph ingestion, ranking, key-flow, chain detection. */
export interface GraphPhaseResult {
    readonly nodes: LayoutNode[];
    readonly edges: LayoutEdge[];
    readonly lanes: Lane[];
    readonly chains: FlowChain[];
    readonly settings: LayoutSettings;
    readonly diagnostics: LayoutDiagnostics;
    readonly stageHistory: string[];
}
/** Output of Phase B: lane geometry, coordinate assignment, gateway placement, spatial negotiation. */
export interface GeometryPhaseResult extends GraphPhaseResult {
}
/** Output of Phase C: channel allocation, lane expansion, edge routing. */
export interface RoutingPhaseResult extends GeometryPhaseResult {
}
/** Fields readable by the lane consensus / laneGeometry stage. */
export type LaneGeometryInput = Readonly<Pick<LayoutState, 'nodes' | 'edges' | 'lanes' | 'settings' | 'diagnostics'>>;
/** Fields readable by the depth-folding stage. */
export type DepthFoldingInput = Readonly<Pick<LayoutState, 'nodes' | 'lanes' | 'settings' | 'chains'>>;
/** Fields readable by coordinate assignment. */
export type CoordinateAssignmentInput = Readonly<Pick<LayoutState, 'nodes' | 'edges' | 'lanes' | 'chains' | 'settings'>>;
/** Fields readable by gateway placement. */
export type GatewayPlacementInput = Readonly<Pick<LayoutState, 'nodes' | 'edges' | 'lanes' | 'settings'>>;
/** Fields readable by channel allocation. */
export type ChannelAllocationInput = Readonly<Pick<LayoutState, 'edges' | 'nodes' | 'lanes'>>;
/** Fields readable by the routing stage. */
export type RoutingStageInput = Readonly<Pick<LayoutState, 'edges' | 'nodes' | 'lanes' | 'settings'>>;
/** Fields readable by convergence analysis. */
export type ConvergenceInput = Readonly<Pick<LayoutState, 'edges'>>;
export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends Record<string, any> ? DeepPartial<T[K]> : T[K];
};
export declare function createLayoutSettings(overrides?: DeepPartial<LayoutSettings>): LayoutSettings;
export declare function createEmptyLayoutState(groupingStrategy: GroupingStrategy, settings?: LayoutSettings): LayoutState;
//# sourceMappingURL=layoutTypes.d.ts.map