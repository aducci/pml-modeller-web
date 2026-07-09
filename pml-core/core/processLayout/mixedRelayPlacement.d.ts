import { LayoutNode, LayoutEdge, Lane, LayoutSettings } from './layoutTypes';
export interface MixedRelayPlacement {
    yByNode: Map<string, number>;
    xByNode: Map<string, number>;
    lockXByNode: Map<string, number>;
    lockGatewayIdByNode: Map<string, string>;
}
export declare function resolveMixedDecisionRelayPlacement(lane: Lane, depth: number, nodesAtDepthLane: LayoutNode[], laneCenter: number, columnCenterX: number, incomingByTarget: Map<string, LayoutEdge[]>, outgoingBySource: Map<string, LayoutEdge[]>, laneById: Map<string, Lane>, nodeById: Map<string, LayoutNode>, columnCenters: number[], settings: LayoutSettings): MixedRelayPlacement | undefined;
//# sourceMappingURL=mixedRelayPlacement.d.ts.map