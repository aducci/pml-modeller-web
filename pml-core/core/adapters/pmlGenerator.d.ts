/**
 * PML Generator
 *
 * Full round-trip serialiser: NormalizedProcessGraph → PML text.
 * Mirrors every construct the parser handles so that
 *   parsePmlTextToProcessModel(generatePml(graph))
 * preserves all semantics.
 */
import { NormalizedProcessGraph } from '../normalizedGraph';
export declare function generatePml(graph: NormalizedProcessGraph): string;
//# sourceMappingURL=pmlGenerator.d.ts.map