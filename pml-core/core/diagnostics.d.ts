export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'suggestion';
export interface DiagnosticSourceRange {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}
/**
 * Where a value or finding came from, and how sure we are of it.
 *
 * Distinguishes three separate concepts that a single confidence flag
 * conflates: *where* a value originated, its *epistemic status*, and (only
 * when inferred) a numeric confidence. See
 * docs/FINAL/11_AI_Conversational_Layer_Discussion.md §5.4 and
 * docs/FINAL/12_AI_Layer_Reconciliation_and_Build_Plan.md Phase A.
 *
 * `confidence` is only meaningful when `status` is `'inferred'` — a
 * user-confirmed value doesn't get a confidence score for its own statement.
 */
export interface Provenance {
    source: 'user' | 'ai' | 'rule' | 'import';
    status: 'confirmed' | 'inferred' | 'unknown' | 'conflicted';
    confidence?: number;
}
export interface ProcessDiagnostic {
    code: string;
    message: string;
    severity: DiagnosticSeverity;
    source?: DiagnosticSourceRange;
    data?: Record<string, unknown>;
    /**
     * Optional automated fix for this diagnostic.
     * When present, the UI shows a "Fix" button that applies the patch directly.
     */
    fix?: {
        /** Label for the fix button, e.g. "Replace with >" */
        label: string;
        /** The correction to apply */
        correction: string;
        /** If true, apply replaces the entire line; if false, replaces just the source range */
        replaceLine?: boolean;
    };
    /**
     * Quality score impact — how this diagnostic affects the overall model quality rating.
     * 0 = no impact, negative = penalty (e.g. -5), positive = bonus.
     */
    qualityImpact?: number;
    /**
     * Rule taxonomy and lifecycle for `severity: 'suggestion'` diagnostics —
     * i.e. computeProcessSuggestions()'s findings. Optional because 'error'/
     * 'warning'/'info' diagnostics from validateNormalizedGraphContract don't
     * use this lifecycle; only suggestions are tracked as addressable,
     * dismissable findings the AI can act on. See
     * docs/FINAL/11_AI_Conversational_Layer_Discussion.md §5.1.
     */
    category?: 'structural' | 'semantic' | 'completeness' | 'risk' | 'quality';
    status?: 'open' | 'accepted' | 'dismissed' | 'resolved' | 'not-applicable';
    /**
     * All nodes/edges this finding is actually about — generalizes the
     * single-id `data.nodeId`/`data.edgeId` convention to support findings
     * that span multiple elements (e.g. a decision plus both of its outgoing
     * branches). Additive: `data.nodeId`/`data.edgeId` are left as-is on
     * existing rules for backward compatibility with current consumers;
     * `evidence` is the field new consumers (canvas highlighting) should read.
     * See docs/FINAL/13_Phase_E_Findings_Drive_Canvas_Plan.md E.1.
     */
    evidence?: {
        nodeIds: string[];
        edgeIds: string[];
    };
}
/**
 * Compute an overall model quality score from a set of diagnostics.
 * Returns a value from 0–100 where 100 is perfect.
 */
export declare function computeQualityScore(diagnostics: ProcessDiagnostic[]): number;
export interface QualityBreakdown {
    score: number;
    errors: number;
    warnings: number;
    infos: number;
    summary: string;
}
//# sourceMappingURL=diagnostics.d.ts.map