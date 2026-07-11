/**
 * pmlParser adapter provides a clean interface to the existing grammar/parsing
 * utilities without polluting the new controllers.
 */
import { FlowClassificationMode } from '../core/flowClassification';
import type { ValidationMode } from '../core/adapters/contractGuards';
import type { ProcessInterfaceRef } from '../types';
export declare function parsePml(content: string, options?: {
    flowClassification?: FlowClassificationMode;
    validationMode?: ValidationMode;
}): {
    raw: string;
    model: any;
    graph: any;
    diagnostics: any[];
    processInterfaces: ProcessInterfaceRef[];
};
//# sourceMappingURL=pmlParser.d.ts.map