import { getLaneIndexMap } from './stageHelpers';
import { mustGetNode } from '../nodeLookup';
export function allocateChannels(edges, nodes, lanes, settings) {
    const isVirtual = settings?.layout.laneMode === 'virtual';
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const laneOrder = getLaneIndexMap(lanes);
    const edgeChannels = new Map();
    const channelOccupancy = new Map();
    // Virtual-lane short-circuit: all edges share channel 0
    if (isVirtual) {
        for (const edge of edges) {
            edgeChannels.set(edge.id, 0);
            const list = channelOccupancy.get(0) ?? [];
            list.push(edge.id);
            channelOccupancy.set(0, list);
        }
        return {
            edgeChannels,
            channelOccupancy,
            stats: { maxTier: 0, allocatedEdges: edges.length },
        };
    }
    const pairUsage = new Map();
    const loopbackUsage = new Map();
    // Geometric priority: cross-lane edges first (wider spans claim lower tiers),
    // then by depth delta descending, then lexical ID for determinism.
    const sortedEdges = edges.slice().sort((a, b) => {
        const aSrc = nodeMap.get(a.source);
        const aTgt = nodeMap.get(a.target);
        const bSrc = nodeMap.get(b.source);
        const bTgt = nodeMap.get(b.target);
        const aLaneDist = aSrc?.laneId && aTgt?.laneId
            ? Math.abs((laneOrder.get(aSrc.laneId) ?? 0) - (laneOrder.get(aTgt.laneId) ?? 0))
            : 0;
        const bLaneDist = bSrc?.laneId && bTgt?.laneId
            ? Math.abs((laneOrder.get(bSrc.laneId) ?? 0) - (laneOrder.get(bTgt.laneId) ?? 0))
            : 0;
        if (aLaneDist !== bLaneDist)
            return bLaneDist - aLaneDist;
        const aDepthDelta = Math.abs((aTgt?.depth ?? 0) - (aSrc?.depth ?? 0));
        const bDepthDelta = Math.abs((bTgt?.depth ?? 0) - (bSrc?.depth ?? 0));
        if (aDepthDelta !== bDepthDelta)
            return bDepthDelta - aDepthDelta;
        return a.id.localeCompare(b.id);
    });
    for (const edge of sortedEdges) {
        const source = mustGetNode(nodeMap, edge.source);
        const target = mustGetNode(nodeMap, edge.target);
        let channel = 0;
        if (!source.laneId || !target.laneId) {
            channel = 0;
        }
        else {
            const sourceLane = laneOrder.get(source.laneId);
            const targetLane = laneOrder.get(target.laneId);
            if (sourceLane === undefined || targetLane === undefined) {
                channel = 0;
            }
            else {
                const delta = targetLane - sourceLane;
                const sourceDepth = source.depth ?? 0;
                const targetDepth = target.depth ?? 0;
                if (delta === 0) {
                    if (targetDepth < sourceDepth) {
                        const sourceY = source.y ?? 0;
                        const targetY = target.y ?? 0;
                        const useBottomRail = sourceY > targetY;
                        const loopSide = useBottomRail ? 'bottom' : 'top';
                        const loopKey = `${source.laneId}|${loopSide}`;
                        const used = loopbackUsage.get(loopKey) || 0;
                        channel = useBottomRail ? used + 1 : -(used + 1);
                        loopbackUsage.set(loopKey, used + 1);
                    }
                    else {
                        channel = 0;
                    }
                }
                else {
                    const direction = Math.sign(delta);
                    const pairKey = `${sourceLane}->${targetLane}:${direction}`;
                    const used = pairUsage.get(pairKey) || 0;
                    const tier = Math.abs(delta) + used;
                    channel = direction * tier;
                    pairUsage.set(pairKey, used + 1);
                }
            }
        }
        edgeChannels.set(edge.id, channel);
        const occupancy = channelOccupancy.get(channel) || [];
        occupancy.push(edge.id);
        channelOccupancy.set(channel, occupancy);
    }
    const maxTier = Array.from(edgeChannels.values()).reduce((max, channel) => {
        return Math.max(max, Math.abs(channel));
    }, 0);
    return {
        edgeChannels,
        channelOccupancy,
        stats: {
            maxTier,
            allocatedEdges: edgeChannels.size,
        },
    };
}
