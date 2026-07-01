'use client';
import { useState, useEffect, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ProcessController, WorkspaceState, ProcessDiagnostic, ProcessCanvasView, PmlEditorView } from 'pml-core';
import Link from 'next/link';
import { PlatformHeader } from '@/components/PlatformHeader';
import { AiAssistantWorkspace } from '@/components/chat/AiAssistantWorkspace';

const SAMPLE_PML = `@process L3 "Online Order Fulfillment" parent=vc-ecommerce version=1.0 status=approved

event order_placed    as "Order Placed"
event order_fulfilled as "Order Fulfilled"
event order_cancelled as "Order Cancelled"

actor Customer
    task(user) place_order as "Place Order"

actor Store
    task(service) check_inventory as "Check Inventory"
        description "Real-time stock check across all warehouse locations."
        rule "Reserve stock for 15 minutes while payment is processed."

    task(service) process_payment as "Process Payment"
        sla completion_time < 30s

    task(manual) notify_unavailable as "Notify Customer"
        note "Offer alternatives or back-order option."

    decision stock_check as "Stock Available?":
        in_stock*  as "In Stock"    > process_payment
        out_of_stock as "Out of Stock" > notify_unavailable

actor Warehouse
    task(manual) pick_pack  as "Pick & Pack Order"
        kpi fulfilment_time < 2h
    task(service) dispatch   as "Dispatch with Courier"
        rule "Same-day dispatch if confirmed before 2pm."

decision fulfil as "Fulfil Order" 
    Fulfilled > dispatch
    Notdone > pick_pack

flow key
    order_placed > place_order > check_inventory > stock_check

process_payment > fulfil > dispatch > order_fulfilled
notify_unavailable > order_cancelled

---context---
description: "End-to-end order fulfillment from customer purchase to dispatch."
owners: [ecommerce-platform, warehouse-ops]

`;

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
        <PlatformHeader
          section="Interactive demo"
          badge="Preview"
          homeHref="/"
          rightSlot={<Link href="/auth/signin?from=demo" className="text-sm font-medium text-gray-600 hover:text-teal">Sign in to save work</Link>}
        />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-gray-400">Loading viewer...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col page-enter">
      <PlatformHeader
        section="Interactive demo"
        badge="Preview"
        homeHref="/"
        rightSlot={<Link href="/auth/signin?from=demo" className="text-sm font-medium text-gray-600 hover:text-teal">Sign in to save work</Link>}
      />
      {/* ── Workspace mode tabs ─────────────────────────────── */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 md:px-6">
        <span className="mr-2 text-xs font-semibold text-gray-500">
          Mode:
        </span>
        {(['editor', 'ai-assistant'] as const).map((tabMode) => (
          <button
            key={tabMode}
            onClick={() => setMode(tabMode)}
            className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition-colors ${
              mode === tabMode
                ? 'border-teal/30 bg-teal/10 font-semibold text-teal'
                : 'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <span>{tabMode === 'editor' ? 'Editor' : 'AI Assistant'}</span>
          </button>
        ))}
        {state.isDirty && (
          <span className="ml-3 inline-flex items-center gap-1 text-[11px] text-amber-700" title="Unsaved changes">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Unsaved
          </span>
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
