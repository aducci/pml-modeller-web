import { PmlProcessModel } from './adapters/pmlToNormalizedGraph';
export type FlowClassificationMode = 'explicit' | 'inferred' | 'hybrid';
/**
 * Fills in flowLayer/loop/keyFlow for edges the author left unset, using graph topology:
 * - AND-gateway branches (parallel, concurrent) are all "main" — they aren't alternatives.
 * - Any other branching node — an OR/XOR decision, a route, or an unmodeled fan-out — follows
 *   an explicit `*` (primary) outcome if one exists, else picks whichever branch is closer
 *   (fewer hops) to an outbound event; the rest of that node's branches are "alternate".
 * - An edge whose target is already an ancestor on the current path is a real back-edge (`loop`).
 *
 * Modes:
 * - 'explicit': no inference runs, model is returned unchanged.
 * - 'inferred' / 'hybrid': fills gaps using topology; explicit author tags always win
 *   regardless of which of these two is passed (they are currently equivalent — kept as
 *   two names since callers may want to say which behavior they mean).
 */
export declare function inferFlowClassification(model: PmlProcessModel, mode: FlowClassificationMode): PmlProcessModel;
//# sourceMappingURL=flowClassification.d.ts.map