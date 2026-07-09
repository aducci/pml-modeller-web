import { NormalizedProcessGraph } from '../normalizedGraph';
import type { ProcessDiagnostic } from '../diagnostics';
import type { PmlProcessModel } from './pmlToNormalizedGraph';
export type ValidationMode = 'strict' | 'loose';
export interface ValidationIssue extends ProcessDiagnostic {
}
export interface ValidationResult {
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
}
export declare function validatePmlModelInput(pmlModel: PmlProcessModel, mode?: ValidationMode): ValidationResult;
export declare function validateNormalizedGraphContract(graph: NormalizedProcessGraph, mode?: ValidationMode): ValidationResult;
export declare function validatePmlAndGraph(pmlModel: PmlProcessModel, graph: NormalizedProcessGraph, mode?: ValidationMode): ValidationResult;
export declare function assertNoValidationErrors(result: ValidationResult): void;
//# sourceMappingURL=contractGuards.d.ts.map