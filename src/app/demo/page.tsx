'use client';
import { useState, useEffect, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ProcessController } from 'pml-core';
import { WorkspaceState, ProcessDiagnostic } from 'pml-core';
import { SiteHeader } from '@/components/SiteHeader';
import { ProcessCanvasView } from '@/components/ProcessCanvasView';
import { PmlEditorView } from '@/components/PmlEditorView';

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
      <div className="flex-1 min-h-0">
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
      </div>
    </div>
  );
}
