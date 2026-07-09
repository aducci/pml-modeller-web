import { LayoutState } from './layoutTypes';
export declare function assignNodeSlotsWithinLaneDepth(state: LayoutState): LayoutState;
export declare function recomputeTotalBounds(state: LayoutState): void;
/**
 * Pre-reserve corridor space for routing channels in each lane.
 *
 * Estimates how many top/bottom channels each lane will need (by counting
 * cross-lane and loopback edges), then pre-pads lane height by that amount
 * so that `expandLanesForRoutingChannels` (in the routing phase) is a no-op
 * for the common case, reducing layout shift.
 *
 * The pre-reserved amounts are stored on `lane.preReservedTopChannels` and
 * `lane.preReservedBottomChannels` so `expandLanesForRoutingChannels` can
 * subtract them from the actual delta.
 */
export declare function preReserveCorridorSpace(state: LayoutState): void;
//# sourceMappingURL=coordinateAssignment.d.ts.map