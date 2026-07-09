/**
 * PML to Normalized Graph Adapter
 *
 * Converts PML parser output into the canonical NormalizedProcessGraph
 * contract that feeds the layout engine.
 */
// PML adapter: maps parsed PmlProcessModel into the canonical NormalizedProcessGraph for the layout engine.
// Runs contract validation on both the PML model and resulting graph, inferring sensible defaults (flowLayer, semanticRole, primary inbound).
// TODO: Share scope/flowLayer/semanticRole literal types/constants with parser + validators to avoid drift and duplicated unions.
// TODO: Consider attaching structured validation metadata (node/edge IDs) instead of only logging warnings via console.warn.
// TODO: Split the “convert events/tasks/subprocesses/decisions/routes/edges” sections into small helper functions to simplify pmlToNormalizedGraph.
import { isInboundDirection, isInboundEventNode, isOutboundDirection } from '../nodeKinds';
import { validatePmlModelInput, validateNormalizedGraphContract, assertNoValidationErrors, } from './contractGuards';
function resolveEdgeFlowDefaults(edge) {
    const flowLayer = edge.flowLayer || 'main';
    const semanticRole = edge.semanticRole || 'normalFlow';
    const visibilityDefault = edge.visibilityDefault || (flowLayer === 'hidden' ? 'hidden' : 'shown');
    return {
        flowLayer,
        semanticRole,
        visibilityDefault,
    };
}
function buildProcessCatalogs(catalogs) {
    if (!catalogs || catalogs.length === 0)
        return undefined;
    const result = { risk_register: [], rule_library: [], app_registry: [] };
    for (const catalog of catalogs) {
        result[catalog.kind] = catalog.entries;
    }
    return result;
}
/**
 * Main adapter function
 */
function pmlToNormalizedGraphCore(pmlModel, options = {}) {
    const validationMode = options.validationMode ?? 'strict';
    const modelValidation = validatePmlModelInput(pmlModel, validationMode);
    assertNoValidationErrors(modelValidation);
    const actors = (pmlModel.actors || []).map((a) => ({
        id: a.id,
        label: a.label,
    }));
    const nodes = [];
    const inboundEvents = [];
    const outboundEvents = [];
    // Convert events
    if (pmlModel.events) {
        for (const event of pmlModel.events) {
            const scope = event.scope || 'inScope';
            const node = {
                id: event.id,
                type: 'event',
                label: event.label || event.id,
                actor: event.actor,
                direction: event.direction,
                eventType: event.type || 'message',
                peer: event.source || event.target,
                scope,
                isBoundary: false,
                isPrimary: event.isPrimary,
                metadata: event.metadata || {},
                sourceRange: event.sourceRange,
            };
            nodes.push(node);
            if (isInboundDirection(event.direction)) {
                inboundEvents.push(event.id);
            }
            else if (isOutboundDirection(event.direction)) {
                outboundEvents.push(event.id);
            }
        }
    }
    // If no inbound event is explicitly marked primary, infer from the first inbound event.
    const inboundNodes = nodes.filter((node) => isInboundEventNode(node));
    if (inboundNodes.length > 0 && !inboundNodes.some((node) => Boolean(node.isPrimary))) {
        inboundNodes[0].isPrimary = true;
    }
    // Convert tasks
    if (pmlModel.tasks) {
        for (const task of pmlModel.tasks) {
            const scope = task.scope || 'inScope';
            const node = {
                id: task.id,
                type: 'task',
                label: task.label,
                actor: task.actor,
                scope,
                taskType: task.taskType,
                isBoundary: false,
                metadata: task.metadata || {},
                sourceRange: task.sourceRange,
            };
            nodes.push(node);
        }
    }
    // Convert subprocesses
    if (pmlModel.subprocesses) {
        for (const subprocess of pmlModel.subprocesses) {
            const scope = subprocess.scope || 'inScope';
            const node = {
                id: subprocess.id,
                type: 'subprocess',
                label: subprocess.label || subprocess.id,
                actor: subprocess.actor,
                scope,
                isBoundary: false,
                process: subprocess.process,
                collapsed: subprocess.collapsed,
                inputs: subprocess.inputs,
                outputs: subprocess.outputs,
                metadata: subprocess.metadata || {},
                sourceRange: subprocess.sourceRange,
            };
            nodes.push(node);
        }
    }
    // Convert decisions
    if (pmlModel.decisions) {
        for (const decision of pmlModel.decisions) {
            const scope = decision.scope || 'inScope';
            const node = {
                id: decision.id,
                type: 'decision',
                label: decision.label || decision.id,
                actor: decision.actor,
                scope,
                isBoundary: false,
                gatewayKind: decision.gatewayKind || 'exclusive',
                outcomes: decision.outcomes.map((o) => o.name),
                metadata: decision.metadata || {},
                sourceRange: decision.sourceRange,
            };
            nodes.push(node);
        }
    }
    // Routes → converted to 'decision' nodes with enum coverage
    if (pmlModel.routes) {
        for (const route of pmlModel.routes) {
            const node = {
                id: route.id,
                type: 'decision',
                label: route.label || route.id,
                gatewayKind: 'exclusive',
                outcomes: route.mappings.map((m) => m.value),
                metadata: {},
                sourceRange: route.sourceRange,
            };
            nodes.push(node);
        }
    }
    // Convert or infer edges
    let edges = [];
    if (pmlModel.edges) {
        edges = pmlModel.edges.map((e) => ({
            id: `${e.source}>${e.target}`,
            source: e.source,
            target: e.target,
            condition: e.condition,
            label: e.label,
            keyFlow: e.keyFlow,
            loop: e.loop,
            primary: e.primary,
            ...resolveEdgeFlowDefaults(e),
            revealGroup: e.revealGroup,
            narrative: e.narrative,
            metadata: e.metadata,
            sourceRange: e.sourceRange,
        }));
    }
    const graph = {
        processId: pmlModel.id,
        processName: pmlModel.name,
        level: pmlModel.level,
        parent: pmlModel.parent,
        parentLevel: pmlModel.parentLevel,
        version: pmlModel.version,
        status: pmlModel.status,
        nodes,
        edges,
        actors,
        inboundEvents,
        outboundEvents,
        context: pmlModel.context,
        catalogs: buildProcessCatalogs(pmlModel.catalogs),
    };
    const graphValidation = validateNormalizedGraphContract(graph, validationMode);
    assertNoValidationErrors(graphValidation);
    const warnings = [...modelValidation.warnings, ...graphValidation.warnings];
    for (const warning of warnings) {
        console.warn(`[PML Adapter][${warning.code}] ${warning.message}`);
    }
    return { graph, warnings };
}
export function pmlToNormalizedGraph(pmlModel, options = {}) {
    return pmlToNormalizedGraphCore(pmlModel, options).graph;
}
export function pmlToNormalizedGraphWithDiagnostics(pmlModel, options = {}) {
    return pmlToNormalizedGraphCore(pmlModel, options);
}
/**
 * Safely adapt with error handling
 */
export function pmlToNormalizedGraphSafe(pmlModel, options = {}) {
    try {
        return pmlToNormalizedGraph(pmlModel, options);
    }
    catch (error) {
        console.error('Error adapting PML to normalized graph:', error);
        return null;
    }
}
