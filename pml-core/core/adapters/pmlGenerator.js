/**
 * PML Generator
 *
 * Full round-trip serialiser: NormalizedProcessGraph → PML text.
 * Mirrors every construct the parser handles so that
 *   parsePmlTextToProcessModel(generatePml(graph))
 * preserves all semantics.
 */
import { getNodeDirection, isEventNodeKind, isInboundDirection, isOutboundDirection, } from '../nodeKinds';
import { formatMetadataForPml } from '../activityMetadataSchema';
import { GATEWAY_KIND_BY_KEYWORD } from './pmlTextParser';
// ---------------------------------------------------------------------------
// PML text -> lines helpers
// ---------------------------------------------------------------------------
function q(v) {
    return `"${v.replace(/"/g, '\\"')}"`;
}
const GATEWAY_KEYWORD_BY_KIND = Object.fromEntries(Object.entries(GATEWAY_KIND_BY_KEYWORD).map(([keyword, kind]) => [kind, keyword]));
/** `task foo` / `decision bar` id token, with the `?` (queried) suffix restored when set. */
function idToken(node) {
    return node.metadata?.queried ? `${node.id}?` : node.id;
}
/**
 * Emits a decision node's header line plus its outcome lines (the decision's
 * own outgoing edges), in the exact grammar `pmlTextParser.ts`'s branchMatch
 * accepts: `outcomeName[*] [as "label"] [loop] > target`. Returns the edge
 * objects consumed so the caller can exclude them from the generic edges dump.
 */
function emitDecisionBlock(node, graph, indent) {
    const lines = [];
    const label = node.label ? ` as ${q(node.label)}` : '';
    const scope = node.scope && node.scope !== 'inScope' ? `${node.scope} ` : '';
    const keyword = node.gatewayKind ? GATEWAY_KEYWORD_BY_KIND[node.gatewayKind] : undefined;
    const kind = keyword ? `(${keyword})` : '';
    lines.push(`${indent}${scope}decision${kind} ${idToken(node)}${label}:`);
    const outcomeEdges = graph.edges.filter((e) => e.source === node.id);
    const consumedEdges = new Set();
    for (const edge of outcomeEdges) {
        consumedEdges.add(edge);
        const name = edge.condition || edge.label || edge.target;
        const primary = edge.primary ? '*' : '';
        const asLabel = edge.label && edge.label !== name ? ` as ${q(edge.label)}` : '';
        const loop = edge.loop ? ' loop' : '';
        lines.push(`${indent}  ${name}${primary}${asLabel}${loop} > ${edge.target}`);
    }
    return { lines, consumedEdges };
}
// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------
export function generatePml(graph) {
    const lines = [];
    // ── 1. Process header ──────────────────────────────────────────────
    const headerParts = ['@process', graph.level || 'L0', q(graph.processName)];
    const headerExtras = [];
    if (graph.parent)
        headerExtras.push(`parent=${graph.parent}`);
    if (graph.parentLevel)
        headerExtras.push(`parentLevel=${graph.parentLevel}`);
    if (graph.version)
        headerExtras.push(`version=${graph.version}`);
    if (graph.status)
        headerExtras.push(`status=${graph.status}`);
    lines.push(`${headerParts.join(' ')} ${headerExtras.join(' ')}`);
    lines.push('');
    // ── 2. Imports (if any) ─────────────────────────────────────────
    // import declarations go right after the header
    // (graph doesn't carry imports natively; this is a round-trip placeholder)
    if (graph.imports?.length) {
        for (const imp of graph.imports) {
            let line = `import ${imp.source}`;
            if (imp.version)
                line += ` version=${imp.version}`;
            if (imp.alias)
                line += ` as ${imp.alias}`;
            lines.push(line);
        }
        lines.push('');
    }
    // ── 3. Events (top, before actors) ───────────────────────────────
    const events = graph.nodes.filter((n) => isEventNodeKind(n.type));
    for (const ev of events) {
        const direction = getNodeDirection(ev);
        const dir = direction === 'internal' ? '' : ` ${direction}`;
        const type = ev.eventType || 'message';
        const label = ev.label ? ` as ${q(ev.label)}` : '';
        let peer = '';
        if (ev.peer) {
            peer = isInboundDirection(direction) ? ` from=${ev.peer}` : isOutboundDirection(direction) ? ` to=${ev.peer}` : '';
        }
        const primary = ev.isPrimary ? ' primary' : '';
        lines.push(`event(${type}) ${idToken(ev)}${dir}${peer}${primary}${label}`);
        const metaLines = formatMetadataForPml(ev.metadata || {});
        for (const m of metaLines)
            lines.push(`  ${m}`);
    }
    if (events.length)
        lines.push('');
    // ── 4. Enums ────────────────────────────────────────────────────
    if (graph.enums?.length) {
        for (const en of graph.enums) {
            lines.push(`enum ${en.id}`);
            for (const val of en.values || []) {
                lines.push(`  ${val}`);
            }
        }
        lines.push('');
    }
    // ── 4b. Catalogs (risk register / rule library / app registry) ──
    if (graph.catalogs) {
        const catalogKinds = ['risk_register', 'rule_library', 'app_registry'];
        for (const kind of catalogKinds) {
            const entries = graph.catalogs[kind];
            if (!entries?.length)
                continue;
            lines.push(`${kind} {`);
            for (const entry of entries) {
                lines.push(`  ${entry.id} ${q(entry.description)}`);
            }
            lines.push('}');
            lines.push('');
        }
    }
    // ── 5. Actors with their owned nodes ────────────────────────────
    const nonEventNodes = graph.nodes.filter((n) => !isEventNodeKind(n.type));
    const actors = graph.actors;
    const unassigned = [];
    const consumedOutcomeEdges = new Set();
    // Group non-event nodes by actor
    for (const node of nonEventNodes) {
        if (node.actor && actors.some((a) => a.id === node.actor)) {
            // Assigned to an actor — emit inside that block
            continue;
        }
        unassigned.push(node);
    }
    for (const actor of actors) {
        const actorNodes = nonEventNodes.filter((n) => n.actor === actor.id);
        if (actorNodes.length === 0) {
            lines.push(`actor ${actor.id}`);
            lines.push('');
            continue;
        }
        // Label only when it differs from id
        const labelPart = actor.label && actor.label !== actor.id ? ` as ${q(actor.label)}` : '';
        lines.push(`actor ${actor.id}${labelPart}`);
        for (const node of actorNodes) {
            const metaLines = formatMetadataForPml(node.metadata || {});
            if (node.type === 'task') {
                const label = node.label ? ` as ${q(node.label)}` : '';
                const scope = node.scope && node.scope !== 'inScope' ? `${node.scope} ` : '';
                const taskType = node.taskType ? `(${node.taskType})` : '';
                lines.push(`    ${scope}task${taskType} ${idToken(node)}${label}`);
                for (const m of metaLines)
                    lines.push(`      ${m}`);
            }
            else if (node.type === 'subprocess') {
                const label = node.label ? ` as ${q(node.label)}` : '';
                const scope = node.scope && node.scope !== 'inScope' ? `${node.scope} ` : '';
                const process = node.process ? ` process=${node.process}` : '';
                const collapsed = node.collapsed !== undefined ? ` collapsed=${node.collapsed}` : '';
                const inputs = node.inputs?.length ? ` inputs=[${node.inputs.join(', ')}]` : '';
                const outputs = node.outputs?.length ? ` outputs=[${node.outputs.join(', ')}]` : '';
                lines.push(`    ${scope}subprocess ${node.id}${label}${process}${collapsed}${inputs}${outputs}`);
                for (const m of metaLines)
                    lines.push(`      ${m}`);
            }
            else if (node.type === 'decision') {
                const { lines: decisionLines, consumedEdges } = emitDecisionBlock(node, graph, '    ');
                decisionLines.forEach((l) => lines.push(l));
                for (const edge of consumedEdges)
                    consumedOutcomeEdges.add(edge);
                for (const m of metaLines)
                    lines.push(`      ${m}`);
            }
            else {
                // Unknown node type — emit raw
                lines.push(`    ${node.type} ${node.id}`);
                for (const m of metaLines)
                    lines.push(`      ${m}`);
            }
        }
        lines.push('');
    }
    // ── 6. Routes (emitted outside actor blocks) ────────────────────
    for (const route of graph.routes ?? []) {
        const label = route.label ? ` as ${q(route.label)}` : '';
        const by = route.enumId ? ` by ${route.enumId}` : '';
        lines.push(`route ${route.id}${label}${by}`);
        for (const mapping of route.mappings || []) {
            const p = mapping.primary ? '*' : '';
            lines.push(`  ${mapping.value}${p} > ${mapping.target}`);
        }
        lines.push('');
    }
    // ── 7. Unassigned nodes (cross-lane decisions, orphan edges) ────
    for (const node of unassigned) {
        const metaLines = formatMetadataForPml(node.metadata || {});
        if (node.type === 'decision') {
            const { lines: decisionLines, consumedEdges } = emitDecisionBlock(node, graph, '');
            decisionLines.forEach((l) => lines.push(l));
            for (const edge of consumedEdges)
                consumedOutcomeEdges.add(edge);
            for (const m of metaLines)
                lines.push(`  ${m}`);
        }
        else {
            lines.push(`${node.type} ${node.id}`);
            for (const m of metaLines)
                lines.push(`  ${m}`);
        }
    }
    if (unassigned.length)
        lines.push('');
    // ── 8. Edges / Flow declarations ───────────────────────────────
    for (const edge of graph.edges) {
        if (consumedOutcomeEdges.has(edge))
            continue;
        const parts = [edge.source, '>', edge.target];
        if (edge.condition)
            parts.push(`condition=${q(edge.condition)}`);
        if (edge.label)
            parts.push(`label=${q(edge.label)}`);
        if (edge.keyFlow)
            parts.push('keyFlow=true');
        if (edge.loop)
            parts.push('loop=true');
        if (edge.flowLayer && edge.flowLayer !== 'main')
            parts.push(`flowLayer=${edge.flowLayer}`);
        if (edge.semanticRole && edge.semanticRole !== 'normalFlow')
            parts.push(`semanticRole=${edge.semanticRole}`);
        if (edge.visibilityDefault && edge.visibilityDefault !== 'shown')
            parts.push(`visibilityDefault=${edge.visibilityDefault}`);
        if (edge.revealGroup)
            parts.push(`revealGroup=${edge.revealGroup}`);
        if (edge.narrative)
            parts.push(`narrative=${q(edge.narrative)}`);
        lines.push(parts.join(' '));
    }
    if (graph.edges.length > consumedOutcomeEdges.size)
        lines.push('');
    // ── 9. Context block ──────────────────────────────────────────
    if (graph.context && Object.keys(graph.context).length > 0) {
        lines.push('---context---');
        for (const [key, value] of Object.entries(graph.context)) {
            if (Array.isArray(value)) {
                lines.push(`${key}: [${value.map((v) => q(String(v))).join(', ')}]`);
            }
            else if (typeof value === 'string') {
                lines.push(`${key}: ${q(value)}`);
            }
            else {
                lines.push(`${key}: ${String(value)}`);
            }
        }
    }
    // Trim trailing blank lines
    while (lines.length > 0 && lines[lines.length - 1] === '')
        lines.pop();
    lines.push('');
    return lines.join('\n');
}
