'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useRef, useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { SlidersHorizontal } from 'lucide-react';
import { ProcessCanvasView } from './ProcessCanvasView';
import { ActivityPropertiesView } from './ActivityPropertiesView';
import { PmlEditorView } from './PmlEditorView';
import { ProcessDataPanel } from './ProcessDataPanel';
import { BreadcrumbBar } from './BreadcrumbBar';
import { NON_USER_METADATA_KEYS } from '../core/activityMetadataSchema';
import { EnhancementControlRail } from './EnhancementControlRail';
export const ProcessWorkspaceView = ({ controller, state, onNavigateAdmin, mode = 'editor', onModeChange, aiAssistantPanel, files, activeFileId, onSelectFile, onCreateFile, }) => {
    const editorRef = useRef(null);
    const diagramTitle = state.processName || 'Untitled Process';
    // Double-clicking a node/lane on the canvas selects it and drops straight
    // into the properties panel's rename field (which propagates via
    // renameNodeId/renameActorId) instead of requiring a separate click.
    const [autoEditId, setAutoEditId] = useState(null);
    const handleSelectElement = (type, id) => {
        setAutoEditId(null);
        controller.selectElement(type, id);
    };
    const handleDoubleClickElement = (type, id) => {
        controller.selectElement(type, id);
        setAutoEditId(id);
    };
    const hasOverrides = Object.keys(state.layoutSettingsOverrides).length > 0 ||
        Object.keys(state.themeOverrides).length > 0;
    // Compute effective showLanes from view panel state
    const showLanes = state.viewPanel.swimlanesOn;
    const selectedNode = state.selectedElement?.type === 'node'
        ? state.layoutResult?.nodes?.find((n) => n.id === state.selectedElement?.id) ?? null
        : null;
    const selectedElementData = state.layoutResult && state.selectedElement
        ? state.selectedElement.type === 'edge'
            ? state.layoutResult.edges?.find((e) => e.id === state.selectedElement.id) ?? null
            : state.selectedElement.type === 'node'
                ? state.layoutResult.nodes?.find((n) => n.id === state.selectedElement.id) ?? null
                : state.selectedElement.type === 'lane'
                    ? state.layoutResult.lanes?.find((l) => l.id === state.selectedElement.id) ?? null
                    : null
        : null;
    // Auto-reveal the selected element's source line in the PML editor — no manual "reveal" click.
    // Depends only on the selection's identity (type+id), not on selectedElementData itself:
    // that object is recomputed via .find() on every render — including every keystroke, since
    // typing reparses the model and produces a new layoutResult — so depending on it directly
    // re-ran this effect (and yanked the cursor back via revealLine's setPosition) on every
    // keystroke whenever an element was selected, not just on an actual selection change.
    useEffect(() => {
        const line = selectedElementData?.sourceRange?.startLine;
        if (line)
            editorRef.current?.revealLine(line);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.selectedElement?.type, state.selectedElement?.id]);
    const allNodes = state.layoutResult?.nodes?.filter((n) => n.x !== undefined) ?? [];
    const overlayEntries = React.useMemo(() => {
        const nodes = state.layoutResult?.nodes ?? [];
        const toLabel = (node) => node.label || node.id;
        // Node table — every placed node with key fields
        const nodeTable = allNodes.map((node) => ({
            nodeId: node.id,
            label: toLabel(node),
            type: node.type,
            actor: node.actor || '—',
            metaCount: node.metadata ? Object.keys(node.metadata).filter((k) => !NON_USER_METADATA_KEYS.has(k)).length : 0,
        }));
        const actor = (node) => node.actor || '—';
        return {
            nodes: nodeTable,
            risk: nodes.flatMap((node) => (node.metadata?.risks ?? []).map((risk) => ({ nodeId: node.id, label: toLabel(node), actor: actor(node), value: risk.id }))),
            sla: nodes.filter((node) => node.metadata?.sla).map((node) => ({ nodeId: node.id, label: toLabel(node), actor: actor(node), value: String(node.metadata.sla) })),
            raci: nodes.filter((node) => node.metadata?.owner).map((node) => ({ nodeId: node.id, label: toLabel(node), actor: actor(node), value: String(node.metadata.owner) })),
            app: nodes.flatMap((node) => {
                const appValue = node.metadata?.app;
                if (Array.isArray(appValue))
                    return appValue.map((value) => ({ nodeId: node.id, label: toLabel(node), actor: actor(node), value: String(value) }));
                if (typeof appValue === 'string' && appValue.trim().length > 0)
                    return [{ nodeId: node.id, label: toLabel(node), actor: actor(node), value: appValue.trim() }];
                return [];
            }),
            businessRule: nodes.flatMap((node) => {
                const ruleValue = node.metadata?.rule;
                if (Array.isArray(ruleValue))
                    return ruleValue.map((value) => ({ nodeId: node.id, label: toLabel(node), actor: actor(node), value: String(value) }));
                if (typeof ruleValue === 'string' && ruleValue.trim().length > 0)
                    return [{ nodeId: node.id, label: toLabel(node), actor: actor(node), value: ruleValue.trim() }];
                return [];
            }),
        };
    }, [state.layoutResult?.nodes, allNodes]);
    const allNodeOptions = React.useMemo(() => allNodes.map((node) => ({ id: node.id, label: node.label || node.id })), [allNodes]);
    const applyNodeMetadataPatch = (nodeId, patch) => {
        const node = state.layoutResult?.nodes?.find((n) => n.id === nodeId);
        if (!node)
            return;
        const metadata = { ...(node.metadata || {}) };
        controller.updateNodeProperty(nodeId, 'metadata', patch(metadata));
    };
    const handleOverlayRemove = (nodeId, value) => {
        const category = state.viewPanel.overlay.activeCategory;
        applyNodeMetadataPatch(nodeId, (metadata) => {
            if (category === 'risk') {
                metadata.risks = Array.isArray(metadata.risks)
                    ? metadata.risks.filter((risk) => risk?.id !== value)
                    : [];
            }
            else if (category === 'sla') {
                delete metadata.sla;
            }
            else if (category === 'raci') {
                delete metadata.owner;
            }
            else if (category === 'app') {
                const app = metadata.app;
                if (Array.isArray(app)) {
                    metadata.app = app.filter((item) => String(item) !== value);
                }
                else {
                    delete metadata.app;
                }
            }
            else if (category === 'businessRule') {
                const rules = metadata.rule;
                if (Array.isArray(rules)) {
                    metadata.rule = rules.filter((item) => String(item) !== value);
                }
                else {
                    delete metadata.rule;
                }
            }
            return metadata;
        });
    };
    const handleOverlayEdit = (nodeId, category, oldValue, newValue) => {
        applyNodeMetadataPatch(nodeId, (metadata) => {
            if (category === 'risk') {
                const risks = Array.isArray(metadata.risks) ? metadata.risks : [];
                metadata.risks = risks.map((risk) => (risk?.id === oldValue ? { ...risk, id: newValue } : risk));
            }
            else if (category === 'sla') {
                metadata.sla = newValue;
            }
            else if (category === 'raci') {
                metadata.owner = newValue;
            }
            else if (category === 'app') {
                const apps = Array.isArray(metadata.app) ? metadata.app.map((item) => String(item)) : [];
                metadata.app = apps.map((item) => (item === oldValue ? newValue : item));
            }
            else if (category === 'businessRule') {
                const rules = Array.isArray(metadata.rule) ? metadata.rule.map((item) => String(item)) : [];
                metadata.rule = rules.map((item) => (item === oldValue ? newValue : item));
            }
            return metadata;
        });
    };
    const handleOverlayAdd = (nodeId, category, value) => {
        applyNodeMetadataPatch(nodeId, (metadata) => {
            if (category === 'risk') {
                const risks = Array.isArray(metadata.risks) ? metadata.risks : [];
                if (!risks.some((risk) => risk?.id === value)) {
                    risks.push({ id: value, controls: [] });
                }
                metadata.risks = risks;
            }
            else if (category === 'sla') {
                metadata.sla = value;
            }
            else if (category === 'raci') {
                metadata.owner = value;
            }
            else if (category === 'app') {
                const apps = Array.isArray(metadata.app) ? metadata.app.map((item) => String(item)) : [];
                if (!apps.includes(value))
                    apps.push(value);
                metadata.app = apps;
            }
            else if (category === 'businessRule') {
                const rules = Array.isArray(metadata.rule) ? metadata.rule.map((item) => String(item)) : [];
                if (!rules.includes(value))
                    rules.push(value);
                metadata.rule = rules;
            }
            return metadata;
        });
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }, children: [_jsxs("header", { style: {
                    display: 'flex', alignItems: 'center', height: 40, flexShrink: 0,
                    background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 16px', gap: 8,
                }, children: [_jsx("span", { style: { fontSize: 13, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', userSelect: 'none' }, children: "AI Captain" }), _jsx("span", { style: { color: '#D1D5DB', userSelect: 'none' }, children: "/" }), _jsx("span", { style: { fontSize: 13, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }, children: diagramTitle }), state.isDirty && (_jsx("span", { style: { width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }, title: "Unsaved changes" })), onModeChange && (_jsx("div", { style: { display: 'flex', gap: 2, marginLeft: 12, marginRight: 'auto' }, children: ['editor', 'ai-assistant'].map((tabMode) => (_jsxs("button", { onClick: () => onModeChange(tabMode), style: {
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '4px 10px', fontSize: 12, fontWeight: mode === tabMode ? 600 : 400,
                                color: mode === tabMode ? '#6366F1' : '#6B7280',
                                background: mode === tabMode ? '#EEF2FF' : 'transparent',
                                border: '1px solid',
                                borderColor: mode === tabMode ? '#C7D2FE' : 'transparent',
                                borderRadius: 6, cursor: 'pointer',
                                transition: 'all 0.12s',
                            }, onMouseEnter: e => {
                                if (mode !== tabMode) {
                                    e.currentTarget.style.color = '#374151';
                                    e.currentTarget.style.background = '#F3F4F6';
                                }
                            }, onMouseLeave: e => {
                                if (mode !== tabMode) {
                                    e.currentTarget.style.color = '#6B7280';
                                    e.currentTarget.style.background = 'transparent';
                                }
                            }, children: [tabMode === 'editor' ? '📝' : '🤖', tabMode === 'editor' ? 'Editor' : 'AI Assistant'] }, tabMode))) })), _jsxs("button", { onClick: onNavigateAdmin, style: {
                            display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
                            color: hasOverrides ? '#6366F1' : '#9CA3AF',
                            background: hasOverrides ? '#EEF2FF' : 'none',
                            border: hasOverrides ? '1px solid #C7D2FE' : '1px solid #E5E7EB',
                            borderRadius: 5, padding: '3px 8px', cursor: 'pointer',
                        }, onMouseEnter: e => { e.currentTarget.style.borderColor = '#A5B4FC'; e.currentTarget.style.color = '#4338CA'; e.currentTarget.style.background = '#EEF2FF'; }, onMouseLeave: e => {
                            e.currentTarget.style.borderColor = hasOverrides ? '#C7D2FE' : '#E5E7EB';
                            e.currentTarget.style.color = hasOverrides ? '#6366F1' : '#9CA3AF';
                            e.currentTarget.style.background = hasOverrides ? '#EEF2FF' : 'none';
                        }, children: [_jsx(SlidersHorizontal, { size: 12 }), "Admin", hasOverrides && (_jsx("span", { style: { fontSize: 10, background: '#6366F1', color: '#fff', borderRadius: 8, padding: '0 4px', lineHeight: '16px' }, children: "\u2022" }))] })] }), _jsx(BreadcrumbBar, { trail: state.viewPanel.breadcrumbTrail, currentProcess: state.processName, pinnedActor: state.viewPanel.pinnedActor, processInterfacesOn: state.viewPanel.processInterfacesOn, onNavigateTo: (index) => {
                    controller.navigateToBreadcrumbIndex(index);
                }, onUnpinActor: () => controller.updateViewPanel({ pinnedActor: null }) }), _jsx("div", { style: { display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }, children: mode === 'ai-assistant' && aiAssistantPanel ? (_jsxs(PanelGroup, { direction: "horizontal", style: { width: '100%', height: '100%' }, children: [_jsx(Panel, { defaultSize: 50, minSize: 30, children: aiAssistantPanel }), _jsx(PanelResizeHandle, { children: _jsx("div", { style: { width: 5, height: '100%', cursor: 'col-resize', background: '#E5E7EB', transition: 'background 0.15s' }, onMouseEnter: e => (e.currentTarget.style.background = '#6366F1'), onMouseLeave: e => (e.currentTarget.style.background = '#E5E7EB') }) }), _jsx(Panel, { defaultSize: 50, minSize: 25, children: _jsxs("div", { style: { position: 'relative', width: '100%', height: '100%' }, children: [_jsx(ProcessCanvasView, { state: state, onZoom: (z) => controller.setZoom(z), onPan: (dx, dy) => controller.pan(dx, dy), onSelect: (type, id) => controller.selectElement(type, id), onSetViewport: (zoom, panX, panY) => controller.setViewport(zoom, panX, panY), onResetView: () => controller.resetView(), onToggleLanes: () => {
                                            const current = state.layoutResult?.settings?.layout?.showLanes ?? true;
                                            controller.updateLayoutSettings({
                                                ...state.layoutSettingsOverrides,
                                                layout: { ...state.layoutSettingsOverrides?.layout, showLanes: !current },
                                            });
                                        }, viewAsActor: state.viewPanel.viewAsActor, flowVisibility: state.viewPanel.flowVisibility, connectorStyle: state.viewPanel.connectorStyle, curtainsOn: state.viewPanel.curtainsOn }), _jsx(EnhancementControlRail, { laneViewMode: state.viewPanel.laneViewMode, modelSpacing: state.viewPanel.modelSpacing, connectorStyle: state.viewPanel.connectorStyle, propertiesPaneOn: state.viewPanel.propertiesPaneOn, onSetLaneViewMode: (modeValue) => controller.setLaneViewMode(modeValue), onSetModelSpacing: (modeValue) => controller.setModelSpacing(modeValue), onSetConnectorStyle: (styleValue) => controller.setConnectorStyle(styleValue), onTogglePropertiesPane: () => controller.updateViewPanel({ propertiesPaneOn: !state.viewPanel.propertiesPaneOn }) })] }) })] })) : (_jsxs(PanelGroup, { direction: "horizontal", style: { width: '100%', height: '100%' }, children: [_jsx(Panel, { defaultSize: 28, minSize: 18, children: _jsxs("div", { style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }, children: [_jsx(PmlEditorView, { ref: editorRef, content: state.pmlContent, onChange: (c) => controller.setPmlContent(c), diagnostics: state.diagnostics, files: files, activeFileId: activeFileId, onSelectFile: onSelectFile, onCreateFile: onCreateFile }), _jsx(ProcessDataPanel, { isOpen: state.viewPanel.isOpen, onTogglePanel: () => controller.updateViewPanel({ isOpen: !state.viewPanel.isOpen }), overlayEntries: overlayEntries, activeCategory: state.viewPanel.overlay.activeCategory, selectedNode: selectedNode ? { id: selectedNode.id, label: selectedNode.label || selectedNode.id } : null, allNodes: allNodeOptions, catalogs: state.catalogs, onSetCategory: (cat) => controller.updateViewPanel({ overlay: { ...state.viewPanel.overlay, activeCategory: cat } }), onAdd: handleOverlayAdd, onEdit: handleOverlayEdit, onRemove: (nodeId, value) => handleOverlayRemove(nodeId, value), onSelectNode: (nodeId) => controller.selectElement('node', nodeId), onSetCatalogEntry: (kind, id, description) => controller.setCatalogEntry(kind, id, description) })] }) }), _jsx(PanelResizeHandle, { children: _jsx("div", { style: { width: 5, height: '100%', cursor: 'col-resize', background: '#E5E7EB', transition: 'background 0.15s' }, onMouseEnter: e => (e.currentTarget.style.background = '#6366F1'), onMouseLeave: e => (e.currentTarget.style.background = '#E5E7EB') }) }), _jsx(Panel, { defaultSize: 72, minSize: 40, children: _jsxs("div", { style: { position: 'relative', width: '100%', height: '100%' }, children: [_jsx(ProcessCanvasView, { state: state, onZoom: (z) => controller.setZoom(z), onPan: (dx, dy) => controller.pan(dx, dy), onSelect: handleSelectElement, onDoubleClickElement: handleDoubleClickElement, onSetViewport: (zoom, panX, panY) => controller.setViewport(zoom, panX, panY), onResetView: () => controller.resetView(), onToggleLanes: () => {
                                            const current = state.layoutResult?.settings?.layout?.showLanes ?? true;
                                            controller.updateLayoutSettings({
                                                ...state.layoutSettingsOverrides,
                                                layout: { ...state.layoutSettingsOverrides?.layout, showLanes: !current },
                                            });
                                        }, onToggleLaneMode: () => {
                                            const current = state.layoutResult?.settings?.layout?.laneMode ?? 'standard';
                                            const next = current === 'virtual' ? 'standard' : 'virtual';
                                            controller.updateLayoutSettings({
                                                ...state.layoutSettingsOverrides,
                                                layout: { ...state.layoutSettingsOverrides?.layout, laneMode: next },
                                            });
                                        }, viewAsActor: state.viewPanel.viewAsActor, flowVisibility: state.viewPanel.flowVisibility, connectorStyle: state.viewPanel.connectorStyle, curtainsOn: state.viewPanel.curtainsOn }), _jsx(EnhancementControlRail, { laneViewMode: state.viewPanel.laneViewMode, modelSpacing: state.viewPanel.modelSpacing, connectorStyle: state.viewPanel.connectorStyle, propertiesPaneOn: state.viewPanel.propertiesPaneOn, onSetLaneViewMode: (modeValue) => controller.setLaneViewMode(modeValue), onSetModelSpacing: (modeValue) => controller.setModelSpacing(modeValue), onSetConnectorStyle: (styleValue) => controller.setConnectorStyle(styleValue), onTogglePropertiesPane: () => controller.updateViewPanel({ propertiesPaneOn: !state.viewPanel.propertiesPaneOn }) }), state.viewPanel.propertiesPaneOn && state.selectedElement && (_jsx("div", { style: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 300, animation: 'slideInRight 0.18s ease-out', zIndex: 20, background: '#fff', borderLeft: '1px solid #E5E7EB', boxShadow: '-4px 0 16px rgba(0,0,0,0.06)' }, children: _jsx(ActivityPropertiesView, { selectedElement: state.selectedElement, elementData: selectedElementData, allNodes: allNodeOptions, allEdges: state.graphEdges ?? [], appCatalog: state.catalogs?.app_registry ?? [], onClose: () => { setAutoEditId(null); controller.clearSelection(); }, autoEditId: autoEditId, onUpdateNode: (nodeId, property, value) => controller.updateNodeProperty(nodeId, property, value), onRenameNode: (oldId, newId) => controller.renameNodeId(oldId, newId), onRenameActor: (oldId, newId) => controller.renameActorId(oldId, newId), onAddOutcome: (decisionId, name, target) => controller.addDecisionOutcome(decisionId, name, target), onUpdateOutcome: (decisionId, name, patch) => controller.updateDecisionOutcome(decisionId, name, patch), onRemoveOutcome: (decisionId, name) => controller.removeDecisionOutcome(decisionId, name), onSelectNode: (nodeId) => controller.selectElement('node', nodeId), onAddAppCatalogEntry: (id, description) => controller.setCatalogEntry('app_registry', id, description) }) }))] }) })] })) })] }));
};
