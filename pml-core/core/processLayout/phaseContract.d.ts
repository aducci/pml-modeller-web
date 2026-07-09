export type PipelinePhase = 'A-graph' | 'B-geometry' | 'C-routing' | 'D-analysis';
export interface PhaseHandoff {
    /** Phase allowed to revise the field after its owning phase. */
    phase: PipelinePhase;
    /** Why this phase, and not the owning phase, has to make the write. */
    reason: string;
    /** Function(s) that perform the write, for grep-ability. */
    writtenBy: string;
}
export interface FieldOwnership {
    owningPhase: PipelinePhase;
    handoffs?: PhaseHandoff[];
}
/** LayoutNode field ownership. */
export declare const NODE_FIELD_OWNERSHIP: Record<string, FieldOwnership>;
/** Lane field ownership. */
export declare const LANE_FIELD_OWNERSHIP: Record<string, FieldOwnership>;
/** LayoutEdge field ownership. */
export declare const EDGE_FIELD_OWNERSHIP: Record<string, FieldOwnership>;
/** No node/lane/edge field may be written after D-analysis begins (see index.ts runAnalysisPhase). */
export declare const FINAL_PHASE: PipelinePhase;
//# sourceMappingURL=phaseContract.d.ts.map