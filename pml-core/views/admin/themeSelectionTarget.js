import { isGatewayNodeKind } from '../../core/nodeKinds';
export function resolveThemeSelectionTarget(type, id, state) {
    if (type === 'lane') {
        const lane = state.layoutResult?.lanes?.find((l) => l.id === id);
        return { kind: 'lane', id, label: lane?.label ?? id };
    }
    if (type === 'node') {
        const node = state.layoutResult?.nodes?.find((n) => n.id === id);
        if (!node)
            return null;
        // Boundary events (inbound/outbound) are themed via `curtains`, not
        // `elementStyles.event` — same distinction the renderer itself makes
        // (curtains.ts / buildNodeRenderModels draw the boundary band
        // separately from an ordinary event node's shape).
        if (node.type === 'event' && (node.direction === 'inbound' || node.direction === 'outbound')) {
            return { kind: 'curtain', side: node.direction, label: node.label ?? id };
        }
        const elementStyleKey = isGatewayNodeKind(node.type) ? 'gateway' : node.type;
        return { kind: 'node', id, elementStyleKey, label: node.label ?? id };
    }
    if (type === 'edge') {
        const edge = state.graphEdges?.find((e) => e.id === id);
        if (!edge)
            return null;
        const nodesById = new Map((state.layoutResult?.nodes ?? []).map((n) => [n.id, n]));
        const sourceActor = nodesById.get(edge.source)?.actor;
        const targetActor = nodesById.get(edge.target)?.actor;
        // semanticRole is genuine modelling intent and takes priority over
        // geometry-driven variants — mirrors the same priority order
        // buildNodeRenderModels.ts uses when actually rendering the edge.
        const variant = edge.semanticRole === 'messageFlow'
            ? 'message'
            : edge.loop
                ? 'loopback'
                : (sourceActor && targetActor && sourceActor !== targetActor)
                    ? 'crossLane'
                    : 'default';
        return { kind: 'edge', id, variant, label: edge.label ?? `${edge.source} → ${edge.target}` };
    }
    return null;
}
