/**
 * Normalized Process Graph
 *
 * This is the canonical intermediate representation between the PML parser
 * and the layout engine. All views and renderers consume this contract.
 */
import { isGatewayNodeKind } from './nodeKinds';
export function isInboundEvent(node) {
    return node.type === 'event' && node.direction === 'inbound';
}
export function isOutboundEvent(node) {
    return node.type === 'event' && node.direction === 'outbound';
}
export function isDecisionNode(node) {
    return isGatewayNodeKind(node.type);
}
export function isGatewayNode(node) {
    return isGatewayNodeKind(node.type);
}
