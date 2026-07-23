// PML contract guard: validates raw PML models + normalized graphs for structural and semantic correctness.
// Ensures actors/scopes/enums/imports/edges adhere to the PML spec, and that the graph is well-formed and reachable.
// TODO: Extract shared constants (valid scopes, flow layers, semantic roles) to top-level or a separate config module.
// TODO: Enrich ValidationIssue with optional nodeId/edgeId/field metadata for better editor/UX integration.
// TODO: Split validatePmlModelInput into small helpers (tasks/events/decisions/routes/imports/edges) to keep it maintainable.
// TODO: Revisit NODE_CANNOT_REACH_TERMINAL severity and behavior for different flowLayers/semanticRoles (main vs exception).```
import { isInboundEvent, isOutboundEvent, } from '../normalizedGraph';
import { getNodeDirection, isEventNodeKind, isGatewayNodeKind, isInboundDirection } from '../nodeKinds';
function emptyResult() {
    return { errors: [], warnings: [] };
}
function addIssue(result, mode, code, message, strictAsError, source) {
    if (strictAsError && mode === 'strict') {
        result.errors.push({ code, message, severity: 'error', source });
        return;
    }
    result.warnings.push({ code, message, severity: 'warning', source });
}
function mergeResults(base, next) {
    return {
        errors: [...base.errors, ...next.errors],
        warnings: [...base.warnings, ...next.warnings],
    };
}
export function validatePmlModelInput(pmlModel, mode = 'strict') {
    const result = emptyResult();
    const validScopes = new Set(['inScope', 'external']);
    const validProcessStatuses = new Set(['draft', 'review', 'approved', 'deprecated']);
    const validFlowLayers = new Set(['main', 'alternate', 'message', 'annotation', 'hidden']);
    const validSemanticRoles = new Set([
        'normalFlow',
        'messageFlow',
        'exceptionFlow',
        'compensationFlow',
        'eventEscalation',
        'boundaryInterrupt',
    ]);
    const actors = new Set((pmlModel.actors || []).map((a) => a.id));
    for (const parserIssue of pmlModel.parserIssues || []) {
        addIssue(result, mode, parserIssue.code, parserIssue.message, parserIssue.severity === 'error', parserIssue.source);
    }
    if (pmlModel.headerFirstViolation) {
        addIssue(result, mode, 'PROCESS_HEADER_NOT_FIRST', 'The @process header must be the first non-comment statement.', true, pmlModel.headerFirstViolationSource);
    }
    if (pmlModel.status && !validProcessStatuses.has(pmlModel.status)) {
        addIssue(result, mode, 'PROCESS_STATUS_INVALID', `Process status "${pmlModel.status}" must be one of: draft, review, approved, deprecated`, true);
    }
    for (const task of pmlModel.tasks || []) {
        if (task.actor && !actors.has(task.actor)) {
            addIssue(result, mode, 'TASK_ACTOR_UNKNOWN', `Task "${task.id}" references undeclared actor "${task.actor}"`, true, task.sourceRange);
        }
        if (task.scope && !validScopes.has(task.scope)) {
            addIssue(result, mode, 'TASK_SCOPE_INVALID', `Task "${task.id}" uses invalid scope "${task.scope}"`, true, task.sourceRange);
        }
    }
    const duplicateNodeResult = emptyResult();
    const nodeDeclarationIds = [
        ...(pmlModel.events || []).map((event) => event.id),
        ...(pmlModel.tasks || []).map((task) => task.id),
        ...(pmlModel.decisions || []).map((decision) => decision.id),
        ...(pmlModel.subprocesses || []).map((subprocess) => subprocess.id),
        ...(pmlModel.routes || []).map((route) => route.id),
    ];
    const nodeIdCounts = new Map();
    for (const nodeId of nodeDeclarationIds) {
        nodeIdCounts.set(nodeId, (nodeIdCounts.get(nodeId) || 0) + 1);
    }
    for (const [nodeId, count] of nodeIdCounts.entries()) {
        if (count > 1) {
            addIssue(duplicateNodeResult, mode, 'NODE_ID_DUPLICATE', `Node id "${nodeId}" is declared ${count} times across node definitions`, true);
        }
    }
    const withDuplicateIds = mergeResults(result, duplicateNodeResult);
    const inboundPrimaryEvents = (pmlModel.events || []).filter((event) => isInboundDirection(event.direction) && Boolean(event.isPrimary));
    if (inboundPrimaryEvents.length > 1) {
        addIssue(result, mode, 'PRIMARY_INBOUND_EVENT_MULTIPLE', `At most one inbound event may be marked primary; found ${inboundPrimaryEvents.length}`, true);
    }
    for (const event of pmlModel.events || []) {
        if (event.scope && !validScopes.has(event.scope)) {
            addIssue(result, mode, 'EVENT_SCOPE_INVALID', `Event "${event.id}" uses invalid scope "${event.scope}"`, true, event.sourceRange);
        }
    }
    for (const decision of pmlModel.decisions || []) {
        if (decision.scope && !validScopes.has(decision.scope)) {
            addIssue(result, mode, 'DECISION_SCOPE_INVALID', `Decision "${decision.id}" uses invalid scope "${decision.scope}"`, true, decision.sourceRange);
        }
    }
    for (const subprocess of pmlModel.subprocesses || []) {
        if (subprocess.scope && !validScopes.has(subprocess.scope)) {
            addIssue(result, mode, 'SUBPROCESS_SCOPE_INVALID', `Subprocess "${subprocess.id}" uses invalid scope "${subprocess.scope}"`, true, subprocess.sourceRange);
        }
        if (!subprocess.process || !subprocess.process.trim()) {
            addIssue(result, mode, 'SUBPROCESS_PROCESS_MISSING', `Subprocess "${subprocess.id}" must define process=...`, true, subprocess.sourceRange);
        }
    }
    for (const decision of pmlModel.decisions || []) {
        if (!decision.outcomes || decision.outcomes.length === 0) {
            addIssue(result, mode, 'DECISION_NO_OUTCOMES', `Decision "${decision.id}" must define at least one outcome`, true, decision.sourceRange);
        }
    }
    const enumIds = new Set();
    for (const enumDecl of pmlModel.enums || []) {
        if (enumIds.has(enumDecl.id)) {
            addIssue(result, mode, 'ENUM_ID_DUPLICATE', `Enum "${enumDecl.id}" is declared more than once`, true, enumDecl.sourceRange);
        }
        enumIds.add(enumDecl.id);
        if (!enumDecl.values || enumDecl.values.length === 0) {
            addIssue(result, mode, 'ENUM_VALUES_EMPTY', `Enum "${enumDecl.id}" must define at least one value`, true, enumDecl.sourceRange);
            continue;
        }
        const enumValueSeen = new Set();
        for (const enumValue of enumDecl.values) {
            if (!/^[A-Za-z0-9_.-]+$/.test(enumValue)) {
                addIssue(result, mode, 'ENUM_VALUE_INVALID', `Enum "${enumDecl.id}" has invalid value "${enumValue}"`, true, enumDecl.sourceRange);
            }
            if (enumValueSeen.has(enumValue)) {
                addIssue(result, mode, 'ENUM_VALUE_DUPLICATE', `Enum "${enumDecl.id}" contains duplicate value "${enumValue}"`, true, enumDecl.sourceRange);
            }
            enumValueSeen.add(enumValue);
        }
    }
    const enumMap = new Map((pmlModel.enums || []).map((e) => [e.id, new Set(e.values)]));
    for (const route of pmlModel.routes || []) {
        const enumValues = enumMap.get(route.enumId);
        if (!enumValues) {
            addIssue(result, mode, 'ROUTE_ENUM_NOT_FOUND', `Route "${route.id}" references missing enum "${route.enumId}"`, true, route.sourceRange);
            continue;
        }
        const mappedValues = new Set(route.mappings.map((m) => m.value));
        const missingCoverage = [...enumValues].filter((v) => !mappedValues.has(v));
        if (missingCoverage.length > 0) {
            addIssue(result, mode, 'ROUTE_ENUM_COVERAGE_MISSING', `Route "${route.id}" is missing enum coverage for: ${missingCoverage.join(', ')}`, true, route.sourceRange);
        }
    }
    for (const imp of pmlModel.imports || []) {
        const pinnedBySource = imp.source.includes('@');
        const pinnedByVersion = Boolean(imp.version && imp.version.trim());
        if (!pinnedBySource && !pinnedByVersion) {
            addIssue(result, mode, 'IMPORT_VERSION_PIN_MISSING', `Import "${imp.source}" is missing an explicit version pin`, true, imp.sourceRange);
        }
    }
    for (const edge of pmlModel.edges || []) {
        if (edge.flowLayer && !validFlowLayers.has(edge.flowLayer)) {
            addIssue(result, mode, 'EDGE_FLOW_LAYER_INVALID', `Edge "${edge.source}->${edge.target}" uses invalid flowLayer "${edge.flowLayer}"`, true, edge.sourceRange);
        }
        if (edge.semanticRole && !validSemanticRoles.has(edge.semanticRole)) {
            addIssue(result, mode, 'EDGE_SEMANTIC_ROLE_INVALID', `Edge "${edge.source}->${edge.target}" uses invalid semanticRole "${edge.semanticRole}"`, true, edge.sourceRange);
        }
    }
    return withDuplicateIds;
}
export function validateNormalizedGraphContract(graph, mode = 'strict') {
    const result = emptyResult();
    const inboundPrimaryCount = graph.nodes.filter((node) => isInboundEvent(node) && Boolean(node.isPrimary)).length;
    if (inboundPrimaryCount > 1) {
        addIssue(result, mode, 'PRIMARY_INBOUND_EVENT_MULTIPLE', `At most one inbound event may be marked primary; found ${inboundPrimaryCount}`, true);
    }
    if (graph.inboundEvents.length === 0) {
        addIssue(result, mode, 'INBOUND_MISSING', 'Process must have at least one inbound event', true);
    }
    if (graph.outboundEvents.length === 0) {
        addIssue(result, mode, 'OUTBOUND_MISSING', 'Process must have at least one outbound event', true);
    }
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const incoming = new Map();
    const outgoing = new Map();
    const reverseAdj = new Map();
    const adj = new Map();
    for (const node of graph.nodes) {
        incoming.set(node.id, 0);
        outgoing.set(node.id, 0);
        reverseAdj.set(node.id, []);
        adj.set(node.id, []);
    }
    for (const edge of graph.edges) {
        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
            addIssue(result, mode, 'EDGE_ENDPOINT_UNKNOWN', `Edge "${edge.id}" references missing endpoint(s): ${edge.source} -> ${edge.target}`, true);
            continue;
        }
        outgoing.set(edge.source, (outgoing.get(edge.source) || 0) + 1);
        incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
        adj.get(edge.source).push(edge.target);
        reverseAdj.get(edge.target).push(edge.source);
    }
    for (const node of graph.nodes) {
        if (isInboundEvent(node) && (incoming.get(node.id) || 0) > 0) {
            addIssue(result, mode, 'INBOUND_HAS_INCOMING', `Inbound event "${node.id}" must not have incoming edges`, true);
        }
        if (isOutboundEvent(node) && (outgoing.get(node.id) || 0) > 0) {
            addIssue(result, mode, 'OUTBOUND_HAS_OUTGOING', `Outbound event "${node.id}" must not have outgoing edges`, true);
        }
    }
    const inboundSet = new Set(graph.inboundEvents);
    const outboundSet = new Set(graph.outboundEvents);
    const reachableFromInbound = new Set();
    const inboundQueue = [...inboundSet];
    while (inboundQueue.length > 0) {
        const current = inboundQueue.shift();
        if (reachableFromInbound.has(current))
            continue;
        reachableFromInbound.add(current);
        for (const next of adj.get(current) || []) {
            if (!reachableFromInbound.has(next)) {
                inboundQueue.push(next);
            }
        }
    }
    const canReachTerminal = new Set();
    const terminalInternal = graph.nodes
        .filter((n) => isEventNodeKind(n.type) && getNodeDirection(n) === 'internal' && (outgoing.get(n.id) || 0) === 0)
        .map((n) => n.id);
    const terminalQueue = [...outboundSet, ...terminalInternal];
    while (terminalQueue.length > 0) {
        const current = terminalQueue.shift();
        if (canReachTerminal.has(current))
            continue;
        canReachTerminal.add(current);
        for (const prev of reverseAdj.get(current) || []) {
            if (!canReachTerminal.has(prev)) {
                terminalQueue.push(prev);
            }
        }
    }
    for (const node of graph.nodes) {
        if (!reachableFromInbound.has(node.id)) {
            addIssue(result, mode, 'NODE_UNREACHABLE_FROM_INBOUND', `Node "${node.id}" is not reachable from any inbound event`, true);
        }
        if (!canReachTerminal.has(node.id)) {
            addIssue(result, mode, 'NODE_CANNOT_REACH_TERMINAL', `Node "${node.id}" does not lead to an outbound or terminal internal event`, false);
        }
    }
    return result;
}
export function validatePmlAndGraph(pmlModel, graph, mode = 'strict') {
    return mergeResults(validatePmlModelInput(pmlModel, mode), validateNormalizedGraphContract(graph, mode));
}
// ---------------------------------------------------------------------------
// Suggestions — structured, addressable facts fed to the AI as context
// (Phase 2 of docs/FINAL/06_AI_Modelling_Engine.md, §2.C / §3 principle 7:
// "the AI reasons over what the validator already found — it doesn't
// re-derive it"). Deliberately separate from validateNormalizedGraphContract:
// that function's job is pass/fail (errors/warnings gate applyPatches),
// this function's job is proactive, informational findings about the
// *current* model, regardless of validation mode. A node can be
// suggestion-worthy without the model being invalid.
//
// First ported 2026-07-17 with one rule (OUTBOUND_HAS_OUTGOING) — see
// 07_AI_Engine_Review_and_Enhancements.md §7.3 for why it was chosen first.
// Three more ported same day once that one round-tripped clean end-to-end
// (unit tests + live wiring into /api/ai/propose): DECISION_SINGLE_OUTCOME,
// TASK_NO_ACTOR, NODE_ORPHANED. INBOUND_HAS_INCOMING added the same day
// after a live incident (§7.7): the AI proposed a fresh inbound event with
// an edge routed into it when asked to build a process from scratch — the
// prompt taught the outbound-terminal rule but never its inbound sibling.
// See §7.4 for further candidates and the selection reasoning for each batch.
//
// 2026-07-19 (12_AI_Layer_Reconciliation_and_Build_Plan.md, Phase A): each
// suggestion now also carries `category` and `status: 'open'` — the first
// step toward docs/FINAL/11_AI_Conversational_Layer_Discussion.md §5.1's
// richer Finding shape, added to this existing type in place rather than as
// a parallel Finding type. `suggestedActions` is deliberately not added yet
// — it depends on the AIAction lifecycle (Phase C), not built here.
// ---------------------------------------------------------------------------
export function computeProcessSuggestions(graph) {
    const suggestions = [];
    const outgoingCount = new Map();
    const incomingCount = new Map();
    for (const edge of graph.edges) {
        outgoingCount.set(edge.source, (outgoingCount.get(edge.source) || 0) + 1);
        incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
    }
    // Grouped by source/target once, up front, so evidence can attach the
    // actual offending edge ids without re-scanning graph.edges per node.
    const edgesBySource = new Map();
    const edgesByTarget = new Map();
    for (const edge of graph.edges) {
        if (!edgesBySource.has(edge.source))
            edgesBySource.set(edge.source, []);
        edgesBySource.get(edge.source).push(edge);
        if (!edgesByTarget.has(edge.target))
            edgesByTarget.set(edge.target, []);
        edgesByTarget.get(edge.target).push(edge);
    }
    for (const node of graph.nodes) {
        if (isOutboundEvent(node) && (outgoingCount.get(node.id) || 0) > 0) {
            suggestions.push({
                code: 'OUTBOUND_HAS_OUTGOING',
                message: `Outbound event "${node.id}" has an outgoing edge — outbound events are terminal and must not lead anywhere else. Model the downstream step as a task instead, or split into two parallel edges from the source task.`,
                severity: 'suggestion',
                category: 'structural',
                status: 'open',
                data: { nodeId: node.id },
                evidence: { nodeIds: [node.id], edgeIds: (edgesBySource.get(node.id) ?? []).map((e) => e.id) },
            });
        }
        // Sibling of OUTBOUND_HAS_OUTGOING above — an inbound event is a process
        // entry point and must not have anything internal pointing into it.
        if (isInboundEvent(node) && (incomingCount.get(node.id) || 0) > 0) {
            suggestions.push({
                code: 'INBOUND_HAS_INCOMING',
                message: `Inbound event "${node.id}" has an incoming edge — inbound events are entry points and must not be led into by another step. Start the flow at this event instead of routing something into it.`,
                severity: 'suggestion',
                category: 'structural',
                status: 'open',
                data: { nodeId: node.id },
                evidence: { nodeIds: [node.id], edgeIds: (edgesByTarget.get(node.id) ?? []).map((e) => e.id) },
            });
        }
        // A non-gateway node with 2+ outgoing edges is a modelling-convention
        // smell, not a structural error: PML's documented mechanism for genuine
        // concurrency is an explicit `decision(AND)` gateway (whose branches all
        // render as equally-weighted main flow — see 01_PML_Language_Specification.md
        // §"flow classification"), not a plain task/event with multiple outgoing
        // edges. Left implicit, flow classification treats one edge as the "main"
        // continuation and the rest as alternates (same rule it applies to a
        // decision's non-primary outcomes) — misleading if the branches are
        // actually meant to happen together, and ambiguous either way to a reader.
        if (!isGatewayNodeKind(node.type) && (outgoingCount.get(node.id) || 0) > 1) {
            suggestions.push({
                code: 'IMPLICIT_PARALLEL_FORK',
                message: `"${node.id}" has ${outgoingCount.get(node.id)} outgoing edges but isn't a gateway. If these happen concurrently, model as an explicit "decision(AND)" gateway (branches render as equally-weighted main flow, not one main + alternates); if they're mutually exclusive, model as a "decision" with named outcomes.`,
                severity: 'suggestion',
                category: 'semantic',
                status: 'open',
                data: { nodeId: node.id },
                evidence: { nodeIds: [node.id], edgeIds: (edgesBySource.get(node.id) ?? []).map((e) => e.id) },
            });
        }
        // A decision with exactly one outcome isn't structurally invalid (that's
        // DECISION_NO_OUTCOMES, a hard error for zero) but it's a near-certain
        // sign the alternate/exception branch hasn't been modelled yet — a
        // single-outcome gateway isn't really a decision.
        if (node.type === 'decision' && (node.outcomes?.length ?? 0) === 1) {
            suggestions.push({
                code: 'DECISION_SINGLE_OUTCOME',
                message: `Decision "${node.id}" has only one outcome ("${node.outcomes[0]}") — a decision with a single branch usually means the alternate or exception path hasn't been modelled yet.`,
                severity: 'suggestion',
                category: 'completeness',
                status: 'open',
                data: { nodeId: node.id },
                evidence: { nodeIds: [node.id], edgeIds: (edgesBySource.get(node.id) ?? []).map((e) => e.id) },
            });
        }
        // Actor assignment is exactly the kind of gap PML_SYSTEM_PROMPT already
        // asks the AI to infer from context (behavioral rule 7) — surfacing it
        // as a suggestion means the AI sees it as a known fact, not something it
        // has to notice by re-reading the whole snippet.
        if (node.type === 'task' && !node.actor) {
            suggestions.push({
                code: 'TASK_NO_ACTOR',
                message: `Task "${node.id}" has no actor assigned.`,
                severity: 'suggestion',
                category: 'completeness',
                status: 'open',
                data: { nodeId: node.id },
                evidence: { nodeIds: [node.id], edgeIds: [] },
            });
        }
        // A node with zero edges in either direction is disconnected from the
        // rest of the process entirely — distinct from NODE_CANNOT_REACH_TERMINAL
        // (validateNormalizedGraphContract), which flags nodes that connect to
        // something but can't reach an outbound/terminal event. This is the
        // stricter, cheaper "is it wired up to anything at all" case — a very
        // common mid-edit state (a node just added, not yet connected) worth
        // surfacing as a nudge rather than a validation failure.
        if ((node.type === 'task' || node.type === 'decision' || node.type === 'event') &&
            (outgoingCount.get(node.id) || 0) === 0 &&
            (incomingCount.get(node.id) || 0) === 0) {
            suggestions.push({
                code: 'NODE_ORPHANED',
                message: `${node.type[0].toUpperCase()}${node.type.slice(1)} "${node.id}" has no incoming or outgoing edges — it isn't connected to the rest of the process yet.`,
                severity: 'suggestion',
                category: 'structural',
                status: 'open',
                data: { nodeId: node.id },
                evidence: { nodeIds: [node.id], edgeIds: [] },
            });
        }
    }
    // CROSS_ACTOR_EDGE_UNTAGGED: a soft nudge, not a hard rule — crossing
    // actors doesn't automatically mean "message." Deliberately narrow: only
    // fires when the edge is at 'normalFlow' — which pmlToNormalizedGraph.ts's
    // `edge.semanticRole || 'normalFlow'` assigns to EVERY edge that never had
    // an explicit semanticRole set (there is no separate "truly unset" state
    // in the normalized graph; normalFlow IS the unset/default value — see
    // pmlGenerator.ts's serializer, which likewise treats normalFlow as "omit
    // from output text"). Anything other than normalFlow (messageFlow,
    // exceptionFlow, etc.) is a deliberate author/AI choice and must not be
    // flagged. See 01_PML_Language_Specification.md's messageFlow guidance and
    // pml-modeller-web's PML_SYSTEM_PROMPT for the same distinction taught to
    // the AI — this is the structured-fact counterpart of that prompt rule
    // (docs/FINAL/09_Modelling_Conventions.md's "AI reasons over data, not
    // prose" pattern).
    const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
    for (const edge of graph.edges) {
        if (edge.semanticRole && edge.semanticRole !== 'normalFlow')
            continue;
        const sourceActor = nodeById.get(edge.source)?.actor;
        const targetActor = nodeById.get(edge.target)?.actor;
        if (!sourceActor || !targetActor || sourceActor === targetActor)
            continue;
        suggestions.push({
            code: 'CROSS_ACTOR_EDGE_UNTAGGED',
            message: `Edge "${edge.source} > ${edge.target}" crosses from ${sourceActor} to ${targetActor} with no semanticRole set. If this represents a message/handoff between actors, consider tagging it semanticRole=messageFlow; if it's just an ordinary next step, this can be left as-is.`,
            severity: 'suggestion',
            category: 'semantic',
            status: 'open',
            data: { edgeId: edge.id },
            evidence: { nodeIds: [edge.source, edge.target], edgeIds: [edge.id] },
        });
    }
    return suggestions;
}
export function assertNoValidationErrors(result) {
    if (result.errors.length === 0) {
        return;
    }
    const message = result.errors.map((e) => `[${e.code}] ${e.message}`).join('; ');
    throw new Error(`PML contract validation failed: ${message}`);
}
