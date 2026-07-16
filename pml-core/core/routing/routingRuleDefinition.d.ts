/**
 * Routing Rule Definition + matching function
 *
 * A routing rule maps (sourceType × targetType × laneConfig) to a preferred
 * RoutingTypeCode plus ordered alternates with activation conditions.
 *
 * matchRoutingRule() is the single lookup entry point used by pathRouter.
 * Rules are evaluated highest-priority-first; first enabled match wins.
 * '*' matches any value in any dimension.
 */
export type RuleNodeType = 'task' | 'event' | 'gateway' | 'annotation' | 'subprocess' | '*';
export type RuleLaneConfig = 'same-lane' | 'cross-lane-downward' | 'cross-lane-upward' | 'loopback' | 'self-loop' | '*';
export type RuleFlowLayer = 'main' | 'alternate' | 'exception' | '*';
export type RoutingTypeCode = 'STH' | 'STV' | 'SEH' | 'SEV' | 'DEH' | 'DEN' | 'DEF' | 'DEV' | 'DBL' | 'TEH' | 'TEV' | 'SLP' | 'POH' | 'POV' | 'AOT';
/** Human-readable label per routing type code — single source shared by the admin theme panel and the properties inspector. */
export declare const ROUTING_TYPE_LABELS: Record<RoutingTypeCode, string>;
export type AlternateCondition = 'compact-mode' | 'path-blocked' | 'parallel-offset' | 'always';
export interface AlternateRouting {
    type: RoutingTypeCode;
    condition: AlternateCondition;
    /** Lower number = evaluated first among alternates at the same condition. */
    priority: number;
    note?: string;
}
export interface RoutingRuleMatch {
    /** '*' matches any value. */
    sourceType: RuleNodeType;
    targetType: RuleNodeType;
    laneConfig: RuleLaneConfig;
    /** Optional — reserved for future flow-layer filtering. */
    flowLayer?: RuleFlowLayer;
}
export interface RoutingRuleDefinition {
    id: string;
    label: string;
    description: string;
    enabled: boolean;
    /** Higher number = evaluated first. */
    priority: number;
    match: RoutingRuleMatch;
    primary: RoutingTypeCode;
    alternates: AlternateRouting[];
}
export declare const DEFAULT_ROUTING_RULES: RoutingRuleDefinition[];
export interface RuleMatchContext {
    sourceType: RuleNodeType;
    targetType: RuleNodeType;
    laneConfig: RuleLaneConfig;
}
export declare function matchRoutingRule(rules: RoutingRuleDefinition[], ctx: RuleMatchContext): RoutingRuleDefinition | null;
//# sourceMappingURL=routingRuleDefinition.d.ts.map