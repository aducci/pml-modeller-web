/**
 * Process model styling schema contracts.
 *
 * This module defines declarative styling and info-policy types that sit on top
 * of the canonical DSL-derived model.
 */
import { isGatewayNodeKind } from '../nodeKinds';
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Resolves the style for a node type.
 * `decision` and `route` both map to the unified `gateway` token.
 */
export function getElementStyle(theme, nodeType) {
    const resolvedType = isGatewayNodeKind(nodeType) ? 'gateway' : nodeType;
    const known = theme.elementStyles[resolvedType];
    return known ?? theme.elementStyles.unknown;
}
