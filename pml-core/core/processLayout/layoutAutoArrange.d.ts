import { NormalizedProcessGraph } from '../normalizedGraph';
import { DeepPartial, LayoutResult, LayoutSettings } from './layoutTypes';
type ComputeCoreFn = (graph: NormalizedProcessGraph, settingOverrides?: DeepPartial<LayoutSettings>) => LayoutResult;
export declare function applyLayoutAutoArrange(graph: NormalizedProcessGraph, settingOverrides: DeepPartial<LayoutSettings> | undefined, baseline: LayoutResult, computeCore: ComputeCoreFn): LayoutResult;
export {};
//# sourceMappingURL=layoutAutoArrange.d.ts.map