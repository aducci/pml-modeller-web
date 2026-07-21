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
import { NormalizedProcessGraph } from './normalizedGraph';
import { CoreNodeKind } from './nodeKinds';
import { Provenance } from './diagnostics';
export type PatchNodeTargetType = CoreNodeKind | 'actor';
export type PatchTargetType = PatchNodeTargetType | 'edge' | 'process';
export type AddNodeTargetType = PatchNodeTargetType;
/**
 * Shared by every patch op — where this op came from and how sure the
 * proposer is of it. Optional and additive: existing callers that don't set
 * it are unaffected; applySinglePatch ignores it (provenance is metadata for
 * the caller/control-plane layer, not something the patch applicator itself
 * acts on). See docs/FINAL/11_AI_Conversational_Layer_Discussion.md §3.3/§5.4.
 */
export interface PatchProvenance {
    provenance?: Provenance;
}
export interface AddNodePatch extends PatchProvenance {
    op: 'add-node';
    node: {
        id: string;
        type: AddNodeTargetType;
        label?: string;
        actor?: string;
        scope?: 'inScope' | 'external';
        taskType?: 'manual' | 'user' | 'service' | 'script' | 'business_rule';
        direction?: 'inbound' | 'outbound' | 'internal';
        eventType?: 'message' | 'signal' | 'timer' | 'state';
        outcomes?: Array<{
            name: string;
            target: string;
            primary?: boolean;
        }>;
        process?: string;
        metadata?: Record<string, any>;
    };
    /** Insert after this node id (optional — if omitted, appends) */
    after?: string;
}
export interface UpdateNodePatch extends PatchProvenance {
    op: 'update-node';
    nodeId: string;
    field: 'label' | 'actor' | 'scope' | 'taskType' | 'direction' | 'eventType' | 'metadata';
    value: any;
}
export interface RemoveNodePatch extends PatchProvenance {
    op: 'remove-node';
    nodeId: string;
}
export interface AddEdgePatch extends PatchProvenance {
    op: 'add-edge';
    edge: {
        source: string;
        target: string;
        condition?: string;
        label?: string;
        keyFlow?: boolean;
        loop?: boolean;
        flowLayer?: 'main' | 'alternate' | 'message' | 'annotation' | 'hidden';
        semanticRole?: 'normalFlow' | 'messageFlow' | 'exceptionFlow' | 'compensationFlow' | 'eventEscalation' | 'boundaryInterrupt';
    };
}
export interface UpdateEdgePatch extends PatchProvenance {
    op: 'update-edge';
    edgeId: string;
    field: 'condition' | 'label' | 'keyFlow' | 'loop' | 'flowLayer' | 'semanticRole';
    value: any;
}
export interface RemoveEdgePatch extends PatchProvenance {
    op: 'remove-edge';
    /** Either edgeId, or (source + target + condition) to identify */
    edgeId?: string;
    source?: string;
    target?: string;
    condition?: string;
}
export interface UpdateProcessHeaderPatch extends PatchProvenance {
    op: 'update-process';
    field: 'name' | 'level' | 'parent' | 'version' | 'status';
    value: string;
}
export type PmlPatch = AddNodePatch | UpdateNodePatch | RemoveNodePatch | AddEdgePatch | UpdateEdgePatch | RemoveEdgePatch | UpdateProcessHeaderPatch;
export interface PatchResult {
    success: boolean;
    /** The new PML text if successful */
    pml?: string;
    /** The updated normalized graph if successful */
    graph?: NormalizedProcessGraph;
    /** Error message if failed */
    error?: string;
    /** Number of patches applied */
    patchesApplied: number;
}
export type ApplyPatchMode = 'accept-first' | 'accept-all';
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
export declare function applyPatches(currentPml: string, patches: PmlPatch[], mode?: ApplyPatchMode): PatchResult;
//# sourceMappingURL=pmlPatch.d.ts.map