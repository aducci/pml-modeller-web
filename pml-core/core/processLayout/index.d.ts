/**
 * Process Layout Orchestrator
 *
 * Four-phase pipeline that transforms a normalized process graph into a fully
 * positioned and routed layout result.
 *
 * Phase A — Graph:    ingest → rank → key-flow → chain detection
 * Phase B — Geometry: lane geometry → depth folding → coordinates → gateway → spatial negotiation
 * Phase C — Routing:  channel allocation → lane expansion → edge routing
 * Phase D — Analysis: convergence metrics → diagnostics → bounds finalization
 */
import { NormalizedProcessGraph } from '../normalizedGraph';
import { LayoutResult, LayoutState, LayoutContext, LayoutSettings, DeepPartial } from './layoutTypes';
export declare function computeProcessLayout(graph: NormalizedProcessGraph, settingOverrides?: DeepPartial<LayoutSettings>): LayoutResult;
export type { LayoutResult, LayoutState, LayoutContext };
//# sourceMappingURL=index.d.ts.map