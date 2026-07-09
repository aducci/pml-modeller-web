/**
 * Canonical node-kind registry for the PML core model.
 *
 * Keep all model-facing node type literals centralized here so parser,
 * layout, routing, styling, and patch contracts stay aligned.
 */
export const CORE_NODE_KINDS = ['event', 'task', 'decision', 'subprocess'];
export const GATEWAY_SUB_KINDS = ['exclusive', 'inclusive', 'parallel'];
export const GATEWAY_NODE_KINDS = ['decision'];
export const ACTIVITY_NODE_KINDS = ['task', 'subprocess'];
export const CONTINUITY_ELIGIBLE_NODE_KINDS = ['event', 'task', 'subprocess', 'decision'];
const GATEWAY_NODE_KIND_SET = new Set(GATEWAY_NODE_KINDS);
const ACTIVITY_NODE_KIND_SET = new Set(ACTIVITY_NODE_KINDS);
const EVENT_NODE_KIND_SET = new Set(['event']);
export function isGatewayNodeKind(nodeType) {
    return GATEWAY_NODE_KIND_SET.has(nodeType);
}
export function isActivityNodeKind(nodeType) {
    return ACTIVITY_NODE_KIND_SET.has(nodeType);
}
export function isEventNodeKind(nodeType) {
    return EVENT_NODE_KIND_SET.has(nodeType);
}
export function isInboundDirection(direction) {
    return direction === 'inbound';
}
export function isOutboundDirection(direction) {
    return direction === 'outbound';
}
export function getNodeDirection(node) {
    const direction = node.direction ?? node.metadata?.direction;
    if (direction === 'inbound' || direction === 'outbound') {
        return direction;
    }
    return 'internal';
}
export function isBoundaryBandDirection(direction) {
    return isInboundDirection(direction) || isOutboundDirection(direction);
}
export function isInboundEventNode(node) {
    return isEventNodeKind(node.type) && isInboundDirection(getNodeDirection(node));
}
export function isOutboundEventNode(node) {
    return isEventNodeKind(node.type) && isOutboundDirection(getNodeDirection(node));
}
export function isBoundaryEventNode(node) {
    return isEventNodeKind(node.type) && Boolean(node.isBoundary);
}
export function isBoundaryBandNode(node) {
    return isEventNodeKind(node.type)
        && (isBoundaryBandDirection(getNodeDirection(node)) || Boolean(node.isBoundary));
}
