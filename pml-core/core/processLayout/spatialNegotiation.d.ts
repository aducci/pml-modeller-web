/**
 * Bounded Spatial Opportunity Evaluation — processLayout stage.
 *
 * Runs BEFORE channel allocation (between coordinate assignment and channel
 * allocation in the pipeline). Detects near-clean routing opportunities and
 * proposes constrained X-axis micro-adjustments to node positions.
 *
 * Hard invariants are constants — never relaxed at runtime (spec Section 7.2).
 */
import { LayoutNode, LayoutEdge, Lane } from './layoutTypes';
import { GatewayEnvelopeMap } from './gatewayPlacement';
export interface SpatialNegotiationSettings {
    straightDownAlignmentThresholdPx: number;
    minFanInCompressionRatio: number;
    maxDecisionSymmetryDeltaPx: number;
    maxCrossLaneConvergenceCompression: number;
    minApproachGapPx: number;
}
export declare const DEFAULT_SPATIAL_SETTINGS: SpatialNegotiationSettings;
export interface SpatialAdjustmentProposal {
    nodeId: string;
    deltaX: number;
    rationale: string;
    triggerSource: string;
}
export interface AcceptedAdjustment {
    nodeId: string;
    appliedDeltaX: number;
    rationale: string;
}
export interface RejectedProposal {
    nodeId: string;
    deltaX: number;
    rejectionReason: string;
    triggerSource: string;
}
export interface WindowDiagnostic {
    windowId: string;
    triggersEvaluated: string[];
    triggered: boolean;
    proposals: number;
    accepted: number;
}
export interface SpatialNegotiationOutput {
    acceptedAdjustments: AcceptedAdjustment[];
    rejectedProposals: RejectedProposal[];
    windowDiagnostics: WindowDiagnostic[];
    skipped: boolean;
    skipReason?: string;
}
export declare function evaluateBoundedSpatialOpportunities(nodes: LayoutNode[], edges: LayoutEdge[], laneMap: Map<string, Lane>, gatewayEnvelopes: GatewayEnvelopeMap, settings?: SpatialNegotiationSettings): SpatialNegotiationOutput;
//# sourceMappingURL=spatialNegotiation.d.ts.map