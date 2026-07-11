import { NormalizedProcessGraph } from '../normalizedGraph';
import { DeepPartial, LayoutResult, LayoutSettings } from './layoutTypes';
type ComputeCoreFn = (graph: NormalizedProcessGraph, settingOverrides?: DeepPartial<LayoutSettings>) => LayoutResult;
export declare function applyOverlapAvoidance(graph: NormalizedProcessGraph, settingOverrides: DeepPartial<LayoutSettings> | undefined, baseline: LayoutResult, computeCore: ComputeCoreFn): LayoutResult;
export {};
//# sourceMappingURL=overlapAvoidance.d.ts.map