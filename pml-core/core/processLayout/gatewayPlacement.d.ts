/**
 * Gateway Placement Heuristics
 *
 * Single controller for all gateway pre-routing decisions.
 * Implements Stage 5 of the V2 routing architecture:
 * "Gateway placement heuristics and output-envelope pre-reservation."
 *
 * Runs after coordinate assignment and before channel allocation.
 * Must not mutate topology, rank ownership, or lane ownership contracts.
 *
 * Outputs: adjusted node positions + GatewayOutputEnvelope map (consumed
 * read-only by portResolver.ts for gateway-origin port assignment).
 */
import { LayoutContext } from './layoutTypes';
export interface GatewayPlacementOptions {
    enabled: boolean;
    laneAffinityWeights: {
        incomingLaneDistanceWeight: number;
        outgoingLaneDistanceWeight: number;
        crossLaneTransitionWeight: number;
        trunkDisruptionWeight: number;
        envelopePressureWeight: number;
    };
    maxGatewayRankBiasPx: number;
    maxGatewayCenteringDeltaPx: number;
}
export interface GatewayOutputEnvelope {
    gatewayId: string;
    topCorridorSlots: number;
    bottomCorridorSlots: number;
    rightCorridorSlots: number;
    branchSlotAssignments: Record<string, 'top' | 'bottom' | 'right'>;
}
export type GatewayEnvelopeMap = Map<string, GatewayOutputEnvelope>;
export interface GatewayPlacementDiagnostic {
    gatewayId: string;
    fromLaneId?: string;
    toLaneId?: string;
    laneAffinityScore: number;
    rankOffsetPx: number;
    verticalCenteringDeltaPx: number;
    envelopeSlotCounts: {
        top: number;
        bottom: number;
        right: number;
    };
    envelopeSaturated: boolean;
    envelopeRebalanced: boolean;
}
export declare function applyGatewayPlacementHeuristics(context: LayoutContext, options?: GatewayPlacementOptions): GatewayEnvelopeMap;
//# sourceMappingURL=gatewayPlacement.d.ts.map