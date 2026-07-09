import { LayoutEdge, LayoutNode, Lane, LayoutSettings } from './layoutTypes';
export interface ChannelAllocationResult {
    edgeChannels: Map<string, number>;
    channelOccupancy: Map<number, string[]>;
    stats: {
        maxTier: number;
        allocatedEdges: number;
    };
}
export declare function allocateChannels(edges: LayoutEdge[], nodes: LayoutNode[], lanes: Lane[], settings?: LayoutSettings): ChannelAllocationResult;
//# sourceMappingURL=channelAllocation.d.ts.map