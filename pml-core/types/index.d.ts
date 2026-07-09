export type ElementType = 'node' | 'edge' | 'lane';
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