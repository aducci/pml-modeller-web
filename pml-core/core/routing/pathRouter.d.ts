/**
 * Path Router — Layer A→B→C Orchestrator
 *
 * Coordinates the three routing layers per edge:
 *   Layer A: resolveScenario → resolvePortAssignment
 *   Layer B: spatialNegotiation (IP-2)
 *   Layer C: realizeWaypoints → buildRouteWhyPacket
 *
 * Zero inline routing logic. All decisions delegated to specialist modules.
 */
import { LayoutEdge, LayoutNode, Lane } from '../processLayout/layoutTypes';
import { PatternDefinition } from './patternDefinition';
import { RoutingRuleDefinition } from './routingRuleDefinition';
interface RouteEdgeOptions {
    loopbackStyle?: 'edge-slot' | 'over-swimlane' | 'cross-lane';
    edgeChannelStrategy?: 'follow-node' | 'adaptive';
    channelDensityMode?: 'spacious' | 'fit-to-lane' | 'auto';
    crossLaneLaneTopBufferPx?: number;
    debugRoutingSnapshots?: boolean;
    horizontalConnectionsOnly?: boolean;
    compactMode?: boolean;
    parallelOffsetEdgeIds?: Set<string>;
    channelOverrides?: Record<string, number>;
    stackingTolerancePx?: number;
    patternTable?: PatternDefinition[];
    routingRules?: RoutingRuleDefinition[];
    neighborhoodContext?: {
        inDegreeMap: Map<string, number>;
        outDegreeMap: Map<string, number>;
        outTargetLaneIdsMap: Map<string, string[]>;
    };
}
export declare function routeAllEdges(edges: LayoutEdge[], nodes: LayoutNode[], lanes: Lane[], options?: RouteEdgeOptions): LayoutEdge[];
export {};
//# sourceMappingURL=pathRouter.d.ts.map