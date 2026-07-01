'use client';
import { useState, useEffect, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ProcessController, WorkspaceState, ProcessDiagnostic, ProcessCanvasView, PmlEditorView } from 'pml-core';
import { SiteHeader } from '@/components/SiteHeader';
import { AiAssistantWorkspace } from '@/components/chat/AiAssistantWorkspace';

const SAMPLE_PML = `@process L3 "Create your process model"

event start as "customer requires modelling" inbound
event end as "model generated" outbound
actor User
    task res "Responses"
actor AI
  task interview as "perform interview"
actor PMLModeller
  task render as "render"
flow
start -> interview -> res -> render -> end`;

export default function DemoPage() {
  const [controller, setController] = useState<ProcessController | null>(null);
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [pmlContent, setPmlContent] = useState(SAMPLE_PML);
  const [mode, setMode] = useState<'editor' | 'ai-assistant'>('editor');

  useEffect(() => {
    const ctrl = new ProcessController(SAMPLE_PML);
    setController(ctrl);
    const unsub = ctrl.subscribe(setState);
    return unsub;
  }, []);

  const handlePmlChange = useCallback((content: string) => {
    setPmlContent(content);
    controller?.setPmlContent(content);
  }, [controller]);

  const handleZoom = useCallback((z: number) => {
    controller?.setZoom(z);
  }, [controller]);

  const handlePan = useCallback((dx: number, dy: number) => {
    controller?.pan(dx, dy);
  }, [controller]);

  const handleSetViewport = useCallback((zoom: number, panX: number, panY: number) => {
    controller?.setViewport(zoom, panX, panY);
  }, [controller]);

  const handleSelect = useCallback((type: string, id: string) => {
    controller?.selectElement(type as any, id);
  }, [controller]);

  const handleResetView = useCallback(() => {
    controller?.resetView();
  }, [controller]);

  const handleToggleLanes = useCallback(() => {
    if (!state?.layoutResult || !controller) return;
    const current = state.layoutResult.settings?.layout?.showLanes ?? true;
    controller.updateLayoutSettings({
      ...state.layoutSettingsOverrides,
      layout: { ...state.layoutSettingsOverrides?.layout, showLanes: !current },
    });
  }, [controller, state]);

  if (!controller || !state) {
    return (
      <div className="h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-gray-400">Loading viewer...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <SiteHeader />
      {/* ── Workspace mode tabs ─────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2, height: 38, flexShrink: 0,
        background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 16px',
        marginTop: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginRight: 8 }}>
          Workspace:
        </span>
        {(['editor', 'ai-assistant'] as const).map((tabMode) => (
          <button
            key={tabMode}
            onClick={() => setMode(tabMode)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', fontSize: 12, fontWeight: mode === tabMode ? 600 : 400,
              color: mode === tabMode ? '#6366F1' : '#6B7280',
              background: mode === tabMode ? '#EEF2FF' : 'transparent',
              border: '1px solid',
              borderColor: mode === tabMode ? '#C7D2FE' : 'transparent',
              borderRadius: 6, cursor: 'pointer',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => {
              if (mode !== tabMode) {
                e.currentTarget.style.color = '#374151';
                e.currentTarget.style.background = '#F3F4F6';
              }
            }}
            onMouseLeave={e => {
              if (mode !== tabMode) {
                e.currentTarget.style.color = '#6B7280';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {tabMode === 'editor' ? '📝' : '🤖'}
            {tabMode === 'editor' ? 'Editor' : 'AI Assistant'}
          </button>
        ))}
        {state.isDirty && (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', marginLeft: 12 }} title="Unsaved changes" />
        )}
      </div>

      {/* ── Workspace area ──────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        {mode === 'ai-assistant' ? (
          <PanelGroup direction="horizontal">
            <Panel defaultSize={50} minSize={30}>
              <AiAssistantWorkspace controller={controller} state={state} />
            </Panel>
            <PanelResizeHandle>
              <div className="w-1 h-full cursor-col-resize bg-gray-200 hover:bg-indigo-500 transition-colors" />
            </PanelResizeHandle>
            <Panel defaultSize={50} minSize={25}>
              <ProcessCanvasView
                state={state}
                onZoom={handleZoom}
                onPan={handlePan}
                onSetViewport={handleSetViewport}
                onSelect={handleSelect}
                onResetView={handleResetView}
                onToggleLanes={handleToggleLanes}
              />
            </Panel>
          </PanelGroup>
        ) : (
          <PanelGroup direction="horizontal">
            <Panel defaultSize={28} minSize={18}>
              <PmlEditorView
                content={pmlContent}
                onChange={handlePmlChange}
                diagnostics={state.diagnostics as ProcessDiagnostic[] | undefined}
              />
            </Panel>
            <PanelResizeHandle>
              <div className="w-1 h-full cursor-col-resize bg-gray-200 hover:bg-teal transition-colors" />
            </PanelResizeHandle>
            <Panel defaultSize={72} minSize={40}>
              <ProcessCanvasView
                state={state}
                onZoom={handleZoom}
                onPan={handlePan}
                onSetViewport={handleSetViewport}
                onSelect={handleSelect}
                onResetView={handleResetView}
                onToggleLanes={handleToggleLanes}
              />
            </Panel>
          </PanelGroup>
        )}
      </div>
    </div>
  );
}
