import { LayoutNode, LayoutEdge } from './layoutTypes';
export interface SlotAssignment {
    id: string;
    y: number;
}
export interface SlotOrderingContext {
    incomingByTarget: Map<string, LayoutEdge[]>;
    outgoingBySource: Map<string, LayoutEdge[]>;
    nodeById: Map<string, LayoutNode>;
}
export interface SlotOrderingStrategy {
    sort(nodes: LayoutNode[], context: SlotOrderingContext): LayoutNode[];
}
/**
 * ChainIndexStrategy — preserves existing sort: chain index ascending,
 * then lexical node ID for tie-breaking. This is the default and produces
 * the same output as the original inline sort.
 */
export declare const ChainIndexStrategy: SlotOrderingStrategy;
/**
 * BarycentreStrategy — sorts by mean Y of already-positioned neighbours.
 * Reduces edge bend count in dense depth-lane cells by ordering nodes to
 * match the vertical distribution of their connections.
 * Falls back to ChainIndexStrategy for nodes without positioned neighbours.
 */
export declare const BarycentreStrategy: SlotOrderingStrategy;
export declare class LaneSlotAllocator {
    private readonly strategy;
    constructor(strategy?: SlotOrderingStrategy);
    /**
     * Assign Y coordinates to a group of nodes stacked vertically within a lane cell.
     * @param nodes      Nodes in this depth-lane group (unsorted)
     * @param laneTop    Top of the usable packing area (inclusive)
     * @param laneBottom Bottom of the usable packing area (exclusive)
     * @param nodeGap    Vertical gap between stacked nodes
     * @param context    Neighbourhood context for barycentric scoring
     */
    allocate(nodes: LayoutNode[], laneTop: number, laneBottom: number, nodeGap: number, context: SlotOrderingContext): SlotAssignment[];
}
//# sourceMappingURL=laneSlotAllocator.d.ts.map