/**
 * 'curtain' added so clicking the inbound/outbound boundary band on the
 * canvas can select it directly — previously curtains had no click handling
 * at all (see ProcessCanvas.tsx's renderCurtain), so the only way to reach
 * curtain styling in the admin Theme panel was indirectly, by clicking an
 * inbound/outbound EVENT node and having themeSelectionTarget.ts infer the
 * curtain from its direction. id is 'inbound' | 'outbound' for this type.
 */
export type ElementType = 'node' | 'edge' | 'lane' | 'curtain';
export interface SelectedElement {
    type: ElementType;
    id: string;
}
import { PatternDefinition } from '../core/routing/patternDefinition';
import { ProcessDiagnostic } from '../core/diagnostics';
import { RoutingRuleDefinition } from '../core/routing/routingRuleDefinition';
import { ProcessCatalogs, NormalizedEdge } from '../core/normalizedGraph';
/** Process interface link reference in PML */
export interface ProcessInterfaceRef {
    sourceNodeId: string;
    processName: string;
    sourceRange?: {
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    };
}
/** Flow type visibility settings */
export type FlowTypeVisibility = {
    main: boolean;
    alternate: boolean;
    exception: boolean;
    termination: boolean;
};
export type OverlayCategory = 'nodes' | 'risk' | 'sla' | 'raci' | 'app' | 'businessRule';
export interface OverlayState {
    isOpen: boolean;
    activeCategory: OverlayCategory;
}
/** Breadcrumb trail item for process navigation */
export interface BreadcrumbItem {
    processName: string;
    content: string;
}
/** View panel settings state */
export interface ViewPanelState {
    isOpen: boolean;
    swimlanesOn: boolean;
    laneViewMode: 'swimlane' | 'none' | 'by-app';
    modelSpacing: 'Natural' | 'Compact';
    processInterfacesOn: boolean;
    curtainsOn: boolean;
    propertiesPaneOn: boolean;
    showMetaIcons: boolean;
    overlay: OverlayState;
    viewAsActor: string | null;
    pinnedActor: string | null;
    /**
     * General-purpose node-set spotlight, generalizing viewAsActor's
     * dim-everything-else-to-20% effect from "one actor's lane" to "an
     * arbitrary set of node ids." Introduced so AI findings can highlight
     * exactly their evidence (docs/FINAL/13_Phase_E_Findings_Drive_Canvas_Plan.md
     * E.1) without being scoped to a whole actor swimlane. Composable with
     * viewAsActor: when both are set, a node must pass both filters to be
     * full-opacity (see buildNodeRenderModels.ts).
     */
    highlightNodeIds: string[] | null;
    flowVisibility: FlowTypeVisibility;
    connectorStyle: 'uniform' | 'keyFlow' | 'flowTypes';
    breadcrumbTrail: BreadcrumbItem[];
}
export interface WorkspaceState {
    pmlContent: string;
    processName: string;
    zoom: number;
    panX: number;
    panY: number;
    selectedElement: SelectedElement | null;
    isDirty: boolean;
    diagnostics: ProcessDiagnostic[];
    layoutResult: any | null;
    layoutSettingsOverrides: Record<string, any>;
    themeOverrides: Record<string, any>;
    patternTable: PatternDefinition[];
    routingRules: RoutingRuleDefinition[];
    viewPanel: ViewPanelState;
    processInterfaces: ProcessInterfaceRef[];
    catalogs?: ProcessCatalogs;
    /** Raw graph edges (unlike `layoutResult.edges`, these keep `label`/`loop`/`primary`, needed for the outcome editor and triggered-by/triggers views). */
    graphEdges?: NormalizedEdge[];
}
//# sourceMappingURL=index.d.ts.map