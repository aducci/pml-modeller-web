import { LayoutState, LayoutSettings } from './layoutTypes';
export declare function applyLaneDensityPolicy(state: LayoutState): void;
export declare function updateLaneActiveChannels(state: LayoutState, edgeChannels: Map<string, number>): void;
export declare function expandLanesForRoutingChannels(state: LayoutState): void;
export declare function applyContinuityAlignmentLocks(state: LayoutState): void;
export declare function applyMixedRelayXLocks(state: LayoutState): void;
export declare function resolveLoopbackStyle(mode: LayoutSettings['routing']['loopbackEscapeMode']): 'edge-slot' | 'over-swimlane' | 'cross-lane';
//# sourceMappingURL=routingPost.d.ts.map