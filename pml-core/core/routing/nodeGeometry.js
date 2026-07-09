/**
 * Node Geometry & Connection Points
 *
 * Calculates node bounds (shape only, text separate) and determines
 * discrete connection anchor points for each node type.
 *
 * Supports smart elbow pattern selection based on node types and
 * relative positions (vertical vs horizontal flow preference).
 */
import { isEventNodeKind, isGatewayNodeKind } from '../nodeKinds';
import { nodeRect } from '../layoutGeometry';
/**
 * Calculates the shape bounds and connection points for a node.
 * Text is excluded from shape bounds for clean separation.
 */
export function calculateNodeGeometry(node) {
    if (node.x === undefined || node.y === undefined) {
        throw new Error(`Node ${node.id} has no position (x, y).`);
    }
    const bounds = nodeRect(node);
    // Connection points depend on node type
    const connectionPoints = getConnectionPointsForType(node.type, bounds);
    // Routing preferences depend on node type
    const { exitPreference, entryPreference } = getRoutingPreferencesForType(node.type);
    return {
        id: node.id,
        type: node.type,
        bounds,
        connectionPoints,
        exitPreference,
        entryPreference,
    };
}
/**
 * Returns discrete connection points for a node based on its type.
 * Each point is positioned at the perimeter of the shape.
 */
function getConnectionPointsForType(nodeType, bounds) {
    const { x, y, width, height } = bounds;
    const cx = x + width / 2;
    const cy = y + height / 2;
    if (isEventNodeKind(nodeType)) {
        // Events are circles - 8 discrete connection points
        const radius = Math.max(width, height) / 2;
        const angles = [0, 90, 180, 270, 45, 135, 225, 315]; // degrees (cardinal first)
        return angles.map((angle, idx) => {
            const radians = (angle * Math.PI) / 180;
            const px = cx + radius * Math.cos(radians);
            const py = cy + radius * Math.sin(radians);
            let side;
            if (angle > 315 || angle < 45)
                side = 'right';
            else if (angle >= 45 && angle < 135)
                side = 'bottom';
            else if (angle >= 135 && angle < 225)
                side = 'left';
            else
                side = 'top';
            return {
                id: `event-${idx}`,
                x: px,
                y: py,
                side,
                role: 'both',
            };
        });
    }
    if (isGatewayNodeKind(nodeType)) {
        // Decisions are diamonds - 4 cardinal points + 4 corners
        const points = [];
        // Top
        points.push({ id: 'top', x: cx, y: y, side: 'top', role: 'entry' });
        // Right
        points.push({ id: 'right', x: x + width, y: cy, side: 'right', role: 'exit' });
        // Bottom
        points.push({ id: 'bottom', x: cx, y: y + height, side: 'bottom', role: 'exit' });
        // Left
        points.push({ id: 'left', x: x, y: cy, side: 'left', role: 'entry' });
        // Corners for dense routing
        points.push({ id: 'top-right', x: x + width * 0.75, y: y + height * 0.25, side: 'right', role: 'both' });
        points.push({ id: 'bottom-right', x: x + width * 0.75, y: y + height * 0.75, side: 'right', role: 'both' });
        points.push({ id: 'bottom-left', x: x + width * 0.25, y: y + height * 0.75, side: 'left', role: 'both' });
        points.push({ id: 'top-left', x: x + width * 0.25, y: y + height * 0.25, side: 'left', role: 'both' });
        return points;
    }
    // Tasks and subprocesses: rectangles - 4 cardinal points + 8 edge midpoints
    const points = [];
    // Cardinal points
    points.push({ id: 'top', x: cx, y: y, side: 'top', role: 'entry' });
    points.push({ id: 'right', x: x + width, y: cy, side: 'right', role: 'exit' });
    points.push({ id: 'bottom', x: cx, y: y + height, side: 'bottom', role: 'exit' });
    points.push({ id: 'left', x: x, y: cy, side: 'left', role: 'entry' });
    // Edge midpoints (for dense routing / lane crossing)
    points.push({ id: 'top-1/4', x: cx - width * 0.25, y: y, side: 'top', role: 'entry' });
    points.push({ id: 'top-3/4', x: cx + width * 0.25, y: y, side: 'top', role: 'entry' });
    points.push({ id: 'bottom-1/4', x: cx - width * 0.25, y: y + height, side: 'bottom', role: 'exit' });
    points.push({ id: 'bottom-3/4', x: cx + width * 0.25, y: y + height, side: 'bottom', role: 'exit' });
    points.push({ id: 'right-1/4', x: x + width, y: cy - height * 0.25, side: 'right', role: 'exit' });
    points.push({ id: 'right-3/4', x: x + width, y: cy + height * 0.25, side: 'right', role: 'exit' });
    points.push({ id: 'left-1/4', x: x, y: cy - height * 0.25, side: 'left', role: 'entry' });
    points.push({ id: 'left-3/4', x: x, y: cy + height * 0.25, side: 'left', role: 'entry' });
    return points;
}
/**
 * Returns routing preferences (exit/entry sides) based on node type.
 */
function getRoutingPreferencesForType(nodeType) {
    switch (nodeType) {
        case 'event':
            // Events can exit/enter from any side
            return { exitPreference: 'any', entryPreference: 'any' };
        case 'decision':
        case 'route':
            // Decisions prefer exiting right (forward) and entering from top/left
            return { exitPreference: 'right', entryPreference: 'top' };
        default:
            // Tasks, subprocesses: prefer right exit, left entry (horizontal flow)
            return { exitPreference: 'right', entryPreference: 'left' };
    }
}
