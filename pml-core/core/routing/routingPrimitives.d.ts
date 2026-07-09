import { Lane, Point } from '../processLayout/layoutTypes';
export interface CrossLaneRoutingConstants {
    exitBufferPx: number;
    entryBufferPx: number;
    laneTopBufferPx: number;
}
export interface PortAnchors {
    src: Point;
    tgt: Point;
}
export interface VerticalLeftEntryConstants {
    exitBufferPx: number;
    entryBufferPx: number;
    bridgeY: number;
}
export declare function routeCrossLaneUpFromRightToLeft(anchors: PortAnchors, _targetLane: Lane, constants: CrossLaneRoutingConstants, _sourceLane?: Lane): Point[];
export declare function routeCrossLaneUpFromTopToLeft(anchors: PortAnchors, targetLane: Lane, constants: CrossLaneRoutingConstants, sourceLane?: Lane): Point[];
export declare function routeCrossLaneDownFromRightToLeft(anchors: PortAnchors, _targetLane: Lane, constants: CrossLaneRoutingConstants): Point[];
export declare function routeCrossLaneDownFromBottomToLeft(anchors: PortAnchors, _targetLane: Lane, constants: CrossLaneRoutingConstants): Point[];
export declare function routeVerticalFirstLeftEntry(anchors: PortAnchors, constants: VerticalLeftEntryConstants): Point[];
export declare function routeStandardVerticalFirst(anchors: PortAnchors, bridgeY: number): Point[];
export declare function routeStandardHorizontalFirst(anchors: PortAnchors, bridgeY: number, useMidpointBridgeY: boolean, overrideBridgeX?: number): Point[];
//# sourceMappingURL=routingPrimitives.d.ts.map