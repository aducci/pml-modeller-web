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
export interface EdgeCountRuleConfig {
    code: string;
    shape: 'edgeCount';
    enabled: boolean;
    category: ProcessDiagnostic['category'];
    predicate?: string;
    nodeTypes?: string[];
    direction?: 'outgoing' | 'incoming' | 'both';
    operator?: 'gt' | 'gte' | 'eq' | 'lt' | 'lte';
    threshold?: number;
    messageTemplate: string;
}
export interface FieldMissingRuleConfig {
    code: string;
    shape: 'fieldMissing';
    enabled: boolean;
    category: ProcessDiagnostic['category'];
    nodeType?: string;
    field?: string;
    messageTemplate: string;
}
export interface FieldArrayLengthRuleConfig {
    code: string;
    shape: 'fieldArrayLength';
    enabled: boolean;
    category: ProcessDiagnostic['category'];
    nodeType?: string;
    field?: string;
    operator?: 'gt' | 'gte' | 'eq' | 'lt' | 'lte';
    threshold?: number;
    messageTemplate: string;
}
export interface CrossEndpointFieldRuleConfig {
    code: string;
    shape: 'crossEndpointField';
    enabled: boolean;
    category: ProcessDiagnostic['category'];
    field?: string;
    onlySemanticRole?: string;
    messageTemplate: string;
}
export type RuleConfig = EdgeCountRuleConfig | FieldMissingRuleConfig | FieldArrayLengthRuleConfig | CrossEndpointFieldRuleConfig;
export declare const DEFAULT_RULE_CONFIGS: RuleConfig[];
export declare function validatePmlModelInput(pmlModel: PmlProcessModel, mode?: ValidationMode): ValidationResult;
export declare function validateNormalizedGraphContract(graph: NormalizedProcessGraph, mode?: ValidationMode): ValidationResult;
export declare function validatePmlAndGraph(pmlModel: PmlProcessModel, graph: NormalizedProcessGraph, mode?: ValidationMode): ValidationResult;
export declare function computeProcessSuggestions(graph: NormalizedProcessGraph, configs?: RuleConfig[]): ProcessDiagnostic[];
export declare function assertNoValidationErrors(result: ValidationResult): void;
//# sourceMappingURL=contractGuards.d.ts.map