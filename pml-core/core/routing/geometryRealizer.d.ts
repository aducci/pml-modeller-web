/**
 * Geometry Realizer — Single controller for Layer C waypoint generation.
 *
 * Converts port assignment + elbow Y policy + cross-lane geometry mode
 * into concrete waypoints. Uses nodeGeometry.ts for typed anchor points.
 *
 * IP-1: All 5 ElbowYPolicy variants + all 6 CrossLaneGeometryMode variants.
 */
import { LayoutNode, PortAssignmentRule, ConcretePortSide, CrossLaneGeometryMode, Point, RoutingContext } from '../processLayout/layoutTypes';
import { PortResolution } from './portResolver';
import { ScenarioResolution } from './scenarioResolver';
export interface GeometryResult {
    waypoints: Point[];
    bendType: 'h-first' | 'v-first' | 'h-v-h' | 'v-h-v' | 'straight';
    sourceAnchor: {
        side: ConcretePortSide;
        x: number;
        y: number;
    };
    targetAnchor: {
        side: ConcretePortSide;
        x: number;
        y: number;
    };
    hardSideContractCorrected: boolean;
    selectedGeometryMode?: CrossLaneGeometryMode;
    description: string;
}
export declare function realizeWaypoints(portResolution: PortResolution, scenario: ScenarioResolution, source: LayoutNode, target: LayoutNode, rule: PortAssignmentRule, context: RoutingContext, channel: number, laneTopBufferPx: number, selectedGeometryMode?: CrossLaneGeometryMode): GeometryResult;
//# sourceMappingURL=geometryRealizer.d.ts.map