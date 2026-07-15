// Pre-coordinate topology stages:
// - ranking (node depths)
// - key-flow detection
// - flow-chain detection and node chain assignment.
import { computeRanking } from './ranking';
import { LongestPathStrategy, AnnotationKeyFlowStrategy } from './keyFlowPinning';
import { recordStage, buildById } from './stageHelpers';
import { isGatewayNodeKind } from '../nodeKinds';
export function runPreCoordinateStages(state, graph) {
    recordStage(state, 'ranking');
    const ranking = computeNodeDepths(state, graph);
    recordStage(state, 'key-flow');
    const keyFlowStrategy = state.settings.layout.keyFlowStrategy === 'annotation'
        ? AnnotationKeyFlowStrategy
        : LongestPathStrategy;
    const keyFlow = keyFlowStrategy.identify(graph, ranking);
    if (keyFlow.keyFlowPath.length > 0) {
        state.diagnostics.warnings.push(`Key flow pinned with ${keyFlow.keyFlowPath.length} node(s) and score ${keyFlow.score}.`);
    }
    recordStage(state, 'chain-detection');
    const chains = detectFlowChains(state, graph, keyFlow.keyFlowPath);
    state.chains = chains;
    recordStage(state, 'chain-assignment');
    assignNodesToChains(state, chains);
    return state;
}
function computeNodeDepths(state, graph) {
    const ranking = computeRanking(graph, state.groupingStrategy);
    for (const node of state.nodes) {
        node.depth = ranking.ranks.get(node.id) ?? 0;
    }
    state.diagnostics.health.cyclesDetected = ranking.backEdges.length;
    state.diagnostics.health.unreachableNodes = ranking.unreachableNodes.length;
    if (ranking.backEdges.length > 0) {
        state.diagnostics.warnings.push(`Detected ${ranking.backEdges.length} back-edge(s); ranking computed on DAG projection.`);
    }
    if (ranking.unreachableNodes.length > 0) {
        state.diagnostics.warnings.push(`Detected ${ranking.unreachableNodes.length} node(s) unreachable from inbound events.`);
    }
    return ranking;
}
function detectFlowChains(state, graph, keyFlowPath) {
    const chains = [];
    const signatures = new Set();
    const graphNodeMap = buildById(graph.nodes);
    const outgoingBySource = new Map();
    for (const edge of graph.edges) {
        if (!outgoingBySource.has(edge.source)) {
            outgoingBySource.set(edge.source, []);
        }
        outgoingBySource.get(edge.source).push({ source: edge.source, target: edge.target });
    }
    for (const outgoing of outgoingBySource.values()) {
        outgoing.sort((a, b) => a.target.localeCompare(b.target));
    }
    if (keyFlowPath.length > 0) {
        const keyflowSignature = keyFlowPath.join('->');
        signatures.add(keyflowSignature);
        chains.push({
            id: 'chain-keyflow',
            nodeIds: keyFlowPath,
            isPrimary: true,
        });
    }
    for (const eventId of graph.inboundEvents) {
        const chain = traceLinearChain(eventId, graphNodeMap, outgoingBySource);
        const signature = chain.join('->');
        if (chain.length > 0 && !signatures.has(signature)) {
            signatures.add(signature);
            chains.push({
                id: `chain-${chain[0]}-${chains.length}`,
                nodeIds: chain,
                isPrimary: false,
            });
        }
    }
    return chains;
}
function traceLinearChain(startId, graphNodeMap, outgoingBySource) {
    const chain = [startId];
    let current = startId;
    while (true) {
        const outgoing = outgoingBySource.get(current) || [];
        if (outgoing.length !== 1) {
            break;
        }
        const nextId = outgoing[0].target;
        const nextNode = graphNodeMap.get(nextId);
        if (!nextNode || isGatewayNodeKind(nextNode.type) || nextNode.direction === 'outbound') {
            chain.push(nextId);
            break;
        }
        chain.push(nextId);
        current = nextId;
    }
    return chain;
}
function assignNodesToChains(state, chains) {
    const nodeMap = buildById(state.nodes);
    for (let chainIndex = 0; chainIndex < chains.length; chainIndex++) {
        const chain = chains[chainIndex];
        for (let nodeIndex = 0; nodeIndex < chain.nodeIds.length; nodeIndex++) {
            const nodeId = chain.nodeIds[nodeIndex];
            const node = nodeMap.get(nodeId);
            if (node) {
                if (node.chainId && !chain.isPrimary) {
                    continue;
                }
                node.chainId = chain.id;
                node.chainIndex = nodeIndex;
            }
        }
    }
}
