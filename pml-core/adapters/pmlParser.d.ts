/**
 * pmlParser adapter provides a clean interface to the existing grammar/parsing
 * utilities without polluting the new controllers.
 */
import { FlowClassificationMode } from '../core/flowClassification';
import type { ProcessInterfaceRef } from '../types';
export declare function parsePml(content: string, options?: {
    flowClassification?: FlowClassificationMode;
}): {
    raw: string;
    model: any;
    graph: any;
    diagnostics: any[];
    processInterfaces: ProcessInterfaceRef[];
};
//# sourceMappingURL=pmlParser.d.ts.map