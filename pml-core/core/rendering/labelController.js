import { getElementStyle } from '../styling/styleSchema';
import { formatLabel, toLetterSpacing } from './labelFormatter';
import { resolveEdgeLabelPosition } from './edgeLabelPositioning';
import { isEventNodeKind, isGatewayNodeKind } from '../nodeKinds';
const NODE_CLEARANCE = 6;
const EDGE_CLEARANCE = 10;
export function buildProcessLabelControllerResult(nodes, edges, theme, padding) {
    const activeAnchorsByNode = buildActiveAnchorsByNode(edges);
    const nodeLabels = new Map();
    const secondaryLabels = new Map();
    const edgeLabels = new Map();
    const occupiedBoxes = [];
    for (const node of nodes) {
        if (node.x === undefined || node.y === undefined)
            continue;
        const label = resolveNodeLabel(node, activeAnchorsByNode.get(node.id) ?? new Set(), theme, padding);
        if (!label)
            continue;
        const nudged = nudgeNodeLabel(label, occupiedBoxes);
        nodeLabels.set(node.id, nudged);
        occupiedBoxes.push(toNodeBox(nudged));
        const secondaryLabel = resolveSecondaryLabel(node, theme, padding);
        if (!secondaryLabel)
            continue;
        secondaryLabels.set(node.id, secondaryLabel);
    }
    for (const edge of edges) {
        if (!edge.condition || !edge.routing?.waypoints || edge.routing.waypoints.length < 2)
            continue;
        const label = resolveEdgeLabel(edge, theme, padding);
        if (!label)
            continue;
        const nudged = nudgeEdgeLabel(label, occupiedBoxes);
        edgeLabels.set(edge.id, nudged);
        occupiedBoxes.push(toEdgeBox(nudged));
    }
    return { activeAnchorsByNode, nodeLabels, secondaryLabels, edgeLabels };
}
function buildActiveAnchorsByNode(edges) {
    const map = new Map();
    for (const edge of edges) {
        const preferences = edge.routing?.preferences;
        if (!preferences)
            continue;
        if (preferences.sourceAnchor) {
            if (!map.has(edge.source))
                map.set(edge.source, new Set());
            map.get(edge.source).add(preferences.sourceAnchor);
        }
        if (preferences.targetAnchor) {
            if (!map.has(edge.target))
                map.set(edge.target, new Set());
            map.get(edge.target).add(preferences.targetAnchor);
        }
    }
    return map;
}
function resolveNodeLabel(node, activeAnchors, theme, padding) {
    const style = getElementStyle(theme, node.type);
    const centerX = padding + node.x;
    const centerY = padding + node.y;
    const topY = centerY - node.height / 2;
    const bottomY = centerY + node.height / 2;
    const isEvent = isEventNodeKind(node.type);
    const isDecision = isGatewayNodeKind(node.type);
    const shortDecisionText = isDecision && node.label.trim().length <= 4 && !node.label.includes(' ');
    let lines;
    let y;
    let fontWeight = style.text.weight;
    if (isEvent) {
        const formatted = formatLabel(node.label, style.text, { availableWidthPx: 200, charWidthPx: 5.2 });
        lines = formatted.lines;
        y = bottomY + 10;
        fontWeight = Math.min(fontWeight, 500);
    }
    else if (shortDecisionText) {
        const formatted = formatLabel(node.label, style.text, { availableWidthPx: 38 });
        lines = formatted.lines;
        y = centerY + 1;
    }
    else if (isDecision) {
        const formatted = formatLabel(node.label, style.text, { availableWidthPx: 127.2 });
        lines = formatted.lines;
        y = activeAnchors.has('bottom') && !activeAnchors.has('top')
            ? topY - 10
            : bottomY + 10;
    }
    else {
        const availableWidthPx = node.width - 12;
        const formatted = formatLabel(node.label, style.text, { availableWidthPx });
        lines = formatted.lines;
        const hasSecondary = style.infoPolicy.placement !== 'hidden' &&
            (style.infoPolicy.secondaryFields?.length ?? 0) > 0;
        const secondaryOffset = hasSecondary ? -3 : 0;
        y = centerY - ((lines.length - 1) * (style.text.fontSizePx + 1)) / 2 + secondaryOffset;
    }
    return {
        nodeId: node.id,
        lines,
        x: centerX,
        y,
        fontSize: style.text.fontSizePx,
        fontWeight,
        fill: style.appearance.label,
        lineSpacing: style.text.fontSizePx + 1,
    };
}
function resolveSecondaryLabel(node, theme, padding) {
    const style = getElementStyle(theme, node.type);
    if (style.infoPolicy.placement === 'hidden' ||
        isEventNodeKind(node.type) ||
        isGatewayNodeKind(node.type)) {
        return null;
    }
    const field = style.infoPolicy.secondaryFields?.[0] ?? 'type';
    const value = resolveNodeFieldValue(node, field);
    if (!value) {
        return null;
    }
    const secondaryStyleConfig = style.infoPolicy.secondaryStyle;
    const secondaryStyle = {
        fontSizePx: secondaryStyleConfig?.fontSizePx ?? 6,
        weight: secondaryStyleConfig?.weight ?? 600,
        uppercase: secondaryStyleConfig?.uppercase,
        tracking: secondaryStyleConfig?.tracking,
        opacity: secondaryStyleConfig?.opacity,
    };
    const formatted = formatLabel(value, secondaryStyle);
    return {
        nodeId: node.id,
        text: formatted.lines[0] ?? value,
        x: padding + node.x,
        y: padding + node.y + node.height / 2 - 4,
        fontSize: secondaryStyle.fontSizePx,
        fontWeight: secondaryStyle.weight,
        fill: style.appearance.stroke,
        opacity: secondaryStyle.opacity ?? 0.75,
        letterSpacing: toLetterSpacing(secondaryStyle.tracking),
    };
}
function resolveEdgeLabel(edge, theme, padding) {
    const edgeTextStyle = {
        fontSizePx: theme.edges.label.fontSize,
        weight: theme.edges.label.fontWeight,
        wrap: 'truncate',
        maxLines: 1,
    };
    const text = formatLabel(edge.condition || '', edgeTextStyle, { availableWidthPx: theme.edges.label.maxWidth }).lines[0] ?? '';
    const position = resolveEdgeLabelPosition(edge, theme.edgeLabelPositions, padding);
    if (!position)
        return null;
    const edgeLabelStyle = theme.edges.label;
    const charWidthPx = edgeLabelStyle.charWidthPx;
    const paddingX = edgeLabelStyle.paddingX;
    const naturalWidth = paddingX * 2 + text.length * charWidthPx;
    const width = Math.max(edgeLabelStyle.minWidth, naturalWidth);
    const height = edgeLabelStyle.fontSize + paddingX;
    return {
        edgeId: edge.id,
        text,
        x: position.x,
        y: position.y,
        width,
        height,
        fontSize: edgeLabelStyle.fontSize,
        fontWeight: edgeLabelStyle.fontWeight,
        fill: edgeLabelStyle.fill,
        haloFill: edgeLabelStyle.haloColor ?? theme.lanes.bodyFill,
        haloWidth: edgeLabelStyle.haloWidth,
        side: position.side,
    };
}
function toNodeBox(label) {
    const width = Math.max(60, Math.max(...label.lines.map((line) => line.length), 0) * 6.5);
    const height = Math.max(label.fontSize + 4, label.lines.length * label.lineSpacing);
    return {
        x: label.x - width / 2,
        y: label.y - label.fontSize / 1.5,
        width,
        height,
    };
}
function toEdgeBox(label) {
    return {
        x: label.x - label.width / 2,
        y: label.y - label.height / 2,
        width: label.width,
        height: label.height,
    };
}
function nudgeNodeLabel(label, occupied) {
    const box = nudgeBox(toNodeBox(label), occupied, NODE_CLEARANCE);
    return {
        ...label,
        x: box.x + box.width / 2,
        y: box.y + label.fontSize / 1.5,
    };
}
function nudgeEdgeLabel(label, occupied) {
    const box = nudgeBox(toEdgeBox(label), occupied, EDGE_CLEARANCE);
    return {
        ...label,
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
    };
}
function nudgeBox(box, occupied, clearance) {
    const offsets = [
        { dx: 0, dy: 0 },
        { dx: 0, dy: 12 },
        { dx: 0, dy: -12 },
        { dx: 14, dy: 0 },
        { dx: -14, dy: 0 },
        { dx: 14, dy: 12 },
        { dx: -14, dy: 12 },
    ];
    for (const offset of offsets) {
        const candidate = {
            ...box,
            x: box.x + offset.dx,
            y: box.y + offset.dy,
        };
        if (!occupied.some((other) => overlaps(candidate, other, clearance))) {
            return candidate;
        }
    }
    return box;
}
function overlaps(a, b, clearance) {
    return !(a.x + a.width + clearance < b.x ||
        a.y + a.height + clearance < b.y ||
        b.x + b.width + clearance < a.x ||
        b.y + b.height + clearance < a.y);
}
function resolveNodeFieldValue(node, field) {
    if (field === 'type') {
        // Return a meaningful type indicator rather than the raw node type.
        // Events show their eventType (message, timer, signal) when specified.
        const eventType = node.metadata?.eventType;
        if (isEventNodeKind(node.type) && eventType && eventType !== 'message') {
            return eventType;
        }
        // Tasks show their taskType (service, user, script) when specified.
        const taskType = node.metadata?.taskType;
        if (node.type === 'task' && taskType && taskType !== 'manual') {
            return taskType;
        }
        // Everything else: return nothing — no wasted space for obvious types.
        return undefined;
    }
    if (field === 'label')
        return node.label;
    if (field === 'actor')
        return node.actor;
    if (field.startsWith('metadata.')) {
        const key = field.replace('metadata.', '');
        const value = node.metadata?.[key];
        if (value === undefined || value === null)
            return undefined;
        return String(value);
    }
    return undefined;
}
