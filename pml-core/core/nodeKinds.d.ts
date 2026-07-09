/**
 * Canonical node-kind registry for the PML core model.
 *
 * Keep all model-facing node type literals centralized here so parser,
 * layout, routing, styling, and patch contracts stay aligned.
 */
export declare const CORE_NODE_KINDS: readonly ["event", "task", "decision", "subprocess"];
export type CoreNodeKind = (typeof CORE_NODE_KINDS)[number];
export type EventNodeKind = Extract<CoreNodeKind, 'event'>;
export type GatewaySubKind = 'exclusive' | 'inclusive' | 'parallel';
export declare const GATEWAY_SUB_KINDS: readonly ["exclusive", "inclusive", "parallel"];
export type NodeDirection = 'inbound' | 'outbound' | 'internal';
export declare const GATEWAY_NODE_KINDS: readonly ["decision"];
export type GatewayNodeKind = (typeof GATEWAY_NODE_KINDS)[number];
export declare const ACTIVITY_NODE_KINDS: readonly ["task", "subprocess"];
export type ActivityNodeKind = (typeof ACTIVITY_NODE_KINDS)[number];
export declare const CONTINUITY_ELIGIBLE_NODE_KINDS: readonly ["event", "task", "subprocess", "decision"];
type DirectionalNodeLike = {
    type: string;
    direction?: string;
    metadata?: {
        direction?: string;
    };
    isBoundary?: boolean;
};
export declare function isGatewayNodeKind(nodeType: string): nodeType is GatewayNodeKind;
export declare function isActivityNodeKind(nodeType: string): nodeType is ActivityNodeKind;
export declare function isEventNodeKind(nodeType: string): nodeType is EventNodeKind;
export declare function isInboundDirection(direction?: string): direction is 'inbound';
export declare function isOutboundDirection(direction?: string): direction is 'outbound';
export declare function getNodeDirection(node: DirectionalNodeLike): NodeDirection;
export declare function isBoundaryBandDirection(direction?: string): boolean;
export declare function isInboundEventNode(node: DirectionalNodeLike): boolean;
export declare function isOutboundEventNode(node: DirectionalNodeLike): boolean;
export declare function isBoundaryEventNode(node: DirectionalNodeLike): boolean;
export declare function isBoundaryBandNode(node: DirectionalNodeLike): boolean;
export {};
//# sourceMappingURL=nodeKinds.d.ts.map