import { LayoutEdge, LayoutNode } from '../processLayout/layoutTypes';
import { ProcessThemeSchema } from '../styling/styleSchema';
import { type EdgeLabelPlacement } from './edgeLabelPositioning';
interface ResolvedNodeLabel {
    nodeId: string;
    lines: string[];
    x: number;
    y: number;
    fontSize: number;
    fontWeight: number;
    fill: string;
    lineSpacing: number;
}
interface ResolvedSecondaryLabel {
    nodeId: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontWeight: number;
    fill: string;
    opacity: number;
    letterSpacing?: string;
}
interface ResolvedEdgeLabel {
    edgeId: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontWeight: number;
    fill: string;
    haloFill: string;
    haloWidth: number;
    side: EdgeLabelPlacement['side'];
    hasManualNudge: boolean;
}
export interface LabelControllerResult {
    activeAnchorsByNode: Map<string, Set<string>>;
    nodeLabels: Map<string, ResolvedNodeLabel>;
    secondaryLabels: Map<string, ResolvedSecondaryLabel>;
    edgeLabels: Map<string, ResolvedEdgeLabel>;
}
export declare function buildProcessLabelControllerResult(nodes: LayoutNode[], edges: LayoutEdge[], theme: ProcessThemeSchema, padding: number): LabelControllerResult;
export {};
//# sourceMappingURL=labelController.d.ts.map