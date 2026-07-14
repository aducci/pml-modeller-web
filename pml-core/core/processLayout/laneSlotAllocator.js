// Stage helper: Lane Slot Allocator
// Owns the vertical-stacking concern within a depth-lane cell.
// reads:  nodes (chainIndex, id, layoutHeight, height), laneTop, laneBottom, nodeGap
// writes: returns { id, y }[] without mutating input nodes
import { effectiveSize } from './elementSizing';
/**
 * layoutAutoArrange.ts pins this metadata key on a trial node while
 * searching for a within-lane row swap that clears a defect — it wins over
 * chain index (but not over another forced index) so the search can
 * actually observe the effect of the swap instead of the strategy
 * re-deriving the same order from chain data.
 */
function forcedSlotIndexOf(node) {
    const value = node.metadata?.forcedSlotIndex;
    return typeof value === 'number' ? value : undefined;
}
/**
 * ChainIndexStrategy — preserves existing sort: chain index ascending,
 * then lexical node ID for tie-breaking. This is the default and produces
 * the same output as the original inline sort.
 */
export const ChainIndexStrategy = {
    sort(nodes) {
        return nodes.slice().sort((a, b) => {
            const aForced = forcedSlotIndexOf(a);
            const bForced = forcedSlotIndexOf(b);
            if (aForced !== undefined || bForced !== undefined) {
                return (aForced ?? Number.MAX_SAFE_INTEGER) - (bForced ?? Number.MAX_SAFE_INTEGER);
            }
            const aChain = a.chainIndex ?? Number.MAX_SAFE_INTEGER;
            const bChain = b.chainIndex ?? Number.MAX_SAFE_INTEGER;
            if (aChain !== bChain)
                return aChain - bChain;
            return a.id.localeCompare(b.id);
        });
    },
};
/**
 * BarycentreStrategy — sorts by mean Y of already-positioned neighbours.
 * Reduces edge bend count in dense depth-lane cells by ordering nodes to
 * match the vertical distribution of their connections.
 * Falls back to ChainIndexStrategy for nodes without positioned neighbours.
 */
export const BarycentreStrategy = {
    sort(nodes, context) {
        const scores = new Map();
        for (const node of nodes) {
            const inEdges = context.incomingByTarget.get(node.id) ?? [];
            const outEdges = context.outgoingBySource.get(node.id) ?? [];
            let sum = 0;
            let count = 0;
            for (const e of inEdges) {
                const src = context.nodeById.get(e.source);
                if (src?.y !== undefined) {
                    sum += src.y;
                    count++;
                }
            }
            for (const e of outEdges) {
                const tgt = context.nodeById.get(e.target);
                if (tgt?.y !== undefined) {
                    sum += tgt.y;
                    count++;
                }
            }
            scores.set(node.id, count > 0 ? sum / count : Number.MAX_SAFE_INTEGER);
        }
        return nodes.slice().sort((a, b) => {
            const aForced = forcedSlotIndexOf(a);
            const bForced = forcedSlotIndexOf(b);
            if (aForced !== undefined || bForced !== undefined) {
                return (aForced ?? Number.MAX_SAFE_INTEGER) - (bForced ?? Number.MAX_SAFE_INTEGER);
            }
            const sa = scores.get(a.id) ?? Number.MAX_SAFE_INTEGER;
            const sb = scores.get(b.id) ?? Number.MAX_SAFE_INTEGER;
            if (sa !== sb)
                return sa - sb;
            // Fall back to chain index, then lexical
            const aChain = a.chainIndex ?? Number.MAX_SAFE_INTEGER;
            const bChain = b.chainIndex ?? Number.MAX_SAFE_INTEGER;
            if (aChain !== bChain)
                return aChain - bChain;
            return a.id.localeCompare(b.id);
        });
    },
};
export class LaneSlotAllocator {
    constructor(strategy = ChainIndexStrategy) {
        Object.defineProperty(this, "strategy", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: strategy
        });
    }
    /**
     * Assign Y coordinates to a group of nodes stacked vertically within a lane cell.
     * @param nodes      Nodes in this depth-lane group (unsorted)
     * @param laneTop    Top of the usable packing area (inclusive)
     * @param laneBottom Bottom of the usable packing area (exclusive)
     * @param nodeGap    Vertical gap between stacked nodes
     * @param context    Neighbourhood context for barycentric scoring
     */
    allocate(nodes, laneTop, laneBottom, nodeGap, context) {
        if (nodes.length === 0)
            return [];
        const ordered = this.strategy.sort(nodes, context);
        const totalHeight = ordered.reduce((sum, n) => sum + effectiveSize(n).height, 0)
            + Math.max(0, ordered.length - 1) * nodeGap;
        const available = laneBottom - laneTop;
        const startY = totalHeight <= available
            ? laneTop + (available - totalHeight) / 2
            : laneTop;
        let currentY = startY;
        return ordered.map((node) => {
            const h = effectiveSize(node).height;
            const y = currentY + h / 2;
            currentY += h + nodeGap;
            return { id: node.id, y };
        });
    }
}
