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
import { GraphWindowResult } from './graphWindow';
export interface SerializeOptions {
    /** Include metadata annotations (notes, kpis, risks)? */
    includeMetadata: boolean;
    /** Max lines of output. 0 = no limit. */
    maxLines: number;
    /** Show a header comment explaining what was trimmed? */
    showTrimNote: boolean;
    /** Include the full process header? */
    includeHeader: boolean;
}
export declare const DEFAULT_SERIALIZE_OPTIONS: SerializeOptions;
export declare function serializeWindow(window: GraphWindowResult, options?: Partial<SerializeOptions>): string;
//# sourceMappingURL=pmlSliceSerializer.d.ts.map