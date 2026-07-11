/**
 * pmlParser adapter provides a clean interface to the existing grammar/parsing
 * utilities without polluting the new controllers.
 */
import { parsePmlTextToProcessModel } from '../core/adapters/pmlTextParser';
import { pmlToNormalizedGraphWithDiagnostics } from '../core/adapters/pmlToNormalizedGraph';
import { inferFlowClassification } from '../core/flowClassification';
/**
 * Extract process interface references from PML content.
 * Looks for edges with process target syntax: `node -> [process-name]`
 */
function extractProcessInterfaces(content) {
    const lines = content.split(/\r?\n/);
    const interfaces = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match: source -> [process-name] or any chain containing -> [process]
        const match = line.match(/([A-Za-z0-9_-]+)\s*->\s*\[([A-Za-z0-9_.-]+)\]/);
        if (match) {
            const sourceRange = {
                startLine: i + 1,
                startColumn: (match.index ?? 0) + 1,
                endLine: i + 1,
                endColumn: (match.index ?? 0) + match[0].length + 1,
            };
            interfaces.push({
                sourceNodeId: match[1],
                processName: match[2],
                sourceRange,
            });
        }
    }
    return interfaces;
}
export function parsePml(content, options) {
    try {
        const rawModel = inferFlowClassification(parsePmlTextToProcessModel(content), options?.flowClassification ?? 'explicit');
        const { graph, warnings } = pmlToNormalizedGraphWithDiagnostics(rawModel, {
            validationMode: options?.validationMode ?? 'strict',
        });
        const processInterfaces = extractProcessInterfaces(content);
        return {
            raw: content,
            model: rawModel,
            graph: graph,
            diagnostics: [...(rawModel.parserIssues ?? []), ...warnings],
            processInterfaces,
        };
    }
    catch (err) {
        console.error('Failed to parse PML', err);
        return {
            raw: content,
            model: null,
            graph: null,
            diagnostics: [{
                    code: 'PARSE_ERROR',
                    message: err instanceof Error ? err.message : 'Unknown parse error',
                    severity: 'error'
                }],
            processInterfaces: [],
        };
    }
}
