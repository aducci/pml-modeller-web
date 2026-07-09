/**
 * Routing Diagnostics — single controller for RouteWhyPacket and
 * RoutingDiagnosticsV2 assembly (spec Sections 15, 20.4).
 *
 * RouteWhyPacket: compact "30-second debuggability" output per edge.
 * RoutingDiagnosticsV2: full provenance trace with confidence, bundle
 *   candidates, spatial adjustments, and port downgrade chain.
 *
 * Assembly is two-phase:
 *   1. buildRoutingDiagnosticsV2() — per-edge, from routing layers A+C
 *   2. applyBundleResultToDiagnostics() — post-bundle, from world evaluator
 */
import { PortSide, ConcretePortSide, ElbowYPolicy, CrossLaneGeometryMode, RoutingDiagnosticsV2, PortAssignmentRule } from '../processLayout/layoutTypes';
import { PortResolution } from './portResolver';
import { ScenarioResolution } from './scenarioResolver';
import { GeometryResult } from './geometryRealizer';
import { BundleEvaluationResult } from './worldEvaluator';
export interface RouteWhyPacket {
    scenarioKey: string;
    patternFamily: string;
    selectedPatternId: string;
    selectedWorldId?: string;
    crossLaneGeometryMode?: CrossLaneGeometryMode;
    tieBreakReason?: string;
    ports: {
        sourceRequested: PortSide;
        sourceSelected: ConcretePortSide;
        targetRequested: PortSide;
        targetSelected: ConcretePortSide;
    };
    elbowYPolicy: ElbowYPolicy;
    constraintsApplied: string[];
    downgrades: string[];
}
export declare function buildRouteWhyPacket(scenario: ScenarioResolution, portResolution: PortResolution, geometry: GeometryResult, elbowYPolicy: ElbowYPolicy, patternFamily?: string): RouteWhyPacket;
export declare function buildRoutingDiagnosticsV2(scenario: ScenarioResolution, portResolution: PortResolution, geometry: GeometryResult, rule: PortAssignmentRule, channel: number): RoutingDiagnosticsV2;
/** Merges world evaluation results into an existing diagnostics object (mutates in place). */
export declare function applyBundleResultToDiagnostics(diag: RoutingDiagnosticsV2, bundleResult: BundleEvaluationResult): void;
export declare function buildProvenanceString(why: RouteWhyPacket, channel: number, extraTokens?: string[]): string;
export interface RoutingTypeInfo {
    code: string;
    label: string;
    skew: string;
    bendCount: number;
    isDashed: boolean;
}
export declare function deriveRoutingTypeCode(bendType: 'h-first' | 'v-first' | 'h-v-h' | 'v-h-v' | 'straight', sourcePort: ConcretePortSide, targetPort: ConcretePortSide, elbowYPolicy: ElbowYPolicy, scenarioKey: string, channel: number, isSelfLoop: boolean): RoutingTypeInfo;
//# sourceMappingURL=routingDiagnostics.d.ts.map