import { WorkspaceState, SelectedElement, ViewPanelState, ProcessInterfaceRef } from '../types';
import { PatternTableController } from './PatternTableController';
import type { NormalizedProcessGraph } from '../core/normalizedGraph';
export declare class ProcessController {
    private state;
    private listeners;
    private layoutEngine;
    private cachedGraph;
    constructor(initialContent?: string, patternTableController?: PatternTableController);
    markSaved(): void;
    subscribe(listener: (state: WorkspaceState) => void): () => void;
    private emit;
    private recomputeLayout;
    setPmlContent(content: string): void;
    updateNodeProperty(nodeId: string, property: 'label' | 'metadata' | 'gatewayKind' | 'eventType', value: string | Record<string, any>): void;
    /**
     * Renames a node's id and rewrites every edge that references it (plain flow
     * edges, decision-outcome edges — outcomes have no separate representation,
     * they're just edges sourced from a decision node). Blocked if the new id is
     * empty, invalid, or already used by another node.
     */
    renameNodeId(oldId: string, newId: string): boolean;
    /** Adds a new outcome edge from a decision node to a target. */
    addDecisionOutcome(decisionId: string, outcomeName: string, target: string): void;
    /** Patches an existing outcome edge (rename, retarget, toggle primary/loop). */
    updateDecisionOutcome(decisionId: string, outcomeName: string, patch: {
        name?: string;
        target?: string;
        primary?: boolean;
        loop?: boolean;
    }): void;
    /** Removes an outcome edge from a decision node. */
    removeDecisionOutcome(decisionId: string, outcomeName: string): void;
    /** Shared mutate-graph -> regenerate -> recompute-layout -> emit tail, reused by the outcome mutators. */
    private applyGraphMutation;
    private mutateCatalogs;
    /** Adds a catalog entry if `id` is new, or updates its description if it already exists. */
    setCatalogEntry(kind: keyof NonNullable<NormalizedProcessGraph['catalogs']>, id: string, description: string): void;
    removeCatalogEntry(kind: keyof NonNullable<NormalizedProcessGraph['catalogs']>, id: string): void;
    updateLayoutSettings(overrides: Record<string, any>): void;
    updateThemeOverrides(overrides: Record<string, any>): void;
    updatePatternTable(table: import('../core/routing/patternDefinition').PatternDefinition[]): void;
    updateRoutingRules(rules: import('../core/routing/routingRuleDefinition').RoutingRuleDefinition[]): void;
    setZoom(zoom: number): void;
    setViewport(zoom: number, panX: number, panY: number): void;
    pan(dx: number, dy: number): void;
    selectElement(type: SelectedElement['type'], id: string): void;
    clearSelection(): void;
    resetView(): void;
    updateViewPanel(patch: Partial<ViewPanelState>): void;
    setLaneViewMode(mode: 'swimlane' | 'none' | 'by-app'): void;
    setModelSpacing(mode: 'Natural' | 'Compact'): void;
    setConnectorStyle(style: 'uniform' | 'keyFlow' | 'flowTypes'): void;
    navigateToProcess(processName: string, content: string, processInterfaces: ProcessInterfaceRef[]): void;
    navigateBack(): void;
    navigateToBreadcrumbIndex(index: number): void;
    clearBreadcrumbTrail(): void;
}
//# sourceMappingURL=ProcessController.d.ts.map