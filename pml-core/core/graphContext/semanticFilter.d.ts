/**
 * Semantic Filter — Actor-Centric and Decision-Centric Filters
 *
 * Filters a NormalizedProcessGraph by actor (show all nodes belonging to
 * one actor + connected context) or by decision (show a decision + its
 * branches and reachable nodes). Both filters use depthController for
 * bounded traversal.
 */
import { NormalizedProcessGraph } from '../normalizedGraph';
export interface ActorFilterOptions {
    /** Include boundary (one-hop) context nodes from other actors? Default true. */
    includeBoundaryContext: boolean;
    /** Max depth of boundary context from the actor's nodes. Default 1. */
    boundaryDepth: number;
}
export interface DecisionFilterOptions {
    /** Include inbound context (nodes feeding into the decision)? Default true. */
    includeInbound: boolean;
    /** Max depth for inbound context. Default 1. */
    inboundDepth: number;
    /** Max depth for outgoing branches. Default 2. */
    outboundDepth: number;
}
export declare const DEFAULT_ACTOR_FILTER: ActorFilterOptions;
export declare const DEFAULT_DECISION_FILTER: DecisionFilterOptions;
/**
 * Filters the graph to show only nodes belonging to the specified actor,
 * plus optional one-hop boundary context from other actors.
 */
export declare function filterByActor(graph: NormalizedProcessGraph, actorId: string, options?: Partial<ActorFilterOptions>): {
    nodeIds: Set<string>;
    edgeIds: Set<string>;
    actorIds: Set<string>;
};
/**
 * Filters the graph to show a decision node plus its reachable branches
 * and inbound context.
 */
export declare function filterByDecision(graph: NormalizedProcessGraph, decisionId: string, options?: Partial<DecisionFilterOptions>): {
    nodeIds: Set<string>;
    edgeIds: Set<string>;
    actorIds: Set<string>;
};
//# sourceMappingURL=semanticFilter.d.ts.map