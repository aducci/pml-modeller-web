'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ProcessCanvas from '../core/ProcessCanvas';
import { CanvasToolbar } from './CanvasToolbar';
import { DEFAULT_PROCESS_THEME } from '../core/styling/defaultProcessTheme';
import { DEFAULT_LAYOUT_SETTINGS } from '../core/processLayout/layoutTypes';
import { deepMerge } from '../core/deepMerge';
// Asymmetric top-left margin on fit-to-view (vs. the even margin used for the
// zoom calculation) reads better than a centered fit — purely an aesthetic
// constant, not something a user needs to tune, so it stays a literal here.
// Raised from 1.618 (golden ratio) to pin the diagram closer to the
// top-left corner rather than leaving a wide, near-centered gutter.
const FIT_VIEW_GOLDEN_RATIO = 4;
export const ProcessCanvasView = ({ state, onZoom, onPan, onSetViewport, onSelect, onDoubleClickElement, onResetView, onToggleLanes, onToggleLaneMode, viewAsActor, highlightNodeIds, flowVisibility, connectorStyle, curtainsOn = true, }) => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef(null);
    const lastFittedLayoutRef = useRef(null);
    const [interactionMode, setInteractionMode] = useState('select');
    const showLanes = (state.layoutResult?.settings?.layout?.showLanes ?? true) && state.viewPanel?.swimlanesOn;
    const zoomBounds = state.layoutResult?.settings?.viewport ?? DEFAULT_LAYOUT_SETTINGS.viewport;
    // Track container size with ResizeObserver
    useEffect(() => {
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setDimensions({ width, height });
        });
        if (containerRef.current)
            ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);
    // Compute fit viewport from layout result + container dimensions
    const computeFitViewport = useCallback((layoutResult) => {
        // Read actual container size — more reliable than ResizeObserver state
        const rect = containerRef.current?.getBoundingClientRect();
        const vw = rect?.width ?? dimensions.width;
        const vh = rect?.height ?? dimensions.height;
        if (!vw || !vh || !layoutResult)
            return null;
        const { bounds, settings, lanes } = layoutResult;
        const canvasPadding = settings?.spacing?.canvasPaddingX ?? DEFAULT_LAYOUT_SETTINGS.spacing.canvasPaddingX;
        const canvasPaddingY = settings?.spacing?.canvasPaddingY ?? DEFAULT_LAYOUT_SETTINGS.spacing.canvasPaddingY;
        const visualBoundsPadding = settings?.canvasConfig?.visualBoundsPadding ?? DEFAULT_LAYOUT_SETTINGS.canvasConfig.visualBoundsPadding;
        const viewport = settings?.viewport ?? DEFAULT_LAYOUT_SETTINGS.viewport;
        // Mirror ProcessCanvas visual bounds calculation
        let maxLaneY = bounds.height;
        if (lanes?.length > 0) {
            maxLaneY = Math.max(...lanes.map((l) => l.y + l.height));
        }
        // Full canvas content spans from (0,0) to (fullW, fullH) in canvas space
        const fullW = bounds.width + canvasPadding * 2 + visualBoundsPadding * 2;
        const fullH = maxLaneY + canvasPaddingY * 2 + visualBoundsPadding * 2;
        const margin = viewport.fitMarginPx;
        const zoom = Math.min((vw - margin * 2) / fullW, (vh - margin * 2) / fullH, viewport.fitMaxZoom);
        const topLeftMargin = margin / FIT_VIEW_GOLDEN_RATIO;
        const panX = topLeftMargin;
        const panY = topLeftMargin;
        return { zoom, panX, panY };
    }, [dimensions]);
    const fitToView = useCallback(() => {
        if (!state.layoutResult)
            return;
        const vp = computeFitViewport(state.layoutResult);
        if (vp)
            onSetViewport(vp.zoom, vp.panX, vp.panY);
    }, [state.layoutResult, computeFitViewport, onSetViewport]);
    // Auto-fit whenever a new layout result arrives (new diagram or re-parse)
    useEffect(() => {
        if (!state.layoutResult)
            return;
        if (state.layoutResult === lastFittedLayoutRef.current)
            return;
        // Wait for container to have real dimensions before fitting
        if (dimensions.width === 0)
            return;
        lastFittedLayoutRef.current = state.layoutResult;
        const vp = computeFitViewport(state.layoutResult);
        if (vp)
            onSetViewport(vp.zoom, vp.panX, vp.panY);
    }, [state.layoutResult, dimensions, computeFitViewport, onSetViewport]);
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            const target = e.target;
            const isInput = target.tagName === 'INPUT' ||
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
            if (!mod)
                return;
            if (e.key === '0') {
                e.preventDefault();
                onResetView();
            }
            else if (e.key === '=' || e.key === '+') {
                e.preventDefault();
                onZoom(Math.min(zoomBounds.zoomMax, state.zoom + zoomBounds.zoomStep));
            }
            else if (e.key === '-') {
                e.preventDefault();
                onZoom(Math.max(zoomBounds.zoomMin, state.zoom - zoomBounds.zoomStep));
            }
            else if (e.key === 'f' || (e.shiftKey && e.key === 'F')) {
                e.preventDefault();
                fitToView();
            }
            else if (e.key === 'l' && !e.repeat) {
                e.preventDefault();
                onToggleLanes?.();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state.zoom, onZoom, onResetView, fitToView, onToggleLanes, zoomBounds]);
    const resolvedTheme = useMemo(() => deepMerge(DEFAULT_PROCESS_THEME, state.themeOverrides), [state.themeOverrides]);
    const handleExportSvg = useCallback(() => {
        const svg = containerRef.current?.querySelector('svg');
        if (!svg)
            return;
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
        return (_jsxs("div", { ref: containerRef, style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#F8F7F4', color: '#94A3B8' }, children: [_jsxs("svg", { width: "36", height: "36", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", style: { opacity: 0.35 }, children: [_jsx("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1.5" }), _jsx("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1.5" }), _jsx("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1.5" }), _jsx("path", { d: "M17.5 14v7M14 17.5h7" }), _jsx("path", { d: "M10 6.5h4M6.5 10v4" })] }), _jsx("p", { style: { fontSize: 13, margin: 0 }, children: "Write PML in the editor to visualise your process" }), _jsxs("p", { style: { fontSize: 11, margin: 0, opacity: 0.6 }, children: ["e.g. ", _jsx("code", { children: "@process L1 \"My Process\"" })] })] }));
    }
    return (_jsxs("div", { ref: containerRef, style: { position: 'relative', width: '100%', height: '100%' }, children: [state.processName && (_jsx("div", { style: {
                    position: 'absolute', top: 10, left: 12, zIndex: 10,
                    fontSize: 11, fontWeight: 600, color: '#94A3B8',
                    letterSpacing: '0.03em', userSelect: 'none', pointerEvents: 'none',
                    textTransform: 'uppercase',
                }, children: state.processName })), _jsx(ProcessCanvas, { layoutResult: state.layoutResult, zoom: state.zoom, panX: state.panX, panY: state.panY, viewportWidth: dimensions.width || 800, viewportHeight: dimensions.height || 600, theme: resolvedTheme, interactionMode: interactionMode, onZoomRequest: (delta) => onZoom(Math.max(zoomBounds.zoomMin, Math.min(zoomBounds.zoomMax, state.zoom + delta))), onPanRequest: onPan, selectedElement: state.selectedElement, onElementSelect: onSelect, onElementDoubleClick: onDoubleClickElement, showLanes: showLanes, viewAsActor: viewAsActor, highlightNodeIds: highlightNodeIds, flowVisibility: flowVisibility, connectorStyle: connectorStyle, curtainsOn: curtainsOn }), state.layoutResult && (() => {
                const nodeCount = (state.layoutResult.nodes ?? []).filter((n) => n.x !== undefined).length;
                const edgeCount = (state.layoutResult.edges ?? []).length;
                const laneCount = (state.layoutResult.lanes ?? []).length;
                return (_jsxs("div", { style: {
                        position: 'absolute', bottom: 48, right: 12, zIndex: 10,
                        fontSize: 10, color: '#94A3B8', userSelect: 'none', pointerEvents: 'none',
                        fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em',
                    }, children: [nodeCount, " nodes \u00B7 ", edgeCount, " edges \u00B7 ", laneCount, " lane", laneCount !== 1 ? 's' : ''] }));
            })(), _jsx(CanvasToolbar, { zoom: state.zoom, interactionMode: interactionMode, onSetInteractionMode: setInteractionMode, onZoomIn: () => onZoom(Math.min(zoomBounds.zoomMax, state.zoom + zoomBounds.zoomStep)), onZoomOut: () => onZoom(Math.max(zoomBounds.zoomMin, state.zoom - zoomBounds.zoomStep)), onReset: onResetView, onFit: fitToView, onExportSvg: handleExportSvg, showLanes: showLanes, onToggleLanes: onToggleLanes, laneMode: state.layoutResult?.settings?.layout?.laneMode ?? 'standard' })] }));
};
