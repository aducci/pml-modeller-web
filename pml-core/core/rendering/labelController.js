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
        const placed = separateNodeLabel(label, occupiedBoxes);
        nodeLabels.set(node.id, placed);
        occupiedBoxes.push(toNodeBox(placed));
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
        const placed = label.avoidOverlap ? separateEdgeLabel(label, occupiedBoxes) : label;
        edgeLabels.set(edge.id, placed);
        occupiedBoxes.push(toEdgeBox(placed));
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
        avoidOverlap: position.avoidOverlap,
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
function separateNodeLabel(label, occupied) {
    const box = separateBox(toNodeBox(label), occupied, NODE_CLEARANCE);
    return {
        ...label,
        x: box.x + box.width / 2,
        y: box.y + label.fontSize / 1.5,
    };
}
function separateEdgeLabel(label, occupied) {
    const box = separateBox(toEdgeBox(label), occupied, EDGE_CLEARANCE);
    return {
        ...label,
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
    };
}
/**
 * Automatic decluttering's job is a small nudge to reduce overlap, not a
 * relocation — cap how far it's allowed to move a label in total. Resolving
 * a second (or third) colliding box can require a much larger correction
 * than the first, and that correction can point anywhere depending on which
 * box was hit and which axis had the smaller overlap — a real discontinuity,
 * not a bug in pushClear itself. Bounding the total shift turns "unbounded
 * jump to wherever" into "small bounded nudge, or leave the residual overlap
 * in place" — the latter reads far better than a label teleporting across
 * the canvas because of a 1px change somewhere else.
 */
const MAX_SEPARATION_SHIFT_PX = 24;
/**
 * Pushes `box` clear of every box in `occupied`, resolving one collision per
 * iteration via a minimum-translation vector (see pushClear). Continuous by
 * construction within a single collision: as the box's starting position
 * moves smoothly, the push shrinks smoothly to zero as the overlap
 * disappears — no jump between fixed candidate positions, unlike the
 * discrete offset list this replaced. See MAX_SEPARATION_SHIFT_PX for why
 * that alone isn't sufficient once a second collision enters the picture.
 */
function separateBox(box, occupied, clearance) {
    let current = box;
    let totalShift = 0;
    const maxIterations = 8;
    for (let i = 0; i < maxIterations; i++) {
        const collision = occupied.find((other) => overlaps(current, other, clearance));
        if (!collision)
            return current;
        const next = pushClear(current, collision, clearance);
        const stepShift = Math.abs(next.x - current.x) + Math.abs(next.y - current.y);
        if (totalShift + stepShift > MAX_SEPARATION_SHIFT_PX)
            return current;
        totalShift += stepShift;
        current = next;
    }
    return current;
}
/**
 * Minimum-translation push: moves `box` along whichever single axis needs
 * the smaller shift to clear `other` by exactly `clearance`. Proportional to
 * how much the boxes currently overlap, so it's zero right at the boundary
 * and grows smoothly from there — the property the old fixed-candidate-list
 * approach didn't have.
 */
function pushClear(box, other, clearance) {
    const dx = (box.x + box.width / 2) - (other.x + other.width / 2);
    const dy = (box.y + box.height / 2) - (other.y + other.height / 2);
    const overlapX = (box.width + other.width) / 2 + clearance - Math.abs(dx);
    const overlapY = (box.height + other.height) / 2 + clearance - Math.abs(dy);
    if (overlapX < overlapY) {
        const dir = dx >= 0 ? 1 : -1;
        return { ...box, x: box.x + dir * overlapX };
    }
    const dir = dy >= 0 ? 1 : -1;
    return { ...box, y: box.y + dir * overlapY };
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
