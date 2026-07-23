/**
 * buildNodeRenderModels — pure function that transforms LayoutResult + theme
 * into a SceneRenderModel that ProcessCanvas consumes exclusively.
 *
 * Policy: All rendering decisions (colours, visibility, icon layout) are made
 * in this builder. ProcessCanvas is a pure renderer — no decision logic.
 *
 * Policy: Interaction state (hover, selection) is NOT included in the output.
 * It is applied as CSS classes on the <g> element at render time. The model
 * is stable until the layout or theme changes.
 */
import { getElementStyle } from '../styling/styleSchema';
// ============================================================================
// Constants
// ============================================================================
const ICON_PATHS = {
    risk: {
        paths: [
            'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
            'M12 8v4',
            'M12 16h.01',
        ],
        color: '#A32D2D',
        bg: '#FCEBEB',
    },
    sla: {
        paths: [
            'M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10Z',
            'M12 6v6l4 2',
        ],
        color: '#854F0B',
        bg: '#FAEEDA',
    },
    rule: {
        paths: [
            'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z',
            'M14 2v6h6',
            'M10 13l-2 2 2 2',
            'M14 17h4',
        ],
        color: '#185FA5',
        bg: '#E6F1FB',
    },
    kpi: {
        paths: [
            'M3 3v18h18',
            'M7 16l4-8 4 4 4-6',
        ],
        color: '#3B6D11',
        bg: '#EAF3DE',
    },
    owner: {
        paths: [
            'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
            'M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
            'M22 21v-2a4 4 0 0 0-3-3.87',
            'M16 3.13a4 4 0 0 1 0 7.75',
        ],
        color: '#5F5E5A',
        bg: '#F1EFE8',
    },
    app: {
        paths: [
            'M2 4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z',
            'M8 21h8',
            'M12 17v4',
        ],
        color: '#5F5E5A',
        bg: '#F1EFE8',
    },
};
const TASK_TYPE_EMOJI = {
    user: '👤',
    service: '⚙️',
    manual: '✋',
};
// ============================================================================
// Public API
// ============================================================================
export function buildNodeRenderModels(layoutResult, labelScene, theme, options, 
// Edge visibility inputs (computed independently)
visibilityMode, revealGroups, selectedElementId, flowVisibility, 
// Curtain geometry (pre-computed)
curtainGeometry, inboundNodes, outboundNodes, connectorStyle = 'flowTypes') {
    const { bounds, nodes, edges, lanes, settings } = layoutResult;
    const padding = options.padding;
    const canvasTokens = theme.canvasTokens;
    const typography = theme.typography;
    const themeEdges = theme.edges;
    const themeLanes = theme.lanes;
    // ── Lanes ──────────────────────────────────────────
    const laneModels = buildLaneModels(lanes, padding, options, theme);
    // ── Edges ──────────────────────────────────────────
    const edgeModels = buildEdgeModels(edges, padding, theme, visibilityMode, revealGroups, selectedElementId, flowVisibility, labelScene, connectorStyle);
    // ── Curtains ───────────────────────────────────────
    const curtainModels = buildCurtainModels(curtainGeometry, inboundNodes ?? [], outboundNodes ?? [], lanes, padding, bounds.height, options, theme);
    // ── Nodes ──────────────────────────────────────────
    const nodeModels = buildNodeRenderModelList(nodes, padding, options, theme, labelScene, selectedElementId);
    return {
        nodes: nodeModels,
        edges: edgeModels,
        lanes: laneModels,
        curtains: curtainModels,
        visualBounds: {
            x: options.padding,
            y: options.padding,
            width: bounds.width,
            height: bounds.height,
        },
        contentWidth: bounds.width + padding * 2,
        contentHeight: bounds.height + padding * 2,
    };
}
// ============================================================================
// Node model builder
// ============================================================================
function buildNodeRenderModelList(nodes, padding, options, theme, labelScene, selectedElementId) {
    const result = [];
    for (const node of nodes) {
        if (node.x === undefined || node.y === undefined)
            continue;
        const model = buildSingleNodeRenderModel(node, padding, options, theme, labelScene, selectedElementId);
        if (model)
            result.push(model);
    }
    return result;
}
function buildSingleNodeRenderModel(node, padding, options, theme, labelScene, selectedElementId) {
    if (node.x === undefined || node.y === undefined)
        return null;
    const nodeX = padding + node.x - node.width / 2;
    const nodeY = padding + node.y - node.height / 2;
    const cx = padding + node.x;
    const cy = padding + node.y;
    const nodeStyle = getElementStyle(theme, node.type);
    const visual = nodeStyle.appearance;
    const isSelected = selectedElementId === node.id;
    const isTentative = Boolean(node.metadata?.queried);
    // Actor spotlight + general node-set spotlight (highlightNodeIds) —
    // composable: a node must pass every active filter to render at full
    // opacity. highlightNodeIds generalizes viewAsActor's dim-the-rest effect
    // from "one actor's lane" to an arbitrary evidence set (e.g. an AI
    // finding's affected nodes/edges — docs/FINAL/13_Phase_E_Findings_Drive_Canvas_Plan.md E.1).
    const passesActorFilter = !options.viewAsActor || node.actor === options.viewAsActor;
    const passesHighlightFilter = !options.highlightNodeIds || options.highlightNodeIds.includes(node.id);
    const nodeOpacity = (passesActorFilter && passesHighlightFilter) ? 1 : 0.2;
    // Shape
    const shapeKind = (nodeStyle.shape === 'circle' || nodeStyle.shape === 'diamond')
        ? nodeStyle.shape
        : 'rounded-rect';
    const shape = {
        kind: shapeKind,
        fill: isTentative ? 'white' : visual.fill,
        stroke: isSelected
            ? (nodeStyle.interaction?.selectedStroke ?? visual.stroke)
            : isTentative ? '#94A3B8' : visual.stroke,
        strokeWidth: isSelected
            ? (nodeStyle.interaction?.selectedStrokeWidth ?? visual.strokeWidth ?? 1) + 1.5
            : (visual.strokeWidth ?? 1),
        strokeDasharray: isTentative ? '5 3' : visual.strokeDasharray,
        cornerRadius: visual.cornerRadiusPx ?? 6,
    };
    // Labels from label controller
    const nodeLabel = labelScene?.nodeLabels.get(node.id) ?? null;
    const secLabel = labelScene?.secondaryLabels.get(node.id) ?? null;
    let primaryLabel;
    if (nodeLabel) {
        primaryLabel = {
            lines: nodeLabel.lines.map((line, i) => ({
                text: line,
                x: nodeLabel.x,
                dy: i === 0 ? 0 : nodeLabel.lineSpacing,
            })),
            x: nodeLabel.x,
            y: nodeLabel.y,
            fontSize: nodeLabel.fontSize,
            fontWeight: nodeLabel.fontWeight,
            fill: nodeLabel.fill,
            textAnchor: 'middle',
            dominantBaseline: 'middle',
        };
    }
    let secondaryLabel;
    if (secLabel) {
        secondaryLabel = {
            text: secLabel.text,
            x: secLabel.x,
            y: secLabel.y,
            fontSize: secLabel.fontSize,
            fontWeight: secLabel.fontWeight,
            fill: secLabel.fill,
            opacity: secLabel.opacity,
            letterSpacing: secLabel.letterSpacing,
        };
    }
    // Metadata icons
    const metaIcons = buildMetaIcons(node, nodeX, nodeY, options);
    // Status dot
    const statusIndicator = buildStatusIndicator(node, nodeX, nodeY, node.width);
    // Task-type marker
    const taskTypeMarker = buildTaskTypeMarker(node, nodeX, nodeY);
    const gatewayMarker = buildGatewayKindMarker(node, cx, cy, theme);
    // Ports
    const ports = buildPorts(node, nodeX, nodeY, node.width, node.height, labelScene, node.id);
    // Actor pill
    const actorPill = buildActorPill(node, nodeX, nodeY, node.width, node.height, options.effectiveShowLanes);
    return {
        id: node.id,
        type: node.type,
        x: nodeX,
        y: nodeY,
        width: node.width,
        height: node.height,
        cx,
        cy,
        shape,
        opacity: nodeOpacity,
        primaryLabel,
        secondaryLabel,
        metaIcons,
        statusIndicator,
        taskTypeMarker,
        gatewayMarker,
        ports,
        actorPill,
        overlays: [],
    };
}
// ============================================================================
// Metadata icons
// ============================================================================
function buildMetaIcons(node, nodeX, nodeY, options) {
    if (!options.showMetaIcons)
        return [];
    const m = node.metadata || {};
    const icons = [];
    const iconSize = options.metaIconSize;
    const iconGap = options.metaIconGap;
    if (Array.isArray(m.risks) && m.risks.length > 0) {
        icons.push(buildIcon('risk', m.risks.length === 1 ? '1 risk' : `${m.risks.length} risks`));
    }
    if (m.sla) {
        icons.push(buildIcon('sla', `SLA: ${m.sla}`));
    }
    if (m.rule) {
        icons.push(buildIcon('rule', `Rule: ${m.rule}`));
    }
    if (m.kpi) {
        icons.push(buildIcon('kpi', `KPI: ${m.kpi}`));
    }
    if (m.owner) {
        icons.push(buildIcon('owner', `Owner: ${m.owner}`));
    }
    if (Array.isArray(m.app) && m.app.length > 0) {
        icons.push(buildIcon('app', m.app.length === 1 ? '1 app' : `${m.app.length} apps`));
    }
    if (icons.length === 0)
        return [];
    // Position icons — left-aligned inside the shape, just above bottom edge
    const paddingLeft = 6;
    const paddingBottom = 3;
    const topY = nodeY + (node.height || 42) - paddingBottom - iconSize;
    return icons.map((icon, idx) => {
        const ix = nodeX + paddingLeft + idx * (iconSize + iconGap);
        return {
            ...icon,
            bounds: { x: ix, y: topY, width: iconSize, height: iconSize },
        };
    });
    function buildIcon(key, title) {
        const def = ICON_PATHS[key];
        return {
            key,
            title,
            paths: def.paths,
            color: def.color,
            bg: def.bg,
            bounds: { x: 0, y: 0, width: 0, height: 0 },
        };
    }
}
// ============================================================================
// Gateway kind marker (rendered inside the diamond)
// ============================================================================
const GATEWAY_KIND_MARKER = {
    exclusive: '\u2716', // ✖
    inclusive: '\u25CB', // ○
    parallel: '\u271A', // ✚
};
function buildGatewayKindMarker(node, cx, cy, theme) {
    if (node.type !== 'decision')
        return undefined;
    const kind = node.metadata?.gatewayKind || 'exclusive';
    const marker = GATEWAY_KIND_MARKER[kind];
    if (!marker)
        return undefined;
    const nodeStyle = getElementStyle(theme, node.type);
    return {
        text: marker,
        x: cx,
        y: cy,
        fontSize: 16,
        fill: nodeStyle.appearance.stroke,
    };
}
// ============================================================================
// Status indicator
// ============================================================================
function buildStatusIndicator(node, nodeX, nodeY, nodeWidth) {
    const status = node.metadata?.status;
    if (!status)
        return undefined;
    const fillMap = {
        approved: '#10B981',
        pending: '#F59E0B',
        rejected: '#EF4444',
    };
    const fill = fillMap[status] ?? '#94A3B8';
    return {
        cx: nodeX + nodeWidth - 4,
        cy: nodeY + 4,
        r: 3,
        fill,
        title: `Status: ${status}`,
    };
}
// ============================================================================
// Task type marker
// ============================================================================
function buildTaskTypeMarker(node, nodeX, nodeY) {
    if (node.type !== 'task' || !node.metadata?.taskType)
        return undefined;
    const taskType = node.metadata.taskType;
    return {
        text: TASK_TYPE_EMOJI[taskType] ?? '•',
        x: nodeX + 4,
        y: nodeY + 10,
        fontSize: 8,
        fill: '#6B7280',
    };
}
// ============================================================================
// Connection ports
// ============================================================================
function buildPorts(node, nodeX, nodeY, nodeWidth, nodeHeight, labelScene, nodeId) {
    const active = labelScene?.activeAnchorsByNode.get(nodeId) ?? new Set();
    if (active.size === 0)
        return [];
    const portDefs = [];
    const add = (anchor, cx, cy) => {
        if (active.has(anchor))
            portDefs.push({ anchor, cx, cy });
    };
    add('top', nodeX + nodeWidth / 2, nodeY);
    add('right', nodeX + nodeWidth, nodeY + nodeHeight / 2);
    add('bottom', nodeX + nodeWidth / 2, nodeY + nodeHeight);
    add('left', nodeX, nodeY + nodeHeight / 2);
    add('center-bottom', nodeX + nodeWidth / 2, nodeY + nodeHeight);
    return portDefs.map((p) => ({
        anchor: p.anchor,
        cx: p.cx,
        cy: p.cy,
        r: 3.5,
        fill: '#6366F1',
        stroke: '#fff',
        strokeWidth: 1.5,
    }));
}
// ============================================================================
// Actor pill
// ============================================================================
function buildActorPill(node, nodeX, nodeY, nodeWidth, nodeHeight, effectiveShowLanes) {
    if (!node.actor || effectiveShowLanes)
        return null;
    return {
        label: node.actor,
        x: nodeX + nodeWidth / 2 - 26,
        y: nodeY + nodeHeight / 2 + 10,
        width: 52,
        height: 14,
        rx: 7,
        bg: '#F1F5F9',
        stroke: '#CBD5E1',
        textX: nodeX + nodeWidth / 2,
        textY: nodeY + nodeHeight / 2 + 17,
        fontSize: 9,
        fontWeight: 500,
        fill: '#475569',
    };
}
// ============================================================================
// Edge model builder
// ============================================================================
// Exported for direct unit testing of the visual/arrow-style selection
// logic (semanticRole vs. geometry-driven loopback/cross-lane) without
// needing to exercise the full LayoutEngine — everywhere else, this is
// still only called internally as part of buildNodeRenderModels().
export function buildEdgeModels(edges, padding, theme, visibilityMode, revealGroups, selectedElementId, flowVisibility, labelScene, connectorStyle = 'flowTypes') {
    const themeEdges = theme.edges;
    const result = [];
    for (const edge of edges) {
        if (!edge.routing?.waypoints || edge.routing.waypoints.length < 2)
            continue;
        if (!isEdgeVisible(edge, visibilityMode, revealGroups, selectedElementId))
            continue;
        if (!isEdgeVisibleByFlowType(edge, flowVisibility))
            continue;
        const waypoints = edge.routing.waypoints.map((p) => ({
            x: padding + p.x,
            y: padding + p.y,
        }));
        const alt = alternateEdgeStyle(edge, connectorStyle);
        // Colored mode is solid-only by design (color alone carries meaning) — like uniform,
        // it must not pick up a routing-geometry dash (loopback/cross-lane) as a fallback.
        const scenario = (connectorStyle === 'uniform' || connectorStyle === 'flowTypes')
            ? ''
            : (edge.routing?.scenario || '');
        let visual;
        let dash;
        // semanticRole is genuine modelling intent (the author/AI tagged this
        // edge as cross-actor communication), unlike loopback/cross-lane below
        // which are inferred purely from routing geometry — intent wins over
        // geometry, so a message flow that happens to also cross a lane or
        // loop back still renders as a message flow, not a loopback/cross-lane.
        const isMessageFlow = edge.semanticRole === 'messageFlow';
        if (isMessageFlow) {
            visual = themeEdges.message;
            dash = alt.dash ?? themeEdges.message.strokeDasharray;
        }
        else if (scenario.includes('loopback') || scenario.includes('backward')) {
            visual = themeEdges.loopback;
            dash = alt.dash ?? '7 4';
        }
        else if (scenario.includes('cross-lane')) {
            visual = themeEdges.crossLane;
            dash = alt.dash ?? themeEdges.crossLane.strokeDasharray;
        }
        else {
            visual = themeEdges.default;
            dash = alt.dash;
        }
        const isSelected = selectedElementId === edge.id;
        const strokeColor = isSelected ? themeEdges.selected.stroke : (alt.stroke ?? visual.stroke);
        const strokeWidth = isSelected ? themeEdges.selected.strokeWidth : visual.strokeWidth * alt.widthScale;
        const haloColor = isSelected ? themeEdges.halo.selected.color : themeEdges.halo.default.color;
        const haloWidth = isSelected ? themeEdges.halo.selected.width : themeEdges.halo.default.width;
        // Edge label
        const edgeLabelEntry = labelScene?.edgeLabels.get(edge.id);
        const label = edgeLabelEntry
            ? {
                text: edgeLabelEntry.text,
                x: edgeLabelEntry.x,
                y: edgeLabelEntry.y,
                width: edgeLabelEntry.width,
                height: edgeLabelEntry.height,
                fontSize: edgeLabelEntry.fontSize,
                fontWeight: edgeLabelEntry.fontWeight,
                fill: edgeLabelEntry.fill,
                haloFill: edgeLabelEntry.haloFill,
                haloWidth: edgeLabelEntry.haloWidth,
            }
            : undefined;
        result.push({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            waypoints,
            stroke: strokeColor,
            strokeWidth,
            strokeDasharray: dash,
            opacity: alt.opacity,
            haloColor,
            haloWidth,
            showArrow: true,
            arrowStyle: isMessageFlow ? 'open' : 'solid',
            label,
        });
    }
    return result;
}
// ============================================================================
// Edge visibility helpers
// ============================================================================
function isEdgeVisible(edge, visibilityMode, revealGroups, selectedElementId) {
    const layer = edge.flowLayer ?? 'main';
    if (layer === 'hidden')
        return false;
    if (layer === 'annotation')
        return visibilityMode !== 'default';
    switch (visibilityMode) {
        case 'default':
            // Defer non-main layers to the flowVisibility (Flow Types) toggle, applied right
            // after this by the caller — this used to hard-reject them here, which made the
            // Flow Types button inert in the app's default visibility mode.
            return true;
        case 'guided':
            if (layer === 'main')
                return true;
            if (edge.revealGroup && revealGroups.includes(edge.revealGroup))
                return true;
            return false;
        case 'focus':
            if (layer === 'main')
                return true;
            if (selectedElementId && (edge.source === selectedElementId || edge.target === selectedElementId))
                return true;
            return false;
        case 'full':
            return true;
        default:
            return true;
    }
}
function isEdgeVisibleByFlowType(edge, flowVisibility) {
    if (!flowVisibility)
        return true;
    const layer = edge.flowLayer ?? 'main';
    switch (layer) {
        case 'main': return flowVisibility.main;
        case 'alternate': return flowVisibility.alternate;
        case 'message': return flowVisibility.exception;
        case 'annotation': return true;
        default: return true;
    }
}
// Colored-mode palette: main/primary green, exception-family orange, back-edges purple,
// message-flow accent, plain alternate gray. Keyed off flow classification, not routing
// geometry — distinct from theme.edges.loopback/crossLane, which are chosen by edge
// geometry instead.
const FLOW_TYPE_COLORS = {
    main: '#16A34A',
    exception: '#EA580C',
    loop: '#7C3AED',
    message: '#6B4FBB',
    alternate: '#6B7280',
};
function alternateEdgeStyle(edge, connectorStyle = 'flowTypes') {
    if (connectorStyle === 'uniform') {
        return { opacity: 1, widthScale: 1 };
    }
    if (connectorStyle === 'keyFlow') {
        return edge.keyFlow
            ? { opacity: 1, widthScale: 1.3 }
            : { dash: '4 3', opacity: 0.35, widthScale: 0.75 };
    }
    // Colored mode: color alone carries the category — deliberately no dash pattern here.
    // (An earlier version dashed by category on top of color, which just added an unexplained
    // second signal with no legend; solid everywhere, color-only, is what's actually legible.)
    const layer = edge.flowLayer ?? 'main';
    const role = edge.semanticRole;
    const isExceptionFamily = role === 'exceptionFlow' || role === 'compensationFlow' || role === 'eventEscalation';
    // Semantic intent (messageFlow) wins over both geometry (loop) and layer —
    // mirrors the same priority order used for visual/dash selection above in
    // buildEdgeModels(), so "colored" connector-style mode doesn't silently
    // repaint a message-flow edge back to green/purple/gray.
    if (role === 'messageFlow') {
        return { opacity: 1, widthScale: 1, stroke: FLOW_TYPE_COLORS.message };
    }
    // Back-edges get their own color regardless of layer — a loopback is visually distinct
    // from "just an alternate path" even when it's also the exception branch of a decision.
    if (edge.loop) {
        return { opacity: 1, widthScale: 1, stroke: FLOW_TYPE_COLORS.loop };
    }
    if (layer === 'main') {
        return { opacity: 1, widthScale: 1, stroke: FLOW_TYPE_COLORS.main };
    }
    if (isExceptionFamily) {
        return { opacity: 1, widthScale: 0.9, stroke: FLOW_TYPE_COLORS.exception };
    }
    return { opacity: 1, widthScale: 0.9, stroke: FLOW_TYPE_COLORS.alternate };
}
// ============================================================================
// Lane model builder
// ============================================================================
function buildLaneModels(lanes, padding, options, theme) {
    if (options.viewAsActor || !options.showLanes)
        return [];
    const themeLanes = theme.lanes;
    const typography = theme.typography;
    return lanes.map((lane) => ({
        id: lane.id,
        label: lane.label,
        x: padding + (lane.x ?? 0),
        y: padding + (lane.y ?? 0),
        width: lane.width,
        height: lane.height,
        headerHeight: options.laneHeaderHeight,
        headerFill: themeLanes.headerFill,
        bodyFill: themeLanes.bodyFill,
        borderColor: themeLanes.borderColor,
        borderWidth: themeLanes.borderWidth,
        headerBorderColor: themeLanes.borderColor,
        labelColor: themeLanes.labelColor,
        cornerRadius: themeLanes.cornerRadiusPx ?? 4,
        headerFontWeight: themeLanes.headerFontWeight ?? typography.laneHeader.weight,
        headerLabelOpacity: themeLanes.headerLabelOpacity ?? 0.8,
    }));
}
// ============================================================================
// Curtain model builder
// ============================================================================
function buildCurtainModels(curtainGeometry, inboundEventNodes, outboundEventNodes, lanes, padding, boundsHeight, options, theme) {
    if (!curtainGeometry)
        return [];
    if (inboundEventNodes.length === 0 && outboundEventNodes.length === 0)
        return [];
    const themeCurtains = theme.curtains;
    const typography = theme.typography;
    // Compute lane Y bounds
    let minLaneY = 0;
    let maxLaneY = boundsHeight;
    if (lanes.length > 0) {
        minLaneY = Math.min(...lanes.map((l) => l.y));
        maxLaneY = Math.max(...lanes.map((l) => l.y + l.height));
    }
    const contentHeight = maxLaneY - minLaneY;
    const models = [];
    if (inboundEventNodes.length > 0) {
        models.push({
            side: 'inbound',
            x: curtainGeometry.left.x,
            y: padding + minLaneY,
            width: curtainGeometry.left.width,
            height: contentHeight,
            fill: themeCurtains.inbound.fill,
            fillOpacity: themeCurtains.inbound.fillOpacity,
            stroke: themeCurtains.inbound.stroke,
            strokeWidth: themeCurtains.inbound.strokeWidth,
            labelColor: themeCurtains.inbound.labelColor,
            label: 'IN',
            labelX: curtainGeometry.left.center,
            labelY: padding + 20,
        });
    }
    if (outboundEventNodes.length > 0) {
        models.push({
            side: 'outbound',
            x: curtainGeometry.right.x,
            y: padding + minLaneY,
            width: curtainGeometry.right.width,
            height: contentHeight,
            fill: themeCurtains.outbound.fill,
            fillOpacity: themeCurtains.outbound.fillOpacity,
            stroke: themeCurtains.outbound.stroke,
            strokeWidth: themeCurtains.outbound.strokeWidth,
            labelColor: themeCurtains.outbound.labelColor,
            label: 'OUT',
            labelX: curtainGeometry.right.center,
            labelY: padding + 20,
        });
    }
    return models;
}
