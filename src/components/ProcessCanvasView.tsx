import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { WorkspaceState, SelectedElement } from 'pml-core';
import ProcessCanvas from './preview/ProcessCanvas';
import { CanvasToolbar } from './CanvasToolbar';
import { DEFAULT_PROCESS_THEME } from 'pml-core';

const FIT_VIEW_MARGIN = 32;
const FIT_VIEW_GOLDEN_RATIO = 1.618;
const FIT_VIEW_MAX_ZOOM = 1.5;

function mergeDeep(base: any, overrides: any): any {
  if (!overrides || Object.keys(overrides).length === 0) return base;
  const result: any = { ...base };
  for (const key of Object.keys(overrides)) {
    if (typeof overrides[key] === 'object' && overrides[key] !== null && !Array.isArray(overrides[key]) && typeof base[key] === 'object') {
      result[key] = mergeDeep(base[key], overrides[key]);
    } else {
      result[key] = overrides[key];
    }
  }
  return result;
}

const memoizedMergeDeep = (base: any, overrides: any) => mergeDeep(base, overrides);

export type InteractionMode = 'select' | 'pan';

export interface ProcessCanvasViewProps {
  state: WorkspaceState;
  onZoom: (zoom: number) => void;
  onPan: (dx: number, dy: number) => void;
  onSetViewport: (zoom: number, panX: number, panY: number) => void;
  onSelect: (type: SelectedElement['type'], id: string) => void;
  onResetView: () => void;
  onToggleLanes?: () => void;
  viewAsActor?: string | null;
  flowVisibility?: { main: boolean; alternate: boolean; exception: boolean; termination: boolean };
  curtainsOn?: boolean;
}

export const ProcessCanvasView: React.FC<ProcessCanvasViewProps> = ({
  state,
  onZoom,
  onPan,
  onSetViewport,
  onSelect,
  onResetView,
  onToggleLanes,
  viewAsActor,
  flowVisibility,
  curtainsOn = true,
}) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFittedLayoutRef = useRef<any>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('select');

  const showLanes = (state.layoutResult?.settings?.layout?.showLanes ?? true) && state.viewPanel?.swimlanesOn;

  // Track container size with ResizeObserver
  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDimensions({ width, height });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Compute fit viewport from layout result + container dimensions
  const computeFitViewport = useCallback((layoutResult: any) => {
    // Read actual container size — more reliable than ResizeObserver state
    const rect = containerRef.current?.getBoundingClientRect();
    const vw = rect?.width ?? dimensions.width;
    const vh = rect?.height ?? dimensions.height;
    if (!vw || !vh || !layoutResult) return null;

    const { bounds, settings, lanes } = layoutResult;
    const canvasPadding = settings?.spacing?.canvasPaddingX ?? 60;
    const canvasPaddingY = settings?.spacing?.canvasPaddingY ?? 24;
    const visualBoundsPadding = settings?.canvasConfig?.visualBoundsPadding ?? 24;

    // Mirror ProcessCanvas visual bounds calculation
    let maxLaneY = bounds.height;
    if (lanes?.length > 0) {
      maxLaneY = Math.max(...lanes.map((l: any) => l.y + l.height));
    }

    // Full canvas content spans from (0,0) to (fullW, fullH) in canvas space
    const fullW = bounds.width + canvasPadding * 2 + visualBoundsPadding * 2;
    const fullH = maxLaneY + canvasPaddingY * 2 + visualBoundsPadding * 2;

    const margin = FIT_VIEW_MARGIN;
    const zoom = Math.min(
      (vw - margin * 2) / fullW,
      (vh - margin * 2) / fullH,
      FIT_VIEW_MAX_ZOOM
    );

    const topLeftMargin = margin / FIT_VIEW_GOLDEN_RATIO;
    const panX = topLeftMargin;
    const panY = topLeftMargin;

    return { zoom, panX, panY };
  }, [dimensions]);

  const fitToView = useCallback(() => {
    if (!state.layoutResult) return;
    const vp = computeFitViewport(state.layoutResult);
    if (vp) onSetViewport(vp.zoom, vp.panX, vp.panY);
  }, [state.layoutResult, computeFitViewport, onSetViewport]);

  // Auto-fit whenever a new layout result arrives (new diagram or re-parse)
  useEffect(() => {
    if (!state.layoutResult) return;
    if (state.layoutResult === lastFittedLayoutRef.current) return;
    // Wait for container to have real dimensions before fitting
    if (dimensions.width === 0) return;
    lastFittedLayoutRef.current = state.layoutResult;
    const vp = computeFitViewport(state.layoutResult);
    if (vp) onSetViewport(vp.zoom, vp.panX, vp.panY);
  }, [state.layoutResult, dimensions, computeFitViewport, onSetViewport]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('.monaco-editor');

      // Do not intercept plain keys if typing in an editor/input
      if (isInput && !e.metaKey && !e.ctrlKey) {
        return;
      }

      const mod = e.metaKey || e.ctrlKey;

      // Space = toggle pan mode
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        setInteractionMode((m) => (m === 'pan' ? 'select' : 'pan'));
        return;
      }

      if (!mod) return;

      if (e.key === '0') {
        e.preventDefault();
        onResetView();
      } else if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        onZoom(Math.min(3, state.zoom + 0.1));
      } else if (e.key === '-') {
        e.preventDefault();
        onZoom(Math.max(0.1, state.zoom - 0.1));
      } else       if (e.key === 'f' || (e.shiftKey && e.key === 'F')) {
        e.preventDefault();
        fitToView();
      } else if (e.key === 'l' && !e.repeat) {
        e.preventDefault();
        onToggleLanes?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.zoom, onZoom, onResetView, fitToView]);

  const resolvedTheme = useMemo(
    () => mergeDeep(DEFAULT_PROCESS_THEME, state.themeOverrides),
    [state.themeOverrides]
  );

  const handleExportSvg = useCallback(() => {
    const svg = containerRef.current?.querySelector('svg');
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    navigator.clipboard.writeText(serialized).catch(() => {
      const blob = new Blob([serialized], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'process.svg';
      a.click();
      URL.revokeObjectURL(url);
    });
  }, []);

  if (!state.layoutResult) {
    return (
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#F8F7F4', color: '#94A3B8' }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <path d="M17.5 14v7M14 17.5h7" />
          <path d="M10 6.5h4M6.5 10v4" />
        </svg>
        <p style={{ fontSize: 13, margin: 0 }}>Write PML in the editor to visualise your process</p>
        <p style={{ fontSize: 11, margin: 0, opacity: 0.6 }}>e.g. <code>@process L1 "My Process"</code></p>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {state.processName && (
        <div style={{
          position: 'absolute', top: 10, left: 12, zIndex: 10,
          fontSize: 11, fontWeight: 600, color: '#94A3B8',
          letterSpacing: '0.03em', userSelect: 'none', pointerEvents: 'none',
          textTransform: 'uppercase',
        }}>
          {state.processName}
        </div>
      )}
      <ProcessCanvas
        layoutResult={state.layoutResult}
        zoom={state.zoom}
        panX={state.panX}
        panY={state.panY}
        viewportWidth={dimensions.width || 800}
        viewportHeight={dimensions.height || 600}
        theme={resolvedTheme}
        interactionMode={interactionMode}
        onZoomRequest={(delta) => onZoom(Math.max(0.1, Math.min(3, state.zoom + delta)))}
        onPanRequest={onPan}
        selectedElement={state.selectedElement}
        onElementSelect={onSelect}
        showLanes={showLanes}
        viewAsActor={viewAsActor}
        flowVisibility={flowVisibility}
        curtainsOn={curtainsOn}
      />
      {/* Canvas stats — bottom left */}
      {state.layoutResult && (() => {
        const nodeCount = (state.layoutResult.nodes ?? []).filter((n: any) => n.x !== undefined).length;
        const edgeCount = (state.layoutResult.edges ?? []).length;
        const laneCount = (state.layoutResult.lanes ?? []).length;
        return (
          <div style={{
            position: 'absolute', bottom: 10, left: 12, zIndex: 10,
            fontSize: 10, color: '#94A3B8', userSelect: 'none', pointerEvents: 'none',
            fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em',
          }}>
            {nodeCount} nodes · {edgeCount} edges · {laneCount} lane{laneCount !== 1 ? 's' : ''}
          </div>
        );
      })()}
      <CanvasToolbar
        zoom={state.zoom}
        interactionMode={interactionMode}
        onSetInteractionMode={setInteractionMode}
        onZoomIn={() => onZoom(Math.min(3, state.zoom + 0.1))}
        onZoomOut={() => onZoom(Math.max(0.1, state.zoom - 0.1))}
        onReset={onResetView}
        onFit={fitToView}
        onExportSvg={handleExportSvg}
        showLanes={showLanes}
        onToggleLanes={onToggleLanes}
      />
    </div>
  );
};
