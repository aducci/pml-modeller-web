'use client';
/**
 * Process Canvas — SVG renderer
 *
 * Policy: This is a pure renderer. All rendering decisions (colours, visibility,
 * icon layout) are made in buildNodeRenderModels(). The SceneRenderModel is the
 * sole render contract — nothing reads LayoutNode directly.
 *
 * Policy: Interaction state (hover, selection) is applied as CSS classes on <g>
 * elements at render time, not as fields in the render model. The model stays
 * stable until layout or theme changes.
 */
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useRef, useState, useMemo } from 'react';
import { resolveThemeFromLayoutSettings } from './styling/styleAdapter';
import { buildProcessLabelControllerResult } from './rendering/labelController';
import { computeCurtainGeometry } from './rendering/curtainGeometry';
import { buildNodeRenderModels } from './rendering/buildNodeRenderModels';
export default function ProcessCanvas({ layoutResult, zoom, panX, panY, viewportWidth, viewportHeight, theme, interactionMode = 'select', onZoomRequest, onPanRequest, selectedElement, onElementSelect, showLanes = true, viewAsActor, flowVisibility, connectorStyle = 'flowTypes', curtainsOn = true, }) {
    const svgRef = useRef(null);
    const activePointerIdRef = useRef(null);
    const lastPointerPositionRef = useRef(null);
    const didPanDuringPointerRef = useRef(false);
    const [isPanning, setIsPanning] = useState(false);
    const [isPanGestureArmed, setIsPanGestureArmed] = useState(false);
    const [hoveredNodeId, setHoveredNodeId] = useState(null);
    const shouldStartPanGesture = useCallback((e) => {
        const isMiddleButton = e.button === 1;
        const isModifierDrag = e.button === 0 && (e.shiftKey || e.ctrlKey || e.metaKey);
        const isPanMode = interactionMode === 'pan' && e.button === 0;
        return isMiddleButton || isModifierDrag || isPanMode;
    }, [interactionMode]);
    const shouldIgnoreSelectionClick = useCallback((e) => {
        if (!didPanDuringPointerRef.current)
            return false;
        didPanDuringPointerRef.current = false;
        e.stopPropagation();
        return true;
    }, []);
    const getLocalPoint = useCallback((clientX, clientY) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect)
            return null;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }, []);
    const handleWheel = useCallback((e) => {
        const localPoint = getLocalPoint(e.clientX, e.clientY);
        if (!localPoint)
            return;
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onZoomRequest?.(e.deltaY > 0 ? -0.1 : 0.1, localPoint);
            return;
        }
        if (onPanRequest) {
            e.preventDefault();
            onPanRequest(-e.deltaX, -e.deltaY);
        }
    }, [getLocalPoint, onPanRequest, onZoomRequest]);
    const handlePointerDown = useCallback((e) => {
        const svgEl = svgRef.current;
        if (!svgEl || !shouldStartPanGesture(e))
            return;
        const localPoint = getLocalPoint(e.clientX, e.clientY);
        if (!localPoint)
            return;
        activePointerIdRef.current = e.pointerId;
        lastPointerPositionRef.current = localPoint;
        didPanDuringPointerRef.current = false;
        setIsPanning(true);
        svgEl.setPointerCapture(e.pointerId);
        e.preventDefault();
    }, [getLocalPoint, shouldStartPanGesture]);
    const handlePointerMove = useCallback((e) => {
        if (activePointerIdRef.current !== e.pointerId)
            return;
        const currentPoint = getLocalPoint(e.clientX, e.clientY);
        const lastPoint = lastPointerPositionRef.current;
        if (!currentPoint || !lastPoint)
            return;
        const dx = currentPoint.x - lastPoint.x;
        const dy = currentPoint.y - lastPoint.y;
        lastPointerPositionRef.current = currentPoint;
        if ((dx !== 0 || dy !== 0) && onPanRequest) {
            if (Math.abs(dx) + Math.abs(dy) > 1)
                didPanDuringPointerRef.current = true;
            onPanRequest(dx, dy);
        }
    }, [getLocalPoint, onPanRequest]);
    const handlePointerUp = useCallback((e) => {
        const svgEl = svgRef.current;
        if (activePointerIdRef.current !== e.pointerId || !svgEl)
            return;
        activePointerIdRef.current = null;
        lastPointerPositionRef.current = null;
        setIsPanning(false);
        if (svgEl.hasPointerCapture(e.pointerId))
            svgEl.releasePointerCapture(e.pointerId);
    }, []);
    React.useEffect(() => {
        const onKeyDown = (event) => {
            if (event.shiftKey || event.ctrlKey || event.metaKey)
                setIsPanGestureArmed(true);
        };
        const onKeyUp = (event) => {
            if (!(event.shiftKey || event.ctrlKey || event.metaKey))
                setIsPanGestureArmed(false);
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
    }, []);
    // ── Build the scene render model (memoized on structural inputs) ──
    const { bounds, nodes, edges, lanes, settings } = layoutResult;
    const effectiveShowLanes = showLanes ?? settings.layout.showLanes ?? true;
    const resolvedTheme = theme ?? resolveThemeFromLayoutSettings(settings);
    const canvasTokens = resolvedTheme.canvasTokens;
    const typography = resolvedTheme.typography;
    const themeEdges = resolvedTheme.edges;
    const themeLanes = resolvedTheme.lanes;
    const padding = settings.spacing.canvasPaddingX;
    const laneHeaderHeight = canvasTokens.laneHeaderHeight;
    const visibilityMode = settings.routing.visibilityMode ?? 'default';
    const revealGroups = settings.routing.revealGroups ?? [];
    const inboundEventNodes = useMemo(() => nodes.filter((n) => n.type === 'event' && n.metadata?.direction === 'inbound' && n.x !== undefined && n.y !== undefined), [nodes]);
    const outboundEventNodes = useMemo(() => nodes.filter((n) => n.type === 'event' && n.metadata?.direction === 'outbound' && n.x !== undefined && n.y !== undefined), [nodes]);
    // Pre-compute label positions
    const labelScene = useMemo(() => buildProcessLabelControllerResult(nodes, edges, resolvedTheme, padding), [nodes, edges, resolvedTheme, padding]);
    // Build curtain geometry
    const curtains = useMemo(() => {
        let minLaneX = padding + bounds.width;
        let maxLaneX = padding;
        if (lanes.length > 0) {
            minLaneX = padding + Math.min(...lanes.map((l) => l.x));
            maxLaneX = padding + Math.max(...lanes.map((l) => l.x + l.width));
        }
        return computeCurtainGeometry({
            inboundEventNodes,
            outboundEventNodes,
            minLaneX,
            maxLaneX,
            padding,
            boundsWidth: bounds.width,
            canvasTokens,
            estimatedCharWidth: settings.heuristics.estimatedCharWidth,
            textPaddingX: settings.heuristics.textPaddingX,
        });
    }, [inboundEventNodes, outboundEventNodes, lanes, padding, bounds.width, canvasTokens, settings.heuristics.estimatedCharWidth, settings.heuristics.textPaddingX]);
    // ── Build the scene render model ──
    const scene = useMemo(() => buildNodeRenderModels(layoutResult, labelScene, resolvedTheme, {
        padding,
        laneHeaderHeight,
        showLanes,
        viewAsActor: viewAsActor ?? null,
        selectedElementId: selectedElement?.id ?? null,
        effectiveShowLanes,
        metaIconSize: 14,
        metaIconGap: 2,
        metaIconCornerRadius: 3,
        showMetaIcons: layoutResult.settings?.layout?.showMetaIcons ?? true,
    }, visibilityMode, revealGroups, selectedElement?.id, flowVisibility, curtains, inboundEventNodes, outboundEventNodes, connectorStyle), [
        layoutResult, labelScene, resolvedTheme, padding, laneHeaderHeight,
        showLanes, viewAsActor, selectedElement?.id, effectiveShowLanes,
        visibilityMode, revealGroups, flowVisibility, curtains,
        inboundEventNodes, outboundEventNodes, connectorStyle,
    ]);
    // Compute canvas dimensions
    const renderBounds = useMemo(() => {
        let minLaneY = 0;
        let maxLaneY = bounds.height;
        if (lanes.length > 0) {
            minLaneY = Math.min(...lanes.map((l) => l.y));
            maxLaneY = Math.max(...lanes.map((l) => l.y + l.height));
        }
        const leftX = curtains.left.x;
        const leftW = curtains.left.width;
        const rightX = curtains.right.x;
        const rightW = curtains.right.width;
        const minVX = Math.min(padding, leftX - canvasTokens.visualBoundsPadding);
        const maxVX = Math.max(padding + bounds.width, rightX + rightW + canvasTokens.visualBoundsPadding);
        const minVY = Math.min(padding, padding + minLaneY - canvasTokens.visualBoundsPadding);
        const maxVY = Math.max(padding + bounds.height, padding + maxLaneY + canvasTokens.visualBoundsPadding);
        return {
            width: Math.max((maxVX - minVX) + padding * 2, settings.canvas.width || 800),
            height: Math.max((maxVY - minVY) + padding * 2, settings.canvas.height || 600),
        };
    }, [bounds, lanes, padding, curtains, canvasTokens, settings.canvas]);
    // ── Click handler for lane selection ──
    const handleLaneClick = useCallback((laneId, e) => {
        if (e.target.closest('button, input, select'))
            return;
        e.stopPropagation();
        onElementSelect?.('lane', laneId);
    }, [onElementSelect]);
    // ── Click handler for edge selection ──
    const handleEdgeClick = useCallback((edgeId, e) => {
        if (shouldIgnoreSelectionClick(e))
            return;
        e.stopPropagation();
        onElementSelect?.('edge', edgeId);
    }, [onElementSelect, shouldIgnoreSelectionClick]);
    // ── Click handler for node selection ──
    const handleNodeClick = useCallback((nodeId, e) => {
        if (shouldIgnoreSelectionClick(e))
            return;
        e.stopPropagation();
        onElementSelect?.('node', nodeId);
    }, [onElementSelect, shouldIgnoreSelectionClick]);
    return (_jsxs("svg", { ref: svgRef, width: viewportWidth, height: viewportHeight, viewBox: `0 0 ${viewportWidth} ${viewportHeight}`, style: {
            display: 'block',
            background: '#F8F7F4',
            cursor: isPanning ? 'grabbing' : (interactionMode === 'pan' || isPanGestureArmed) ? 'grab' : 'default',
            touchAction: 'none',
            userSelect: 'none',
        }, onWheel: handleWheel, onPointerDown: handlePointerDown, onPointerMove: handlePointerMove, onPointerUp: handlePointerUp, onPointerCancel: handlePointerUp, children: [_jsxs("defs", { children: [_jsx("marker", { id: "edgeArrow", markerWidth: "10", markerHeight: "10", refX: "9", refY: "3", orient: "auto", children: _jsx("polygon", { points: "0 0, 10 3, 0 6", fill: themeEdges.marker.fill }) }), _jsx("filter", { id: "nodeShadow", x: "-20%", y: "-20%", width: "140%", height: "140%", children: _jsx("feDropShadow", { dx: "0", dy: "1", stdDeviation: "1.2", floodColor: "#0f172a", floodOpacity: "0.10" }) }), _jsx("pattern", { id: "grid", width: "24", height: "24", patternUnits: "userSpaceOnUse", children: _jsx("circle", { cx: "0.5", cy: "0.5", r: "1", fill: "#CBD5E1", opacity: "0.55" }) })] }), _jsxs("g", { transform: `translate(${panX} ${panY}) scale(${zoom})`, children: [_jsx("rect", { x: "0", y: "0", width: renderBounds.width, height: renderBounds.height, fill: "url(#grid)" }), curtainsOn && scene.curtains.map((curtain) => renderCurtain(curtain)), scene.lanes.map((lane) => renderLaneModel(lane, selectedElement?.id, handleLaneClick)), scene.edges.map((edge) => renderEdgeModel(edge, handleEdgeClick)), scene.nodes.map((node) => renderNodeModel(node, hoveredNodeId, setHoveredNodeId, handleNodeClick)), _jsx("rect", { x: scene.visualBounds.x, y: scene.visualBounds.y, width: scene.visualBounds.width, height: scene.visualBounds.height, fill: "none", stroke: themeLanes.borderColor, strokeWidth: "1", strokeDasharray: "5,5", opacity: "0.4", rx: "8" })] })] }));
}
// ============================================================================
// Lane renderer
// ============================================================================
function renderLaneModel(lane, selectedLaneId, onLaneClick) {
    const isSelected = selectedLaneId === lane.id;
    const borderColor = isSelected ? lane.borderColor : lane.borderColor;
    const borderWidth = isSelected ? lane.borderWidth : lane.borderWidth;
    return (_jsxs("g", { onClick: (e) => onLaneClick?.(lane.id, e), className: "cursor-pointer transition-opacity hover:opacity-90", children: [_jsx("rect", { x: lane.x, y: lane.y, width: lane.width, height: lane.height, fill: lane.bodyFill, stroke: borderColor, strokeWidth: borderWidth, rx: lane.cornerRadius }), _jsx("rect", { x: lane.x, y: lane.y, width: lane.width, height: lane.headerHeight, fill: lane.headerFill, stroke: lane.headerBorderColor, strokeWidth: borderWidth, rx: lane.cornerRadius }), lane.label && (_jsx("text", { x: lane.x + 10, y: lane.y + lane.headerHeight / 2, fontSize: lane.headerHeight * 0.45, fontWeight: lane.headerFontWeight, fill: lane.labelColor, opacity: lane.headerLabelOpacity, dominantBaseline: "middle", children: lane.label }))] }, lane.id));
}
// ============================================================================
// Curtain renderer
// ============================================================================
function renderCurtain(curtain) {
    return (_jsxs("g", { children: [_jsx("rect", { x: curtain.x, y: curtain.y, width: curtain.width, height: curtain.height, fill: curtain.fill, fillOpacity: curtain.fillOpacity, stroke: curtain.stroke, strokeWidth: curtain.strokeWidth, rx: 4 }), _jsx("text", { x: curtain.labelX, y: curtain.labelY, textAnchor: "middle", fontSize: 14, fontWeight: 600, fill: curtain.labelColor, children: curtain.label })] }, curtain.side));
}
// ============================================================================
// Edge renderer
// ============================================================================
function renderEdgeModel(edge, onEdgeClick) {
    const points = edge.waypoints.map((p) => `${p.x},${p.y}`).join(' ');
    return (_jsxs("g", { onClick: (e) => onEdgeClick?.(edge.id, e), className: "cursor-pointer", children: [_jsx("polyline", { points: points, fill: "none", stroke: edge.haloColor, strokeWidth: edge.strokeWidth + edge.haloWidth, strokeLinecap: "round", strokeLinejoin: "round", opacity: "0.9" }), _jsx("polyline", { points: points, fill: "none", stroke: edge.stroke, strokeWidth: edge.strokeWidth, strokeDasharray: edge.strokeDasharray, strokeLinecap: "round", strokeLinejoin: "round", opacity: edge.opacity }), edge.showArrow && (_jsx("polyline", { points: points, fill: "none", stroke: "none", markerEnd: "url(#edgeArrow)" })), edge.label && (_jsx("text", { x: edge.label.x, y: edge.label.y + edge.label.height / 2 - edge.label.fontSize / 3, fontSize: edge.label.fontSize, fontWeight: edge.label.fontWeight, fill: edge.label.fill, stroke: edge.label.haloFill, strokeWidth: edge.label.haloWidth, paintOrder: "stroke", textAnchor: "middle", className: "pointer-events-none select-none", children: edge.label.text }))] }, edge.id));
}
// ============================================================================
// Node renderer — reads exclusively from NodeRenderModel
// ============================================================================
function renderNodeModel(node, hoveredNodeId, setHoveredNodeId, onNodeClick) {
    const isHovered = hoveredNodeId === node.id;
    const isSelected = false; // selection state is reflected in shape.stroke, not a local var
    return (_jsxs("g", { className: "select-none cursor-pointer", style: { opacity: node.opacity }, onMouseEnter: () => setHoveredNodeId(node.id), onMouseLeave: () => setHoveredNodeId(null), onClick: (e) => onNodeClick?.(node.id, e), children: [isHovered && renderHoverRing(node), renderShape(node), false && node.ports.map((port) => (_jsx("circle", { cx: port.cx, cy: port.cy, r: port.r, fill: port.fill, stroke: port.stroke, strokeWidth: port.strokeWidth }, port.anchor))), node.actorPill && (_jsxs("g", { className: "pointer-events-none", children: [_jsx("rect", { x: node.actorPill.x, y: node.actorPill.y, width: node.actorPill.width, height: node.actorPill.height, rx: node.actorPill.rx, fill: node.actorPill.bg, stroke: node.actorPill.stroke, strokeWidth: "0.5" }), _jsx("text", { x: node.actorPill.textX, y: node.actorPill.textY, textAnchor: "middle", fontSize: node.actorPill.fontSize, fontWeight: node.actorPill.fontWeight, fill: node.actorPill.fill, children: node.actorPill.label })] })), node.taskTypeMarker && (_jsx("text", { x: node.taskTypeMarker.x, y: node.taskTypeMarker.y, fontSize: node.taskTypeMarker.fontSize, fill: node.taskTypeMarker.fill, className: "pointer-events-none", children: node.taskTypeMarker.text })), node.gatewayMarker && (_jsx("text", { x: node.gatewayMarker.x, y: node.gatewayMarker.y, fontSize: node.gatewayMarker.fontSize, fill: node.gatewayMarker.fill, fontWeight: 700, textAnchor: "middle", dominantBaseline: "central", className: "pointer-events-none", children: node.gatewayMarker.text })), node.statusIndicator && (_jsx("g", { className: "pointer-events-none", children: _jsx("circle", { cx: node.statusIndicator.cx, cy: node.statusIndicator.cy, r: node.statusIndicator.r, fill: node.statusIndicator.fill }) })), node.metaIcons.length > 0 && (_jsx("g", { className: "pointer-events-none", children: node.metaIcons.map((icon, idx) => (_jsxs("g", { children: [_jsx("title", { children: icon.title }), _jsx("rect", { x: icon.bounds.x, y: icon.bounds.y, width: icon.bounds.width, height: icon.bounds.height, rx: 3, fill: icon.bg, stroke: icon.color, strokeWidth: "0.5" }), _jsx("g", { transform: `translate(${icon.bounds.x + 1}, ${icon.bounds.y + 1}) scale(0.5)`, fill: "none", stroke: icon.color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: icon.paths.map((d, pi) => (_jsx("path", { d: d }, pi))) })] }, `${node.id}-meta-${idx}`))) })), node.primaryLabel && (_jsx("g", { className: "pointer-events-none", children: _jsx("text", { x: node.primaryLabel.x, y: node.primaryLabel.y, textAnchor: node.primaryLabel.textAnchor, dominantBaseline: node.primaryLabel.dominantBaseline, fontSize: node.primaryLabel.fontSize, fontWeight: node.primaryLabel.fontWeight, fill: node.primaryLabel.fill, style: { paintOrder: 'stroke', stroke: node.shape.fill, strokeWidth: 2 }, children: node.primaryLabel.lines.map((line, i) => (_jsx("tspan", { x: node.primaryLabel.x, dy: line.dy, children: line.text }, i))) }) })), node.secondaryLabel && (_jsx("text", { x: node.secondaryLabel.x, y: node.secondaryLabel.y, textAnchor: "middle", fontSize: node.secondaryLabel.fontSize, fontWeight: node.secondaryLabel.fontWeight, fill: node.secondaryLabel.fill, opacity: node.secondaryLabel.opacity, style: {
                    letterSpacing: node.secondaryLabel.letterSpacing,
                    paintOrder: 'stroke',
                    stroke: node.shape.fill,
                    strokeWidth: 2,
                }, className: "pointer-events-none", children: node.secondaryLabel.text }))] }, node.id));
}
// ============================================================================
// Hover ring
// ============================================================================
function renderHoverRing(node) {
    const { x, y, width, height, shape } = node;
    const cx = x + width / 2;
    const cy = y + height / 2;
    if (shape.kind === 'circle') {
        return (_jsx("circle", { cx: cx, cy: cy, r: Math.min(width, height) / 2 + 3, fill: "none", stroke: "#6366F1", strokeWidth: "1.5", opacity: "0.35" }));
    }
    if (shape.kind === 'diamond') {
        return (_jsx("polygon", { points: `${cx},${y - 4} ${x + width + 4},${cy} ${cx},${y + height + 4} ${x - 4},${cy}`, fill: "none", stroke: "#6366F1", strokeWidth: "1.5", opacity: "0.35" }));
    }
    return (_jsx("rect", { x: x - 3, y: y - 3, width: width + 6, height: height + 6, rx: (shape.cornerRadius ?? 6) + 2, fill: "none", stroke: "#6366F1", strokeWidth: "1.5", opacity: "0.35" }));
}
// ============================================================================
// Shape body
// ============================================================================
function renderShape(node) {
    const { x, y, width, height, shape } = node;
    const cx = x + width / 2;
    const cy = y + height / 2;
    if (shape.kind === 'circle') {
        return (_jsx("circle", { cx: cx, cy: cy, r: Math.min(width, height) / 2, fill: shape.fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth, strokeDasharray: shape.strokeDasharray, filter: "url(#nodeShadow)" }));
    }
    if (shape.kind === 'diamond') {
        return (_jsx("polygon", { points: `${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}`, fill: shape.fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth, strokeDasharray: shape.strokeDasharray, filter: "url(#nodeShadow)" }));
    }
    return (_jsx("rect", { x: x, y: y, width: width, height: height, rx: shape.cornerRadius ?? 6, fill: shape.fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth, strokeDasharray: shape.strokeDasharray, filter: "url(#nodeShadow)" }));
}
