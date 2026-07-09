/**
 * PML Slice Serializer
 *
 * Serialises a NormalizedProcessGraph (or subgraph window) back into PML
 * text suitable for AI consumption. Emits canonical form (as "Label", > flow,
 * actor= assignment) with optional metadata.
 *
 * This is distinct from pmlGenerator.ts — pmlGenerator round-trips the
 * full graph for persistence. This serializer targets AI prompt windows:
 * shorter, focused, with contextual markers for what was trimmed.
 */
import { formatMetadataForPml } from '../activityMetadataSchema';
export const DEFAULT_SERIALIZE_OPTIONS = {
    includeMetadata: false,
    maxLines: 0,
    showTrimNote: true,
    includeHeader: true,
};
// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------
export function serializeWindow(window, options) {
    const opts = { ...DEFAULT_SERIALIZE_OPTIONS, ...options };
    const { graph } = window;
    const lines = [];
    // Header comment — trim note
    if (opts.showTrimNote && window.nodeCount > 0) {
        lines.push(`// ── Process: ${graph.processName} (${window.summary}) ──`);
        lines.push('');
    }
    // Process header
    if (opts.includeHeader && graph.processName) {
        const level = graph.level || 'L0';
        const name = graph.processName;
        const extras = [];
        if (graph.parent)
            extras.push(`parent=${graph.parent}`);
        if (graph.version)
            extras.push(`version=${graph.version}`);
        if (graph.status)
            extras.push(`status=${graph.status}`);
        const extraStr = extras.length > 0 ? ` ${extras.join(' ')}` : '';
        lines.push(`@process ${level} "${name}"${extraStr}`);
        lines.push('');
    }
    // Events
    const events = graph.nodes.filter((n) => n.type === 'event');
    if (events.length > 0) {
        for (const ev of events) {
            const dir = ev.direction ? ` ${ev.direction}` : '';
            const type = ev.eventType || 'message';
            const label = ev.label ? ` as "${ev.label}"` : '';
            const peer = ev.peer
                ? ev.direction === 'inbound'
                    ? ` from=${ev.peer}`
                    : ev.direction === 'outbound'
                        ? ` to=${ev.peer}`
                        : ''
                : '';
            lines.push(`event(${type}) ${ev.id}${label}${dir}${peer}`);
            const evStatus = ev?.metadata?.status;
            if (evStatus)
                lines.push(`  status=${evStatus}`);
            if (opts.includeMetadata && ev.metadata) {
                appendMetadata(lines, ev.metadata, opts.includeMetadata);
            }
        }
        lines.push('');
    }
    // Actors grouped with their tasks
    const actors = graph.actors;
    const nodesByActor = new Map();
    const unassigned = [];
    for (const node of graph.nodes) {
        if (node.type === 'event')
            continue;
        if (node.actor) {
            if (!nodesByActor.has(node.actor))
                nodesByActor.set(node.actor, []);
            nodesByActor.get(node.actor).push(node);
        }
        else {
            unassigned.push(node);
        }
    }
    for (const actor of actors) {
        const actorNodes = nodesByActor.get(actor.id) || [];
        if (actorNodes.length === 0 && actors.length > 1)
            continue; // skip empty actors in multi-actor context
        lines.push(`actor ${actor.id} ${actor.label !== actor.id ? `as "${actor.label}"` : ''}`);
        for (const node of actorNodes) {
            lines.push(serializeNode(node, opts));
            if (opts.includeMetadata && node.metadata) {
                appendMetadata(lines, node.metadata, opts.includeMetadata);
            }
        }
        lines.push('');
    }
    // Unassigned nodes
    if (unassigned.length > 0) {
        for (const node of unassigned) {
            lines.push(serializeNode(node, opts));
            if (opts.includeMetadata && node.metadata) {
                appendMetadata(lines, node.metadata, opts.includeMetadata);
            }
        }
        lines.push('');
    }
    // Flow edges
    if (graph.edges.length > 0) {
        // Group key-flow edges
        const keyFlowEdges = graph.edges.filter((e) => e.keyFlow);
        const normalEdges = graph.edges.filter((e) => !e.keyFlow);
        if (keyFlowEdges.length > 0) {
            const chain = buildFlowChain(keyFlowEdges);
            if (chain.length > 0) {
                lines.push(`flow key`);
                lines.push(`  ${chain.join(' > ')}`);
                lines.push('');
            }
        }
        if (normalEdges.length > 0) {
            // Check if we need a flow block
            const needsBlock = normalEdges.length > 1 || keyFlowEdges.length > 0;
            if (needsBlock) {
                lines.push('flow');
            }
            for (const edge of normalEdges) {
                const cond = edge.condition ? ` ${edge.condition}` : '';
                const label = edge.label ? ` as "${edge.label}"` : '';
                const loop = edge.loop ? ' loop' : '';
                const line = `  ${edge.source}${loop} > ${edge.target}${cond}${label}`;
                lines.push(line);
            }
            if (needsBlock)
                lines.push('');
        }
    }
    // Trim to maxLines if needed
    let result = lines.join('\n');
    if (opts.maxLines > 0) {
        const split = result.split('\n');
        if (split.length > opts.maxLines) {
            result = split.slice(0, opts.maxLines).join('\n') + '\n// ... (trimmed to max lines)';
        }
    }
    return result;
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function serializeNode(node, opts) {
    const label = node.label ? ` as "${node.label}"` : '';
    const actor = node.actor ? ` actor=${node.actor}` : '';
    const scope = node.scope && node.scope !== 'inScope' ? ` ${node.scope}` : '';
    const status = node.metadata?.status ? ` status=${node.metadata.status}` : '';
    switch (node.type) {
        case 'task': {
            const taskType = node.taskType ? `(${node.taskType})` : '';
            return `    ${scope}task${taskType} ${node.id}${label}${actor}${status}`;
        }
        case 'subprocess': {
            const process = node.process ? ` process=${node.process}` : '';
            return `    ${scope}subprocess ${node.id}${label}${actor}${process}${status}`;
        }
        case 'decision': {
            const outcomes = node.outcomes?.length
                ? ':\n' + node.outcomes.map((o) => `      ${o} > ...`).join('\n')
                : '';
            return `    decision ${node.id}${label}${actor}${status}${outcomes}`;
        }
        default:
            return `    ${node.type} ${node.id}${label}${actor}${status}`;
    }
}
function appendMetadata(lines, metadata, includeAll) {
    if (!metadata || !includeAll)
        return;
    for (const metadataLine of formatMetadataForPml(metadata)) {
        lines.push(`    ${metadataLine}`);
    }
    if (metadata.status)
        lines.push(`    status=${metadata.status}`);
}
function buildFlowChain(keyFlowEdges) {
    // Build an ordered chain from key-flow edges
    const incoming = new Map();
    const outgoing = new Map();
    for (const edge of keyFlowEdges) {
        outgoing.set(edge.source, edge.target);
        incoming.set(edge.target, edge.source);
    }
    // Find start (no incoming)
    const start = [...outgoing.keys()].find((id) => !incoming.has(id));
    if (!start)
        return keyFlowEdges.map((e) => `${e.source} > ${e.target}`);
    const chain = [start];
    let current = start;
    while (outgoing.has(current)) {
        current = outgoing.get(current);
        chain.push(current);
    }
    return chain;
}
