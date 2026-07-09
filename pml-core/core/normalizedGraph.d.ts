/**
 * Normalized Process Graph
 *
 * This is the canonical intermediate representation between the PML parser
 * and the layout engine. All views and renderers consume this contract.
 */
import { CoreNodeKind } from './nodeKinds';
export interface NormalizedNode {
    id: string;
    type: CoreNodeKind;
    label: string;
    scope?: 'inScope' | 'external';
    isBoundary?: boolean;
    isPrimary?: boolean;
    direction?: 'inbound' | 'outbound' | 'internal';
    eventType?: 'message' | 'signal' | 'timer' | 'state';
    peer?: string;
    actor?: string;
    taskType?: string;
    outcomes?: string[];
    gatewayKind?: 'exclusive' | 'inclusive' | 'parallel';
    process?: string;
    collapsed?: boolean;
    inputs?: string[];
    outputs?: string[];
    metadata?: Record<string, any>;
    sourceRange?: {
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    };
}
export type FlowLayer = 'main' | 'alternate' | 'message' | 'annotation' | 'hidden';
export type SemanticRole = 'normalFlow' | 'messageFlow' | 'exceptionFlow' | 'compensationFlow' | 'eventEscalation' | 'boundaryInterrupt';
export interface EdgeFlowMetadata {
    flowLayer: FlowLayer;
    semanticRole: SemanticRole;
    visibilityDefault: 'shown' | 'hidden';
    revealGroup?: string;
    narrative?: string;
}
export interface NormalizedEdge {
    id: string;
    source: string;
    target: string;
    condition?: string;
    label?: string;
    keyFlow?: boolean;
    loop?: boolean;
    /** Marks this as the happy-path outcome edge of a decision (the `*` marker). */
    primary?: boolean;
    flowLayer?: FlowLayer;
    semanticRole?: SemanticRole;
    visibilityDefault?: 'shown' | 'hidden';
    revealGroup?: string;
    narrative?: string;
    metadata?: Record<string, any>;
    sourceRange?: {
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    };
}
export interface NormalizedActor {
    id: string;
    label: string;
}
export interface CatalogEntry {
    id: string;
    description: string;
}
export interface ProcessCatalogs {
    risk_register: CatalogEntry[];
    rule_library: CatalogEntry[];
    app_registry: CatalogEntry[];
}
export interface NormalizedProcessGraph {
    processId: string;
    processName: string;
    level?: string;
    parent?: string;
    parentLevel?: string;
    version?: string;
    status?: string;
    nodes: NormalizedNode[];
    edges: NormalizedEdge[];
    actors: NormalizedActor[];
    inboundEvents: string[];
    outboundEvents: string[];
    context?: Record<string, any>;
    catalogs?: ProcessCatalogs;
}
export declare function isInboundEvent(node: NormalizedNode): boolean;
export declare function isOutboundEvent(node: NormalizedNode): boolean;
export declare function isDecisionNode(node: NormalizedNode): boolean;
export declare function isGatewayNode(node: NormalizedNode): boolean;
//# sourceMappingURL=normalizedGraph.d.ts.map