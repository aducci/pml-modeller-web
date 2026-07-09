/**
 * PML Patch Operations
 *
 * Structured operations that an AI (or any caller) can propose against a
 * PML process model. Patches are applied to the parsed PmlProcessModel,
 * then the result is serialised back to PML text via pmlGenerator.
 *
 * This keeps the PML text as the system of record — every patch round-trips
 * through parse → apply → generate → validate → set.
 */
import { generatePml } from './adapters/pmlGenerator';
import { pmlToNormalizedGraph } from './adapters/pmlToNormalizedGraph';
import { parsePmlTextToProcessModel } from './adapters/pmlTextParser';
/**
 * Apply an array of patches to a PmlProcessModel and produce new PML text.
 *
 * 1. Parse the current PML text into PmlProcessModel
 * 2. Apply each patch operation to the model in order
 * 3. Generate new PML text from the modified model
 * 4. Convert to NormalizedProcessGraph for validation
 *
 * Returns the new PML text + graph, or an error if any patch fails.
 */
export function applyPatches(currentPml, patches, mode = 'accept-all') {
    let model;
    try {
        model = parsePmlTextToProcessModel(currentPml);
    }
    catch (err) {
        return {
            success: false,
            error: `Failed to parse current PML: ${err instanceof Error ? err.message : String(err)}`,
            patchesApplied: 0,
        };
    }
    let patchesApplied = 0;
    for (const patch of patches) {
        try {
            applySinglePatch(model, patch);
            patchesApplied++;
        }
        catch (err) {
            if (mode === 'accept-first') {
                return {
                    success: false,
                    error: `Patch failed at index ${patchesApplied}: ${err instanceof Error ? err.message : String(err)}`,
                    patchesApplied,
                };
            }
            // accept-all: skip failed patches and continue
            console.warn(`Skipping failed patch at index ${patchesApplied}:`, err);
        }
    }
    if (patchesApplied === 0) {
        return {
            success: true,
            pml: currentPml,
            patchesApplied: 0,
            error: 'No patches were applied',
        };
    }
    // Convert model → graph → PML text
    let graph;
    try {
        graph = pmlToNormalizedGraph(model);
    }
    catch (err) {
        return {
            success: false,
            error: `Failed to convert patched model to graph: ${err instanceof Error ? err.message : String(err)}`,
            patchesApplied,
        };
    }
    const newPml = generatePml(graph);
    return {
        success: true,
        pml: newPml,
        graph,
        patchesApplied,
    };
}
// ---------------------------------------------------------------------------
// Single patch application
// ---------------------------------------------------------------------------
function applySinglePatch(model, patch) {
    switch (patch.op) {
        case 'add-node':
            return applyAddNode(model, patch);
        case 'update-node':
            return applyUpdateNode(model, patch);
        case 'remove-node':
            return applyRemoveNode(model, patch);
        case 'add-edge':
            return applyAddEdge(model, patch);
        case 'update-edge':
            return applyUpdateEdge(model, patch);
        case 'remove-edge':
            return applyRemoveEdge(model, patch);
        case 'update-process':
            return applyUpdateProcess(model, patch);
    }
}
// ---------------------------------------------------------------------------
// Individual patch handlers
// ---------------------------------------------------------------------------
function applyAddNode(model, patch) {
    const { id, type, label, actor, scope, taskType, direction, eventType, outcomes, process, metadata } = patch.node;
    // Check for duplicate id
    const allNodes = getNodeGroups(model).flat();
    if (allNodes.some((n) => n.id === id)) {
        throw new Error(`Node '${id}' already exists`);
    }
    const nodeBase = {
        id,
        label: label ?? id,
        actor: actor,
        scope: scope,
        metadata,
        sourceRange: undefined,
    };
    switch (type) {
        case 'event': {
            if (!model.events)
                model.events = [];
            model.events.push({
                ...nodeBase,
                direction: direction,
                type: eventType,
            });
            break;
        }
        case 'task': {
            if (!model.tasks)
                model.tasks = [];
            model.tasks.push({
                ...nodeBase,
                taskType: taskType,
            });
            break;
        }
        case 'decision': {
            if (!model.decisions)
                model.decisions = [];
            model.decisions.push({
                ...nodeBase,
                outcomes: (outcomes ?? []),
            });
            break;
        }
        /* 'route' removed in v2.7 — use 'decision' instead */
        case 'subprocess': {
            if (!model.subprocesses)
                model.subprocesses = [];
            model.subprocesses.push({
                ...nodeBase,
                process: process,
                collapsed: true,
            });
            break;
        }
        case 'actor': {
            if (!model.actors)
                model.actors = [];
            model.actors.push({ id, label: label ?? id });
            break;
        }
    }
}
function applyUpdateNode(model, patch) {
    const { nodeId, field, value } = patch;
    // Search all node groups
    for (const group of getNodeGroups(model)) {
        if (!group)
            continue;
        const node = group.find((n) => n.id === nodeId);
        if (node) {
            if (field === 'metadata') {
                node.metadata = { ...(node.metadata || {}), ...value };
            }
            else {
                node[field] = value;
            }
            return;
        }
    }
    throw new Error(`Node '${nodeId}' not found`);
}
function applyRemoveNode(model, patch) {
    const { nodeId } = patch;
    // Remove from all node groups
    for (const group of getNodeGroups(model)) {
        if (!group)
            continue;
        const idx = group.findIndex((n) => n.id === nodeId);
        if (idx >= 0) {
            group.splice(idx, 1);
            break;
        }
    }
    // Remove associated edges
    if (model.edges) {
        model.edges = model.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    }
}
function applyAddEdge(model, patch) {
    const { source, target, condition, label, keyFlow, loop, flowLayer, semanticRole } = patch.edge;
    if (!model.edges)
        model.edges = [];
    // Prevent duplicate edges
    const exists = model.edges.some((e) => e.source === source && e.target === target && e.condition === condition);
    if (exists) {
        throw new Error(`Edge '${source} → ${target}' already exists`);
    }
    model.edges.push({
        source,
        target,
        condition,
        label,
        keyFlow: keyFlow ?? false,
        loop: loop ?? false,
        flowLayer: flowLayer ?? 'main',
        semanticRole: semanticRole ?? 'normalFlow',
    });
}
function applyUpdateEdge(model, patch) {
    const { edgeId, field, value } = patch;
    if (!model.edges)
        throw new Error('No edges in model');
    const edge = model.edges.find((e) => {
        // Match by id if available, otherwise by source+target
        return e.id === edgeId;
    });
    if (!edge)
        throw new Error(`Edge '${edgeId}' not found`);
    edge[field] = value;
}
function applyRemoveEdge(model, patch) {
    if (!model.edges)
        return;
    if (patch.edgeId) {
        model.edges = model.edges.filter((e) => e.id !== patch.edgeId);
    }
    else if (patch.source && patch.target) {
        model.edges = model.edges.filter((e) => !(e.source === patch.source && e.target === patch.target && (!patch.condition || e.condition === patch.condition)));
    }
}
function applyUpdateProcess(model, patch) {
    const { field, value } = patch;
    switch (field) {
        case 'name':
            model.name = value;
            break;
        case 'level':
            model.level = value;
            break;
        case 'parent':
            model.parent = value;
            break;
        case 'version':
            model.version = value;
            break;
        case 'status':
            model.status = value;
            break;
    }
}
function getNodeGroups(model) {
    return [
        model.events ?? [],
        model.tasks ?? [],
        model.decisions ?? [],
        model.routes ?? [],
        model.subprocesses ?? [],
    ];
}
