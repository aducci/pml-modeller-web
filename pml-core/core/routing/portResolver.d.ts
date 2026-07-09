/**
 * Port Resolver — Single controller for port rule selection, blocked-port
 * detection, downgrade logging, and geometry mode selection.
 *
 * IP-1: Full 11-scenario rule registry (kebab-case per spec Section 25.1),
 *        geometry mode selection from CrossLaneAlignmentContext,
 *        and basic channel-saturation / congestion detection stubs.
 */
import { LayoutNode, PortAssignmentRule, PortSide, ConcretePortSide, RoutingContext, CrossLaneAlignmentContext, CrossLaneGeometryMode } from '../processLayout/layoutTypes';
import { FlowLayerBias } from './scenarioResolver';
export interface PortResolution {
    sourceRequested: PortSide;
    targetRequested: PortSide;
    sourceSelected: ConcretePortSide;
    targetSelected: ConcretePortSide;
    sourceDowngradeReason?: string;
    targetDowngradeReason?: string;
    lockedViolations: string[];
}
export interface PortAssignmentResult {
    rule: PortAssignmentRule;
    resolution: PortResolution;
    selectedGeometryMode?: CrossLaneGeometryMode;
}
export declare const DEFAULT_PORT_RULES: Record<string, PortAssignmentRule>;
export declare function resolvePortAssignment(scenarioKey: string, source: LayoutNode, target: LayoutNode, context: RoutingContext, crossLaneContext?: CrossLaneAlignmentContext, portRuleOverrides?: Record<string, PortAssignmentRule>, flowLayerBias?: FlowLayerBias, matchedFlow?: PortAssignmentRule): PortAssignmentResult;
//# sourceMappingURL=portResolver.d.ts.map