import { parsePml } from '../adapters/pmlParser';
import { LayoutEngine } from './LayoutEngine';
import { DEFAULT_PATTERN_TABLE } from '../core/routing/patternDefinition';
import { generatePml } from '../core/adapters/pmlGenerator';
const DEFAULT_FLOW_VISIBILITY = {
    main: true,
    alternate: true,
    exception: true,
    termination: true,
};
const DEFAULT_VIEW_PANEL_STATE = {
    isOpen: false,
    swimlanesOn: true,
    laneViewMode: 'swimlane',
    modelSpacing: 'Natural',
    processInterfacesOn: false,
    curtainsOn: true,
    showMetaIcons: true,
    propertiesPaneOn: true,
    overlay: {
        isOpen: false,
        activeCategory: 'nodes',
    },
    viewAsActor: null,
    pinnedActor: null,
    flowVisibility: DEFAULT_FLOW_VISIBILITY,
    connectorStyle: 'flowTypes',
    breadcrumbTrail: [],
};
export class ProcessController {
    constructor(initialContent = '', patternTableController) {
        Object.defineProperty(this, "state", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "listeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        Object.defineProperty(this, "layoutEngine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cachedGraph", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.layoutEngine = new LayoutEngine();
        const initialPatternTable = patternTableController?.getTable() ?? DEFAULT_PATTERN_TABLE.map((p) => ({ ...p }));
        const { graph, diagnostics, processInterfaces } = parsePml(initialContent, { flowClassification: 'inferred', validationMode: 'loose' });
        this.cachedGraph = graph;
        // Initialize state first, then compute layout
        const initialState = {
            pmlContent: initialContent,
            processName: graph?.processName ?? '',
            zoom: 1, panX: 0, panY: 0,
            selectedElement: null,
            isDirty: false,
            diagnostics: diagnostics || [],
            layoutResult: null,
            layoutSettingsOverrides: {},
            themeOverrides: {},
            patternTable: initialPatternTable,
            routingRules: [],
            viewPanel: DEFAULT_VIEW_PANEL_STATE,
            processInterfaces: processInterfaces || [],
            catalogs: graph?.catalogs,
            graphEdges: graph?.edges,
        };
        this.state = initialState;
        // Now compute layout with initialized state
        if (graph) {
            this.state = {
                ...this.state,
                layoutResult: this.recomputeLayout(graph),
            };
        }
    }
    markSaved() {
        this.state = { ...this.state, isDirty: false };
        this.emit();
    }
    subscribe(listener) {
        this.listeners.add(listener);
        listener(this.state);
        return () => this.listeners.delete(listener);
    }
    emit() { this.listeners.forEach(l => l(this.state)); }
    recomputeLayout(graph) {
        const overrides = {
            ...(this.state?.layoutSettingsOverrides ?? {}),
            routing: {
                // Defaults on for the live editor — tries a sibling row-swap or
                // gateway relocation when the base layout has a real edge crossing
                // or an edge cutting through an unrelated node. Placed before the
                // state override spread so an explicit false in
                // layoutSettingsOverrides still wins.
                autoRelocateToAvoidOverlap: true,
                ...(this.state?.layoutSettingsOverrides?.routing ?? {}),
                patternTable: this.state?.patternTable ?? [],
                routingRules: this.state?.routingRules?.length > 0 ? this.state.routingRules : undefined,
            },
        };
        return this.layoutEngine.computeLayout(graph, overrides);
    }
    setPmlContent(content) {
        const { graph, diagnostics, processInterfaces } = parsePml(content, { flowClassification: 'inferred', validationMode: 'loose' });
        this.cachedGraph = graph;
        this.state = {
            ...this.state,
            pmlContent: content,
            processName: graph?.processName ?? this.state.processName,
            isDirty: true,
            diagnostics: diagnostics || [],
            layoutResult: graph ? this.recomputeLayout(graph) : null,
            processInterfaces: processInterfaces || [],
            catalogs: graph?.catalogs,
            graphEdges: graph?.edges,
        };
        this.emit();
    }
    updateNodeProperty(nodeId, property, value) {
        if (!this.cachedGraph)
            return;
        const updatedNodes = this.cachedGraph.nodes.map((node) => node.id === nodeId ? { ...node, [property]: value } : node);
        this.cachedGraph = {
            ...this.cachedGraph,
            nodes: updatedNodes,
        };
        const pmlContent = generatePml(this.cachedGraph);
        this.state = {
            ...this.state,
            pmlContent,
            isDirty: true,
            layoutResult: this.recomputeLayout(this.cachedGraph),
        };
        this.emit();
    }
    /**
     * Renames a node's id and rewrites every edge that references it (plain flow
     * edges, decision-outcome edges — outcomes have no separate representation,
     * they're just edges sourced from a decision node). Blocked if the new id is
     * empty, invalid, or already used by another node.
     */
    renameNodeId(oldId, newId) {
        if (!this.cachedGraph)
            return false;
        if (!/^[A-Za-z0-9_-]+$/.test(newId))
            return false;
        if (oldId === newId)
            return true;
        if (this.cachedGraph.nodes.some((n) => n.id === newId))
            return false;
        this.cachedGraph = {
            ...this.cachedGraph,
            nodes: this.cachedGraph.nodes.map((node) => (node.id === oldId ? { ...node, id: newId } : node)),
            edges: this.cachedGraph.edges.map((edge) => ({
                ...edge,
                source: edge.source === oldId ? newId : edge.source,
                target: edge.target === oldId ? newId : edge.target,
            })),
        };
        const pmlContent = generatePml(this.cachedGraph);
        const selectedElement = this.state.selectedElement?.type === 'node' && this.state.selectedElement.id === oldId
            ? { ...this.state.selectedElement, id: newId }
            : this.state.selectedElement;
        this.state = {
            ...this.state,
            pmlContent,
            isDirty: true,
            layoutResult: this.recomputeLayout(this.cachedGraph),
            selectedElement,
            graphEdges: this.cachedGraph.edges,
        };
        this.emit();
        return true;
    }
    /** Adds a new outcome edge from a decision node to a target. */
    addDecisionOutcome(decisionId, outcomeName, target) {
        if (!this.cachedGraph)
            return;
        const id = `${decisionId}>${target}:${outcomeName}`;
        this.cachedGraph = {
            ...this.cachedGraph,
            edges: [...this.cachedGraph.edges, { id, source: decisionId, target, condition: outcomeName }],
        };
        this.applyGraphMutation();
    }
    /** Patches an existing outcome edge (rename, retarget, toggle primary/loop). */
    updateDecisionOutcome(decisionId, outcomeName, patch) {
        if (!this.cachedGraph)
            return;
        this.cachedGraph = {
            ...this.cachedGraph,
            edges: this.cachedGraph.edges.map((edge) => edge.source === decisionId && edge.condition === outcomeName
                ? {
                    ...edge,
                    condition: patch.name ?? edge.condition,
                    target: patch.target ?? edge.target,
                    primary: patch.primary ?? edge.primary,
                    loop: patch.loop ?? edge.loop,
                }
                : edge),
        };
        this.applyGraphMutation();
    }
    /** Removes an outcome edge from a decision node. */
    removeDecisionOutcome(decisionId, outcomeName) {
        if (!this.cachedGraph)
            return;
        this.cachedGraph = {
            ...this.cachedGraph,
            edges: this.cachedGraph.edges.filter((edge) => !(edge.source === decisionId && edge.condition === outcomeName)),
        };
        this.applyGraphMutation();
    }
    /** Shared mutate-graph -> regenerate -> recompute-layout -> emit tail, reused by the outcome mutators. */
    applyGraphMutation() {
        if (!this.cachedGraph)
            return;
        const pmlContent = generatePml(this.cachedGraph);
        this.state = {
            ...this.state,
            pmlContent,
            isDirty: true,
            layoutResult: this.recomputeLayout(this.cachedGraph),
            graphEdges: this.cachedGraph.edges,
        };
        this.emit();
    }
    mutateCatalogs(mutate) {
        if (!this.cachedGraph)
            return;
        const currentCatalogs = this.cachedGraph.catalogs ?? { risk_register: [], rule_library: [], app_registry: [] };
        this.cachedGraph = {
            ...this.cachedGraph,
            catalogs: mutate(currentCatalogs),
        };
        const pmlContent = generatePml(this.cachedGraph);
        this.state = {
            ...this.state,
            pmlContent,
            isDirty: true,
            layoutResult: this.recomputeLayout(this.cachedGraph),
            catalogs: this.cachedGraph.catalogs,
        };
        this.emit();
    }
    /** Adds a catalog entry if `id` is new, or updates its description if it already exists. */
    setCatalogEntry(kind, id, description) {
        this.mutateCatalogs((catalogs) => {
            const entries = catalogs[kind];
            const exists = entries.some((entry) => entry.id === id);
            return {
                ...catalogs,
                [kind]: exists
                    ? entries.map((entry) => (entry.id === id ? { ...entry, description } : entry))
                    : [...entries, { id, description }],
            };
        });
    }
    removeCatalogEntry(kind, id) {
        this.mutateCatalogs((catalogs) => ({
            ...catalogs,
            [kind]: catalogs[kind].filter((entry) => entry.id !== id),
        }));
    }
    updateLayoutSettings(overrides) {
        this.state = { ...this.state, layoutSettingsOverrides: overrides };
        if (this.cachedGraph) {
            this.state = { ...this.state, layoutResult: this.recomputeLayout(this.cachedGraph) };
        }
        this.emit();
    }
    updateThemeOverrides(overrides) {
        this.state = { ...this.state, themeOverrides: overrides };
        this.emit();
    }
    updatePatternTable(table) {
        this.state = { ...this.state, patternTable: table };
        if (this.cachedGraph) {
            this.state = { ...this.state, layoutResult: this.recomputeLayout(this.cachedGraph) };
        }
        this.emit();
    }
    updateRoutingRules(rules) {
        this.state = { ...this.state, routingRules: rules };
        if (this.cachedGraph) {
            this.state = { ...this.state, layoutResult: this.recomputeLayout(this.cachedGraph) };
        }
        this.emit();
    }
    setZoom(zoom) { this.state = { ...this.state, zoom }; this.emit(); }
    setViewport(zoom, panX, panY) {
        this.state = { ...this.state, zoom, panX, panY };
        this.emit();
    }
    pan(dx, dy) {
        this.state = { ...this.state, panX: this.state.panX + dx, panY: this.state.panY + dy };
        this.emit();
    }
    selectElement(type, id) {
        this.state = { ...this.state, selectedElement: { type, id } };
        this.emit();
    }
    clearSelection() { this.state = { ...this.state, selectedElement: null }; this.emit(); }
    resetView() { this.state = { ...this.state, zoom: 1, panX: 0, panY: 0 }; this.emit(); }
    // ── Generic view panel updater ──────────────────────────────────────────
    // Replaces ~15 individual one-liner toggle/setter methods with a single
    // flexible updater.  Consumers call:
    //
    //   controller.updateViewPanel({ isOpen: true })
    //   controller.updateViewPanel({ swimlanesOn: !state.viewPanel.swimlanesOn })
    //   controller.updateViewPanel({ overlay: { ...state.viewPanel.overlay, isOpen: !state.viewPanel.overlay.isOpen } })
    //
    // The complex setters (setLaneViewMode, setModelSpacing) remain as dedicated methods
    // since they touch multiple state branches.
    updateViewPanel(patch) {
        this.state = {
            ...this.state,
            viewPanel: { ...this.state.viewPanel, ...patch },
        };
        this.emit();
    }
    setLaneViewMode(mode) {
        const layout = this.state.layoutSettingsOverrides?.layout ?? {};
        let nextLayout = { ...layout };
        let swimlanesOn = this.state.viewPanel.swimlanesOn;
        if (mode === 'none') {
            swimlanesOn = false;
            // laneMode 'virtual' collapses all nodes into a single lane before layout runs
            // (see virtualLane.ts), so the model is actually re-laid-out without lateral
            // per-actor separation — not just visually hidden with showLanes:false.
            nextLayout = { ...nextLayout, showLanes: false, laneMode: 'virtual' };
        }
        else if (mode === 'by-app') {
            swimlanesOn = true;
            // laneMode 'byApp' groups lanes by each node's first `app` reference instead of its
            // actor (see processLayout/index.ts + laneGeometry.ts), with an "Unassigned" lane for
            // nodes with no `app` reference.
            nextLayout = { ...nextLayout, showLanes: true, laneMode: 'byApp' };
        }
        else {
            swimlanesOn = true;
            nextLayout = { ...nextLayout, showLanes: true, laneMode: 'standard' };
        }
        this.state = {
            ...this.state,
            layoutSettingsOverrides: {
                ...this.state.layoutSettingsOverrides,
                layout: nextLayout,
            },
            viewPanel: {
                ...this.state.viewPanel,
                laneViewMode: mode,
                swimlanesOn,
            },
        };
        if (this.cachedGraph) {
            this.state = { ...this.state, layoutResult: this.recomputeLayout(this.cachedGraph) };
        }
        this.emit();
    }
    setModelSpacing(mode) {
        const densityMode = mode === 'Compact' ? 'compact' : 'standard';
        const nextLayoutOverrides = {
            ...this.state.layoutSettingsOverrides,
            densityMode,
            routing: {
                ...this.state.layoutSettingsOverrides?.routing,
                compactMode: mode === 'Compact',
            },
        };
        this.state = {
            ...this.state,
            layoutSettingsOverrides: nextLayoutOverrides,
            viewPanel: { ...this.state.viewPanel, modelSpacing: mode },
        };
        if (this.cachedGraph) {
            this.state = { ...this.state, layoutResult: this.recomputeLayout(this.cachedGraph) };
        }
        this.emit();
    }
    setConnectorStyle(style) {
        this.state = {
            ...this.state,
            viewPanel: { ...this.state.viewPanel, connectorStyle: style },
        };
        this.emit();
    }
    // Process Navigation via breadcrumbs
    // TODO: Implement process loading via fetch from `/processes/[name].pml`
    // TODO: Add error handling for missing process files
    navigateToProcess(processName, content, processInterfaces) {
        // When a process interface link is clicked in the editor:
        // 1. Fetch the linked process content (placeholder)
        // 2. Update state with new content and process name
        // 3. Update breadcrumb trail
        // 4. Apply pinned actor if set
        const current = this.state.pmlContent;
        const currentName = this.state.processName;
        const existingTrail = [...this.state.viewPanel.breadcrumbTrail];
        const existingIndex = existingTrail.findIndex(item => item.processName === processName);
        let newTrail;
        if (existingIndex >= 0) {
            newTrail = existingTrail.slice(0, existingIndex + 1);
        }
        else {
            newTrail = [...existingTrail, { processName, content }];
        }
        this.cachedGraph = parsePml(content, { flowClassification: 'inferred', validationMode: 'loose' }).graph;
        this.state = {
            ...this.state,
            pmlContent: content,
            processName: processName,
            processInterfaces: processInterfaces,
            layoutResult: this.cachedGraph ? this.recomputeLayout(this.cachedGraph) : null,
            viewPanel: {
                ...this.state.viewPanel,
                breadcrumbTrail: newTrail,
                viewAsActor: this.state.viewPanel.pinnedActor,
            },
        };
        this.emit();
    }
    navigateBack() {
        const trail = this.state.viewPanel.breadcrumbTrail;
        if (trail.length <= 1)
            return;
        const newTrail = trail.slice(0, -1);
        const target = newTrail[newTrail.length - 1];
        if (target) {
            const parsed = parsePml(target.content, { flowClassification: 'inferred', validationMode: 'loose' });
            const graph = parsed.graph;
            this.cachedGraph = graph;
            this.state = {
                ...this.state,
                pmlContent: target.content,
                processName: target.processName,
                processInterfaces: parsed.processInterfaces || [],
                layoutResult: graph ? this.recomputeLayout(graph) : null,
                viewPanel: {
                    ...this.state.viewPanel,
                    breadcrumbTrail: newTrail,
                    viewAsActor: this.state.viewPanel.pinnedActor,
                },
            };
            this.emit();
        }
    }
    navigateToBreadcrumbIndex(index) {
        const trail = this.state.viewPanel.breadcrumbTrail;
        if (index < 0 || index >= trail.length)
            return;
        const target = trail[index];
        const nextTrail = trail.slice(0, index + 1);
        const parsed = parsePml(target.content, { flowClassification: 'inferred', validationMode: 'loose' });
        this.cachedGraph = parsed.graph;
        this.state = {
            ...this.state,
            pmlContent: target.content,
            processName: target.processName,
            processInterfaces: parsed.processInterfaces || [],
            layoutResult: this.cachedGraph ? this.recomputeLayout(this.cachedGraph) : null,
            viewPanel: {
                ...this.state.viewPanel,
                breadcrumbTrail: nextTrail,
                viewAsActor: this.state.viewPanel.pinnedActor,
            },
        };
        this.emit();
    }
    clearBreadcrumbTrail() {
        this.state = {
            ...this.state,
            viewPanel: { ...this.state.viewPanel, breadcrumbTrail: [] },
        };
        this.emit();
    }
}
