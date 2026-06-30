import { FlowLayer, SemanticRole, EdgeFlowMetadata } from 'pml-core';
/**
 * Process Canvas
 *
 * SVG-based rendering of layout result with nodes, lanes, and routed edges.
 * All visual values are read from the resolved theme — no hardcoded colors.
 * Geometry decisions (curtain sizing etc.) are delegated to controller modules.
 */
'use client';
import React, { useCallback, useRef, useState } from 'react';
import { LayoutResult, LayoutNode, LayoutEdge, Lane } from 'pml-core';
import { ProcessThemeSchema, getElementStyle, LaneStyle, ProcessThemeTypography } from 'pml-core';
import { resolveThemeFromLayoutSettings } from 'pml-core';
import { buildProcessLabelControllerResult } from 'pml-core';
import { toLetterSpacing } from 'pml-core';
import { computeCurtainGeometry } from 'pml-core';
// ── Visibility filter — pure function of flowLayer × visibilityMode.
// Routing executes for all non-hidden layers; this controls render only.
// ─────────────────────────────────────────────────────────────────────
function isEdgeVisible(
  edge: LayoutEdge,
  visibilityMode: 'default' | 'guided' | 'focus' | 'full',
  revealGroups: string[],
  selectedElementId?: string | null
): boolean {
  const layer: FlowLayer = edge.flowLayer ?? 'main';
  if (layer === 'hidden') return false;
  if (layer === 'annotation') return visibilityMode !== 'default';
  switch (visibilityMode) {
    case 'default':
      return layer === 'main';
    case 'guided':
      if (layer === 'main') return true;
      if (edge.revealGroup && revealGroups.includes(edge.revealGroup)) return true;
      return false;
    case 'focus':
      if (layer === 'main') return true;
      if (selectedElementId && (edge.source === selectedElementId || edge.target === selectedElementId)) return true;
      return false;
    case 'full':
      return true;
    default:
      return layer === 'main';
  }
}

// ── Lane rendering — unified function for swimlane visuals.
// ─────────────────────────────────────────────────────────────────────
function renderLane(
  lane: Lane,
  padding: number,
  laneHeaderHeight: number,
  themeLanes: LaneStyle,
  typography: ProcessThemeTypography,
  selectedLaneId?: string | null,
  onElementSelect?: (type: 'lane', id: string) => void
): React.ReactNode {
  const isSelected = selectedLaneId === lane.id;
  const cornerRadius = themeLanes.cornerRadiusPx ?? 4;
  const laneBorderColor = isSelected ? themeLanes.selectedBorderColor : themeLanes.borderColor;
  const laneBorderWidth = isSelected ? themeLanes.selectedBorderWidth : themeLanes.borderWidth;
  const laneHeaderBorderColor = isSelected ? themeLanes.headerSelectedColor : themeLanes.borderColor;
  
  return (
    <g
      key={lane.id}
      onClick={(e) => {
        if ((e.target as Element).closest('button, input, select')) return;
        e.stopPropagation();
        onElementSelect?.('lane', lane.id);
      }}
      className="cursor-pointer transition-opacity hover:opacity-90"
    >
      {/* Lane container — sharp corners by default */}
      <rect
        x={padding + (lane.x ?? 0)}
        y={padding + (lane.y ?? 0)}
        width={lane.width}
        height={lane.height}
        fill={themeLanes.bodyFill}
        stroke={laneBorderColor}
        strokeWidth={laneBorderWidth}
        rx={cornerRadius}
      />
      {/* Lane header — subtle, minimal height */}
      <rect
        x={padding + (lane.x ?? 0)}
        y={padding + (lane.y ?? 0)}
        width={lane.width}
        height={laneHeaderHeight}
        fill={themeLanes.headerFill}
        stroke={laneHeaderBorderColor}
        strokeWidth={laneBorderWidth}
        rx={cornerRadius}
      />
      {lane.label && (
        <text
          x={padding + (lane.x ?? 0) + 10}
          y={padding + (lane.y ?? 0) + laneHeaderHeight / 2}
          fontSize={typography.laneHeader.fontSizePx}
          fontWeight={themeLanes.headerFontWeight ?? typography.laneHeader.weight}
          letterSpacing={toLetterSpacing(typography.laneHeader.tracking)}
          fill={themeLanes.labelColor}
          opacity={themeLanes.headerLabelOpacity ?? 0.8}
          dominantBaseline="middle"
        >
          {lane.label}
        </text>
      )}
    </g>
  );
}
// Alternate/exception flows get de-emphasised visual treatment
function alternateEdgeStyle(edge: LayoutEdge): { dash?: string; opacity: number; widthScale: number } {
  const layer: FlowLayer = edge.flowLayer ?? 'main';
  const role = edge.semanticRole;
  if (layer === 'main') return { opacity: 1, widthScale: 1 };
  if (role === 'exceptionFlow' || role === 'compensationFlow' || role === 'eventEscalation') {
    return { dash: '5 3', opacity: 0.7, widthScale: 0.85 };
  }
  if (layer === 'alternate') return { dash: '6 4', opacity: 0.75, widthScale: 0.9 };
  if (layer === 'message') return { dash: '3 3', opacity: 0.8, widthScale: 0.9 };
  return { opacity: 0.8, widthScale: 0.9 };
}
interface ProcessCanvasProps {
  layoutResult: LayoutResult;
  zoom: number;
  panX: number;
  panY: number;
  viewportWidth: number;
  viewportHeight: number;
  theme?: ProcessThemeSchema;
  interactionMode?: 'select' | 'pan';
  onZoomRequest?: (delta: number, anchor: { x: number; y: number }) => void;
  onPanRequest?: (dx: number, dy: number) => void;
  selectedElement?: { type: 'node' | 'edge' | 'lane'; id: string } | null;
  onElementSelect?: (type: 'node' | 'edge' | 'lane', id: string) => void;
  showLanes?: boolean;
  viewAsActor?: string | null;
  flowVisibility?: { main: boolean; alternate: boolean; exception: boolean; termination: boolean };
  curtainsOn?: boolean;
}

function isEdgeVisibleByFlowType(
  edge: LayoutEdge,
  flowVisibility: { main: boolean; alternate: boolean; exception: boolean; termination: boolean } | undefined
): boolean {
  if (!flowVisibility) return true;
  const layer: FlowLayer = edge.flowLayer ?? 'main';
  const role = edge.semanticRole;
  if (layer === 'hidden') return false;
  switch (layer) {
    case 'main': return flowVisibility.main;
    case 'alternate': return flowVisibility.alternate;
    case 'message': return flowVisibility.exception; // message flows use exception visibility
    case 'annotation': return true;
    default: return true;
  }
}

export default function ProcessCanvas({
  layoutResult,
  zoom,
  panX,
  panY,
  viewportWidth,
  viewportHeight,
  theme,
  interactionMode = 'select',
  onZoomRequest,
  onPanRequest,
  selectedElement,
  onElementSelect,
  showLanes = true,
  viewAsActor,
  flowVisibility,
  curtainsOn = true,
}: ProcessCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const lastPointerPositionRef = useRef<{ x: number; y: number } | null>(null);
  const didPanDuringPointerRef = useRef(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isPanGestureArmed, setIsPanGestureArmed] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const shouldStartPanGesture = useCallback((e: React.PointerEvent<SVGSVGElement>): boolean => {
    const isMiddleButton = e.button === 1;
    const isModifierDrag = e.button === 0 && (e.shiftKey || e.ctrlKey || e.metaKey);
    const isPanMode = interactionMode === 'pan' && e.button === 0;
    return isMiddleButton || isModifierDrag || isPanMode;
  }, [interactionMode]);
  const shouldIgnoreSelectionClick = useCallback((e: React.MouseEvent<SVGGElement>) => {
    if (!didPanDuringPointerRef.current) {
      return false;
    }
    didPanDuringPointerRef.current = false;
    e.stopPropagation();
    return true;
  }, []);
  const getLocalPoint = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);
  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      const localPoint = getLocalPoint(e.clientX, e.clientY);
      if (!localPoint) {
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        onZoomRequest?.(e.deltaY > 0 ? -0.1 : 0.1, localPoint);
        return;
      }
      if (onPanRequest) {
        e.preventDefault();
        onPanRequest(-e.deltaX, -e.deltaY);
      }
    },
    [getLocalPoint, onPanRequest, onZoomRequest]
  );
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svgEl = svgRef.current;
      if (!svgEl) {
        return;
      }
      if (!shouldStartPanGesture(e)) {
        return;
      }
      const localPoint = getLocalPoint(e.clientX, e.clientY);
      if (!localPoint) {
        return;
      }
      activePointerIdRef.current = e.pointerId;
      lastPointerPositionRef.current = localPoint;
      didPanDuringPointerRef.current = false;
      setIsPanning(true);
      svgEl.setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [getLocalPoint, shouldStartPanGesture]
  );
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (activePointerIdRef.current !== e.pointerId) {
        return;
      }
      const currentPoint = getLocalPoint(e.clientX, e.clientY);
      const lastPoint = lastPointerPositionRef.current;
      if (!currentPoint || !lastPoint) {
        return;
      }
      const dx = currentPoint.x - lastPoint.x;
      const dy = currentPoint.y - lastPoint.y;
      lastPointerPositionRef.current = currentPoint;
      if ((dx !== 0 || dy !== 0) && onPanRequest) {
        if (Math.abs(dx) + Math.abs(dy) > 1) {
          didPanDuringPointerRef.current = true;
        }
        onPanRequest(dx, dy);
      }
    },
    [getLocalPoint, onPanRequest]
  );
  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svgEl = svgRef.current;
      if (activePointerIdRef.current !== e.pointerId || !svgEl) {
        return;
      }
      activePointerIdRef.current = null;
      lastPointerPositionRef.current = null;
      setIsPanning(false);
      if (svgEl.hasPointerCapture(e.pointerId)) {
        svgEl.releasePointerCapture(e.pointerId);
      }
    },
    []
  );
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey || event.ctrlKey || event.metaKey) {
        setIsPanGestureArmed(true);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (!(event.shiftKey || event.ctrlKey || event.metaKey)) {
        setIsPanGestureArmed(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);
  const { bounds, nodes, edges, lanes, settings } = layoutResult;
  const effectiveShowLanes = showLanes ?? settings.layout.showLanes ?? true;
  const resolvedTheme = theme ?? resolveThemeFromLayoutSettings(settings);
  const canvasTokens = resolvedTheme.canvasTokens;
  const typography = resolvedTheme.typography;
  const themeEdges = resolvedTheme.edges;
  const themeLanes = resolvedTheme.lanes;
  const themeCurtains = resolvedTheme.curtains;
  const inboundEventNodes = nodes.filter(
    (node) => node.type === 'event' && node.metadata?.direction === 'inbound' && node.x !== undefined && node.y !== undefined
  );
  const outboundEventNodes = nodes.filter(
    (node) => node.type === 'event' && node.metadata?.direction === 'outbound' && node.x !== undefined && node.y !== undefined
  );
  const padding = settings.spacing.canvasPaddingX;
  const labelScene = React.useMemo(
    () => buildProcessLabelControllerResult(nodes, edges, resolvedTheme, padding),
    [nodes, edges, resolvedTheme, padding]
  );
  // Calculate the horizontal bounds of the lanes
  let minLaneX = padding + bounds.width;
  let maxLaneX = padding;
  if (lanes.length > 0) {
    minLaneX = padding + Math.min(...lanes.map((l) => l.x));
    maxLaneX = padding + Math.max(...lanes.map((l) => l.x + l.width));
  }
  const curtains = computeCurtainGeometry({
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
  const leftCurtainX      = curtains.left.x;
  const leftCurtainWidth  = curtains.left.width;
  const leftCurtainCenter = curtains.left.center;
  const rightCurtainX      = curtains.right.x;
  const rightCurtainWidth  = curtains.right.width;
  const rightCurtainCenter = curtains.right.center;
  // Dynamically calculate height based on lane bounds
  let minLaneY = 0;
  let maxLaneY = bounds.height;
  if (lanes.length > 0) {
    minLaneY = Math.min(...lanes.map((l) => l.y));
    maxLaneY = Math.max(...lanes.map((l) => l.y + l.height));
  }
  const contentHeight = maxLaneY - minLaneY;
  // Calculate actual visual boundaries for the grid and canvas
  const minVisualX = Math.min(padding, leftCurtainX - canvasTokens.visualBoundsPadding);
  const maxVisualX = Math.max(padding + bounds.width, rightCurtainX + rightCurtainWidth + canvasTokens.visualBoundsPadding);
  const minVisualY = Math.min(padding, padding + minLaneY - canvasTokens.visualBoundsPadding);
  const maxVisualY = Math.max(padding + bounds.height, padding + maxLaneY + canvasTokens.visualBoundsPadding);
  const visualWidth = maxVisualX - minVisualX;
  const visualHeight = maxVisualY - minVisualY;
  const width = Math.max(visualWidth + padding * 2, settings.canvas.width || 800);
  const height = Math.max(visualHeight + padding * 2, settings.canvas.height || 600);
  const laneHeaderHeight = canvasTokens.laneHeaderHeight;
  const nodeVisual = (node: LayoutNode) => {
    return getElementStyle(resolvedTheme, node.type).appearance;
  };
  const visibilityMode = settings.routing.visibilityMode ?? 'default';
  const revealGroups = settings.routing.revealGroups ?? [];
  const edgeStroke = (edge: LayoutEdge) => {
    const scenario = edge.routing?.scenario || '';
    const alt = alternateEdgeStyle(edge);
    let visual: { stroke: string; strokeWidth: number; strokeDasharray?: string };
    let dash: string | undefined;

    if (scenario.includes('loopback') || scenario.includes('backward')) {
      visual = themeEdges.loopback;
      dash = alt.dash ?? '7 4';
    } else if (scenario.includes('cross-lane')) {
      visual = themeEdges.crossLane;
      dash = alt.dash ?? themeEdges.crossLane.strokeDasharray;
    } else {
      visual = themeEdges.default;
      dash = alt.dash;
    }

    return {
      color: visual.stroke,
      width: visual.strokeWidth * alt.widthScale,
      dash,
      opacity: alt.opacity,
    };
  };
  return (
    <svg
      ref={svgRef}
      width={viewportWidth}
      height={viewportHeight}
      viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
      style={{
        display: 'block',
        background: '#F8F7F4',
        cursor: isPanning ? 'grabbing' : (interactionMode === 'pan' || isPanGestureArmed) ? 'grab' : 'default',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
        <defs>
          {/* Arrow marker — fill from theme */}
          <marker id="edgeArrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill={themeEdges.marker.fill} />
          </marker>
          {/* Node drop shadow */}
          <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#0f172a" floodOpacity="0.10" />
          </filter>
          {/* Dot-grid background */}
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="0.5" cy="0.5" r="1" fill="#CBD5E1" opacity="0.55" />
          </pattern>
        </defs>
        <g transform={`translate(${panX} ${panY}) scale(${zoom})`}>
          <rect x="0" y="0" width={width} height={height} fill="url(#grid)" />
          {/* External interface curtains */}
          {curtainsOn && (inboundEventNodes.length > 0 || outboundEventNodes.length > 0) && (
          <g>
            {inboundEventNodes.length > 0 && (
              <g>
                <rect
                  x={leftCurtainX}
                  y={padding + minLaneY}
                  width={leftCurtainWidth}
                  height={contentHeight}
                  fill={themeCurtains.inbound.fill}
                  fillOpacity={themeCurtains.inbound.fillOpacity}
                  stroke={themeCurtains.inbound.stroke}
                  strokeWidth={themeCurtains.inbound.strokeWidth}
                  rx={4}
                />
                <text
                  x={leftCurtainCenter}
                  y={padding + 20}
                  textAnchor="middle"
                  fontSize={typography.curtainLabel.fontSizePx}
                  fontWeight={typography.curtainLabel.weight}
                  fill={themeCurtains.inbound.labelColor}
                >
                  IN
                </text>
              </g>
            )}
{outboundEventNodes.length > 0 && (
               <g>
                 <rect
                   x={rightCurtainX}
                   y={padding + minLaneY}
                   width={rightCurtainWidth}
                   height={contentHeight}
                   fill={themeCurtains.outbound.fill}
                   fillOpacity={themeCurtains.outbound.fillOpacity}
                   stroke={themeCurtains.outbound.stroke}
                   strokeWidth={themeCurtains.outbound.strokeWidth}
                   rx={4}
                 />
                 <text
                   x={rightCurtainCenter}
                   y={padding + 20}
                   textAnchor="middle"
                   fontSize={typography.curtainLabel.fontSizePx}
                   fontWeight={typography.curtainLabel.weight}
                   fill={themeCurtains.outbound.labelColor}
                 >
                   OUT
                 </text>
               </g>
             )}
           </g>
           )}
           {/* Lanes */}
           {!viewAsActor && effectiveShowLanes && lanes.map((lane) => 
             renderLane(lane, padding, laneHeaderHeight, themeLanes, typography, selectedElement?.id, onElementSelect)
           )}
           {/* Edges — filtered by visibility mode, styled by flow layer, and actor spotlight */}
           {edges.map((edge) => {
           if (!edge.routing?.waypoints || edge.routing.waypoints.length < 2) {
             return null;
           }
           if (!isEdgeVisible(edge, visibilityMode, revealGroups, selectedElement?.id)) {
             return null;
           }
           if (!isEdgeVisibleByFlowType(edge, flowVisibility)) {
             return null;
           }
          const points = edge.routing.waypoints
            .map((p) => `${padding + p.x},${padding + p.y}`)
            .join(' ');
          const stroke = edgeStroke(edge);
          const isSelected = selectedElement?.type === 'edge' && selectedElement.id === edge.id;
          const edgeStrokeColor = isSelected ? themeEdges.selected.stroke : stroke.color;
          const edgeStrokeWidth = isSelected ? themeEdges.selected.strokeWidth : stroke.width;
          const haloColor = isSelected ? themeEdges.halo.selected.color : themeEdges.halo.default.color;
          const haloWidth = isSelected ? themeEdges.halo.selected.width : themeEdges.halo.default.width;
          return (
            <g
              key={edge.id}
              onClick={(e) => {
                if (shouldIgnoreSelectionClick(e)) {
                  return;
                }
                e.stopPropagation();
                onElementSelect?.('edge', edge.id);
              }}
              className="cursor-pointer"
            >
              {/* Edge halo */}
              <polyline
                points={points}
                fill="none"
                stroke={haloColor}
                strokeWidth={edgeStrokeWidth + haloWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
              {/* Edge path */}
              <polyline
                points={points}
                fill="none"
                stroke={edgeStrokeColor}
                strokeWidth={edgeStrokeWidth}
                strokeDasharray={stroke.dash}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={stroke.opacity}
              />
              <polyline points={points} fill="none" stroke="none" markerEnd="url(#edgeArrow)" />
              {/* Edge label */}
              {labelScene.edgeLabels.has(edge.id) && (() => {
                const edgeLabel = labelScene.edgeLabels.get(edge.id)!;
                return (
                  <text
                    x={edgeLabel.x}
                    y={edgeLabel.y + edgeLabel.height / 2 - edgeLabel.fontSize / 3}
                    fontSize={edgeLabel.fontSize}
                    fontWeight={edgeLabel.fontWeight}
                    fill={edgeLabel.fill}
                    stroke={edgeLabel.haloFill}
                    strokeWidth={edgeLabel.haloWidth}
                    paintOrder="stroke"
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                  >
                    {edgeLabel.text}
                  </text>
                );
              })()}
            </g>
          );
          })}
          {/* Nodes */}
          {(() => {
          // Only show connection points on source/target of a selected edge
          const portVisibleNodeIds = new Set<string>();
          if (selectedElement?.type === 'edge') {
            const sel = edges.find((e) => e.id === selectedElement.id);
            if (sel) { portVisibleNodeIds.add(sel.source); portVisibleNodeIds.add(sel.target); }
          }

          return nodes.map((node) => {
            if (node.x === undefined || node.y === undefined) {
              return null;
            }
            // Actor spotlight: when viewAsActor is set, non-matching nodes get 20% opacity
            const nodeOpacity = viewAsActor
              ? (node.actor === viewAsActor ? 1 : 0.2)
              : 1;
          const nodeX = padding + node.x - node.width / 2;
          const nodeY = padding + node.y - node.height / 2;
          const nodeStyle = getElementStyle(resolvedTheme, node.type);
          const visual = nodeVisual(node);
          const nodeShape = nodeStyle.shape;
          const active = labelScene.activeAnchorsByNode.get(node.id) || new Set();
          const showPorts = portVisibleNodeIds.has(node.id);
          const nodeLabel = labelScene.nodeLabels.get(node.id);
          const secondaryLabel = labelScene.secondaryLabels.get(node.id);
          const isSelected = selectedElement?.type === 'node' && selectedElement.id === node.id;
          const isTentative = Boolean(node.metadata?.tentative);
          const baseStrokeWidth = visual.strokeWidth ?? 1;
          const strokeColor = isSelected
            ? (nodeStyle.interaction?.selectedStroke ?? visual.stroke)
            : isTentative ? '#94A3B8' : visual.stroke;
          const strokeWidthStr = isSelected
            ? String(nodeStyle.interaction?.selectedStrokeWidth ?? baseStrokeWidth + 1.5)
            : String(baseStrokeWidth);
          const tentativeDash = isTentative ? '5 3' : undefined;
          const isHovered = hoveredNodeId === node.id && !isSelected;
          
          // Skip rendering nodes that would be completely hidden (for spotlight mode, still show structure)
          const shouldRender = nodeOpacity > 0;
          if (!shouldRender) return null;
          
          return (
            <g
              key={node.id}
              className="select-none cursor-pointer"
              style={{ opacity: nodeOpacity }}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              onClick={(e) => {
                if (shouldIgnoreSelectionClick(e)) {
                  return;
                }
                e.stopPropagation();
                onElementSelect?.('node', node.id);
              }}
            >
              {/* Hover ring — rendered behind shape */}
              {isHovered && (nodeShape === 'circle' ? (
                <circle
                  cx={nodeX + node.width / 2}
                  cy={nodeY + node.height / 2}
                  r={Math.min(node.width, node.height) / 2 + 3}
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="1.5"
                  opacity="0.35"
                />
              ) : nodeShape === 'diamond' ? (
                <polygon
                  points={`${nodeX + node.width / 2},${nodeY - 4} ${nodeX + node.width + 4},${nodeY + node.height / 2} ${nodeX + node.width / 2},${nodeY + node.height + 4} ${nodeX - 4},${nodeY + node.height / 2}`}
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="1.5"
                  opacity="0.35"
                />
              ) : (
                <rect
                  x={nodeX - 3}
                  y={nodeY - 3}
                  width={node.width + 6}
                  height={node.height + 6}
                  rx={(visual.cornerRadiusPx ?? 6) + 2}
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="1.5"
                  opacity="0.35"
                />
              ))}
              {/* Node shape — driven by theme.shape, not node.type */}
              {nodeShape === 'circle' ? (
                <circle
                  cx={nodeX + node.width / 2}
                  cy={nodeY + node.height / 2}
                  r={Math.min(node.width, node.height) / 2}
                  fill={isTentative ? 'white' : visual.fill}
                  stroke={strokeColor}
                  strokeWidth={strokeWidthStr}
                  strokeDasharray={tentativeDash}
                  filter="url(#nodeShadow)"
                />
              ) : nodeShape === 'diamond' ? (
                <polygon
                  points={`${nodeX + node.width / 2},${nodeY} ${nodeX + node.width},${
                    nodeY + node.height / 2
                  } ${nodeX + node.width / 2},${nodeY + node.height} ${nodeX},${
                    nodeY + node.height / 2
                  }`}
                  fill={isTentative ? 'white' : visual.fill}
                  stroke={strokeColor}
                  strokeWidth={strokeWidthStr}
                  strokeDasharray={tentativeDash}
                  filter="url(#nodeShadow)"
                />
              ) : (
                <rect
                  x={nodeX}
                  y={nodeY}
                  width={node.width}
                  height={node.height}
                  rx={visual.cornerRadiusPx ?? 6}
                  fill={isTentative ? 'white' : visual.fill}
                  stroke={strokeColor}
                  strokeWidth={strokeWidthStr}
                  strokeDasharray={tentativeDash ?? visual.strokeDasharray}
                  filter="url(#nodeShadow)"
                />
              )}
              {/* Connection point indicators — only when this node's edge is selected */}
              {showPorts && (
                <g opacity="0.9">
                  {active.has('top') && (
                    <circle cx={nodeX + node.width / 2} cy={nodeY} r={3.5} fill="#6366F1" stroke="#fff" strokeWidth={1.5} />
                  )}
                  {active.has('right') && (
                    <circle cx={nodeX + node.width} cy={nodeY + node.height / 2} r={3.5} fill="#6366F1" stroke="#fff" strokeWidth={1.5} />
                  )}
                  {active.has('bottom') && (
                    <circle cx={nodeX + node.width / 2} cy={nodeY + node.height} r={3.5} fill="#6366F1" stroke="#fff" strokeWidth={1.5} />
                  )}
                  {active.has('left') && (
                    <circle cx={nodeX} cy={nodeY + node.height / 2} r={3.5} fill="#6366F1" stroke="#fff" strokeWidth={1.5} />
                  )}
                  {active.has('center-bottom') && (
                    <circle cx={nodeX + node.width / 2} cy={nodeY + node.height} r={3.5} fill="#6366F1" stroke="#fff" strokeWidth={1.5} />
                  )}
                </g>
              )}
              {/* Resolved Labels */}
              {nodeLabel && (
                <g className="pointer-events-none">
                  <text
                    x={nodeLabel.x}
                    y={nodeLabel.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={nodeLabel.fontSize}
                    fontWeight={nodeLabel.fontWeight}
                    fill={nodeLabel.fill}
                    style={{ paintOrder: 'stroke', stroke: themeLanes.bodyFill, strokeWidth: 2 }}
                  >
                    {nodeLabel.lines.map((line, index) => (
                      <tspan
                        key={`${node.id}-line-${index}`}
                        x={nodeLabel.x}
                        dy={index === 0 ? 0 : nodeLabel.lineSpacing}
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              )}
              {secondaryLabel && (
                <text
                  x={secondaryLabel.x}
                  y={secondaryLabel.y}
                  textAnchor="middle"
                  fontSize={secondaryLabel.fontSize}
                  fontWeight={secondaryLabel.fontWeight}
                  fill={secondaryLabel.fill}
                  opacity={secondaryLabel.opacity}
                  style={{
                    letterSpacing: secondaryLabel.letterSpacing,
                    paintOrder: 'stroke',
                    stroke: themeLanes.bodyFill,
                    strokeWidth: 2,
                  }}
                  className="pointer-events-none"
                >
                  {secondaryLabel.text}
                </text>
              )}
            </g>
          );
          })})()}
          {/* Dynamic visual boundary indicator */}
          <rect
            x={minVisualX}
            y={minVisualY}
            width={visualWidth}
            height={visualHeight}
            fill="none"
            stroke={themeLanes.borderColor}
            strokeWidth="1"
            strokeDasharray="5,5"
            opacity="0.4"
            rx="8"
          />
        </g>
    </svg>
  );
}
