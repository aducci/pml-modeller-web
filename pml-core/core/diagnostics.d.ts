export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'suggestion';
export interface DiagnosticSourceRange {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
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