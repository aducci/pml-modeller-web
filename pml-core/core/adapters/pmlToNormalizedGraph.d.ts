/**
 * PML to Normalized Graph Adapter
 *
 * Converts PML parser output into the canonical NormalizedProcessGraph
 * contract that feeds the layout engine.
 */
import { NormalizedProcessGraph, FlowLayer, SemanticRole } from '../normalizedGraph';
import { ValidationMode, ValidationIssue } from './contractGuards';
import type { DiagnosticSourceRange, ProcessDiagnostic } from '../diagnostics';
export interface PmlProcessModel {
    id: string;
    name: string;
    level?: string;
    parent?: string;
    parentLevel?: string;
    version?: string;
    status?: string;
    parserIssues?: ProcessDiagnostic[];
    headerFirstViolation?: boolean;
    headerFirstViolationSource?: DiagnosticSourceRange;
    actors?: Array<{
        id: string;
        label: string;
    }>;
    events?: Array<{
        id: string;
        label?: string;
        actor?: string;
        direction?: 'inbound' | 'outbound' | 'internal';
        type?: 'message' | 'signal' | 'timer' | 'state';
        source?: string;
        target?: string;
        scope?: 'inScope' | 'external';
        isPrimary?: boolean;
        metadata?: Record<string, any>;
        sourceRange?: DiagnosticSourceRange;
    }>;
    tasks?: Array<{
        id: string;
        label: string;
        actor?: string;
        scope?: 'inScope' | 'external';
        taskType?: string;
        metadata?: Record<string, any>;
        sourceRange?: DiagnosticSourceRange;
    }>;
    subprocesses?: Array<{
        id: string;
        label?: string;
        actor?: string;
        scope?: 'inScope' | 'external';
        process?: string;
        collapsed?: boolean;
        inputs?: string[];
        outputs?: string[];
        metadata?: Record<string, any>;
        sourceRange?: DiagnosticSourceRange;
    }>;
    decisions?: Array<{
        id: string;
        label?: string;
        actor?: string;
        scope?: 'inScope' | 'external';
        metadata?: Record<string, any>;
        outcomes: Array<{
            name: string;
            target: string;
            primary?: boolean;
        }>;
        sourceRange?: DiagnosticSourceRange;
    }>;
    routes?: Array<{
        id: string;
        label?: string;
        enumId: string;
        mappings: Array<{
            value: string;
            target: string;
        }>;
        sourceRange?: DiagnosticSourceRange;
    }>;
    enums?: Array<{
        id: string;
        values: string[];
        sourceRange?: DiagnosticSourceRange;
    }>;
    catalogs?: Array<{
        kind: 'risk_register' | 'rule_library' | 'app_registry';
        entries: Array<{
            id: string;
            description: string;
        }>;
        sourceRange?: DiagnosticSourceRange;
    }>;
    imports?: Array<{
        source: string;
        version?: string;
        alias?: string;
        sourceRange?: DiagnosticSourceRange;
    }>;
    edges?: Array<{
        source: string;
        target: string;
        condition?: string;
        label?: string;
        keyFlow?: boolean;
        loop?: boolean;
        primary?: boolean;
        flowLayer?: FlowLayer;
        semanticRole?: SemanticRole;
        visibilityDefault?: 'shown' | 'hidden';
        revealGroup?: string;
        narrative?: string;
        metadata?: Record<string, any>;
        sourceRange?: DiagnosticSourceRange;
    }>;
    context?: Record<string, any>;
}
export interface PmlAdapterOptions {
    validationMode?: ValidationMode;
}
export interface PmlAdapterResult {
    graph: NormalizedProcessGraph;
    warnings: ValidationIssue[];
}
export declare function pmlToNormalizedGraph(pmlModel: PmlProcessModel, options?: PmlAdapterOptions): NormalizedProcessGraph;
export declare function pmlToNormalizedGraphWithDiagnostics(pmlModel: PmlProcessModel, options?: PmlAdapterOptions): PmlAdapterResult;
/**
 * Safely adapt with error handling
 */
export declare function pmlToNormalizedGraphSafe(pmlModel: PmlProcessModel, options?: PmlAdapterOptions): NormalizedProcessGraph | null;
//# sourceMappingURL=pmlToNormalizedGraph.d.ts.map