import { LayoutEdge, LayoutNode } from '../processLayout/layoutTypes';
import { ProcessThemeSchema } from '../styling/styleSchema';
interface ResolvedNodeLabel {
    nodeId: string;
    lines: string[];
    x: number;
    y: number;
    fontSize: number;
    fontWeight: number;
    fill: string;
    haloFill: string;
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
}
export interface LabelControllerResult {
    activeAnchorsByNode: Map<string, Set<string>>;
    nodeLabels: Map<string, ResolvedNodeLabel>;
    secondaryLabels: Map<string, ResolvedSecondaryLabel>;
    edgeLabels: Map<string, ResolvedEdgeLabel>;
}
export declare function buildProcessLabelControllerResult(nodes: LayoutNode[], edges: LayoutEdge[], theme: ProcessThemeSchema, padding: number): LabelControllerResult;
export declare function resolveNodeLabel(node: LayoutNode, activeAnchors: Set<string>, theme: ProcessThemeSchema, padding: number): ResolvedNodeLabel | null;
export declare function resolveSecondaryLabel(node: LayoutNode, theme: ProcessThemeSchema, padding: number): ResolvedSecondaryLabel | null;
export {};
//# sourceMappingURL=labelController.d.ts.map