import React, { useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { SlidersHorizontal } from 'lucide-react';
import { ProcessController } from 'pml-core';
import { WorkspaceState } from 'pml-core';
import { ProcessCanvasView } from './ProcessCanvasView';
import { ActivityPropertiesView } from './ActivityPropertiesView';
import { PmlEditorView, PmlEditorRef } from './PmlEditorView';
import { ViewSettingsPanel } from './ViewSettingsPanel';
import { BreadcrumbBar } from './BreadcrumbBar';

export interface ProcessWorkspaceViewProps {
  controller: ProcessController;
  state: WorkspaceState;
  onNavigateAdmin: () => void;
}

export const ProcessWorkspaceView: React.FC<ProcessWorkspaceViewProps> = ({
  controller,
  state,
  onNavigateAdmin,
}) => {
  const editorRef = useRef<PmlEditorRef>(null);
  const diagramTitle = state.processName || 'Untitled Process';

  const hasOverrides =
    Object.keys(state.layoutSettingsOverrides).length > 0 ||
    Object.keys(state.themeOverrides).length > 0;

  // Extract actors from layout result for the ViewSettingsPanel dropdown
  const actors = state.layoutResult?.nodes
    ?.filter((n: any) => n.actor)
    ?.map((n: any) => ({ id: n.actor, label: n.actor }))
    ?.filter((v: any, i: number, arr: any[]) => arr.findIndex(a => a.id === v.id) === i) ?? [];

  // Compute effective showLanes from view panel state
  const showLanes = state.viewPanel.swimlanesOn;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', height: 40, flexShrink: 0,
        background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 16px', gap: 8,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em', userSelect: 'none' }}>
          AI Captain
        </span>
        <span style={{ color: '#D1D5DB', userSelect: 'none' }}>/</span>
        <span style={{ fontSize: 13, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {diagramTitle}
        </span>
        {state.isDirty && (
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} title="Unsaved changes" />
        )}

        {/* Admin link */}
        <button
          onClick={onNavigateAdmin}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
            color: hasOverrides ? '#6366F1' : '#9CA3AF',
            background: hasOverrides ? '#EEF2FF' : 'none',
            border: hasOverrides ? '1px solid #C7D2FE' : '1px solid #E5E7EB',
            borderRadius: 5, padding: '3px 8px', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#A5B4FC'; e.currentTarget.style.color = '#4338CA'; e.currentTarget.style.background = '#EEF2FF'; }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = hasOverrides ? '#C7D2FE' : '#E5E7EB';
            e.currentTarget.style.color = hasOverrides ? '#6366F1' : '#9CA3AF';
            e.currentTarget.style.background = hasOverrides ? '#EEF2FF' : 'none';
          }}
        >
          <SlidersHorizontal size={12} />
          Admin
          {hasOverrides && (
            <span style={{ fontSize: 10, background: '#6366F1', color: '#fff', borderRadius: 8, padding: '0 4px', lineHeight: '16px' }}>
              •
            </span>
          )}
        </button>
      </header>

      {/* ── Breadcrumb bar ──────────────────────────────────────── */}
      <BreadcrumbBar
        trail={state.viewPanel.breadcrumbTrail}
        currentProcess={state.processName}
        pinnedActor={state.viewPanel.pinnedActor}
        processInterfacesOn={state.viewPanel.processInterfacesOn}
        onNavigateTo={(index) => {
          // Navigate back to specific breadcrumb item
          const trail = state.viewPanel.breadcrumbTrail;
          if (index < trail.length - 1) {
            controller.navigateBack();
          }
        }}
        onUnpinActor={() => controller.togglePinActor()}
      />

      {/* ── Panel area ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <PanelGroup direction="horizontal" style={{ width: '100%', height: '100%' }}>

          {/* Left: PML editor with integrated ViewSettingsPanel */}
          <Panel defaultSize={28} minSize={18}>
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
              <PmlEditorView
                ref={editorRef}
                content={state.pmlContent}
                onChange={(c) => controller.setPmlContent(c)}
                diagnostics={state.diagnostics}
              />
              
              <ViewSettingsPanel
                isOpen={state.viewPanel.isOpen}
                swimlanesOn={state.viewPanel.swimlanesOn}
                modelSpacing={state.viewPanel.modelSpacing}
                processInterfacesOn={state.viewPanel.processInterfacesOn}
                curtainsOn={state.viewPanel.curtainsOn}
                viewAsActor={state.viewPanel.viewAsActor}
                pinnedActor={state.viewPanel.pinnedActor}
                flowVisibility={state.viewPanel.flowVisibility}
                actors={actors}
                onTogglePanel={() => controller.togglePanel()}
                onToggleSwimlanes={() => controller.toggleSwimlanes()}
                onSetModelSpacing={(mode) => controller.setModelSpacing(mode)}
                onToggleProcessInterfaces={() => controller.toggleProcessInterfaces()}
                onToggleCurtains={() => controller.toggleCurtains()}
                onSetViewAsActor={(actor) => controller.setViewAsActor(actor)}
                onTogglePinActor={() => controller.togglePinActor()}
                onSetFlowVisibility={(visibility) => controller.setFlowVisibility(visibility)}
                hasUnsavedChanges={state.isDirty}
              />
            </div>
          </Panel>

          {/* Resize handle */}
          <PanelResizeHandle>
            <div style={{ width: 5, height: '100%', cursor: 'col-resize', background: '#E5E7EB', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#6366F1')}
              onMouseLeave={e => (e.currentTarget.style.background = '#E5E7EB')}
            />
          </PanelResizeHandle>

          {/* Right: canvas */}
          <Panel defaultSize={72} minSize={40}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <ProcessCanvasView
                state={state}
                onZoom={(z) => controller.setZoom(z)}
                onPan={(dx, dy) => controller.pan(dx, dy)}
                onSelect={(type, id) => controller.selectElement(type, id)}
                onSetViewport={(zoom, panX, panY) => controller.setViewport(zoom, panX, panY)}
                onResetView={() => controller.resetView()}
                onToggleLanes={() => {
                  const current = state.layoutResult?.settings?.layout?.showLanes ?? true;
                  controller.updateLayoutSettings({
                    ...state.layoutSettingsOverrides,
                    layout: { ...state.layoutSettingsOverrides?.layout, showLanes: !current },
                  });
                 }}
                 viewAsActor={state.viewPanel.viewAsActor}
                flowVisibility={state.viewPanel.flowVisibility}
                curtainsOn={state.viewPanel.curtainsOn}
              />

              {state.selectedElement && (
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 300, animation: 'slideInRight 0.18s ease-out', zIndex: 20, background: '#fff', borderLeft: '1px solid #E5E7EB', boxShadow: '-4px 0 16px rgba(0,0,0,0.06)' }}>
                  <ActivityPropertiesView
                    selectedElement={state.selectedElement}
                    elementData={
                      state.layoutResult && state.selectedElement.type === 'edge'
                        ? state.layoutResult.edges?.find((e: any) => e.id === state.selectedElement!.id) ?? null
                        : state.layoutResult && state.selectedElement.type === 'node'
                        ? state.layoutResult.nodes?.find((n: any) => n.id === state.selectedElement!.id) ?? null
                        : state.layoutResult && state.selectedElement.type === 'lane'
                        ? state.layoutResult.lanes?.find((l: any) => l.id === state.selectedElement!.id) ?? null
                        : null
                    }
                    onClose={() => controller.clearSelection()}
                    onUpdateNode={(nodeId, property, value) => controller.updateNodeProperty(nodeId, property, value)}
                    onRevealSource={(line) => editorRef.current?.revealLine(line)}
                  />
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};
