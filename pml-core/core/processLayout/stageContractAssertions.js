import { buildById } from './stageHelpers';
import { nodeRect as nodeToRect } from '../layoutGeometry';
function createReport() {
    return { errors: [], warnings: [] };
}
export function assertCoordinateStageContracts(nodes) {
    const report = createReport();
    for (const node of nodes) {
        if (node.x === undefined || node.y === undefined) {
            report.errors.push(`Node ${node.id} is missing coordinates after coordinate stage.`);
        }
        if (!node.laneId) {
            report.warnings.push(`Node ${node.id} has no lane assignment after lane stage.`);
        }
    }
    return report;
}
export function assertChannelStageContracts(edges, channelOverrides) {
    const report = createReport();
    for (const edge of edges) {
        if (!Object.prototype.hasOwnProperty.call(channelOverrides, edge.id)) {
            report.errors.push(`Edge ${edge.id} is missing channel allocation.`);
        }
    }
    return report;
}
function pointNearRectBoundary(point, rect, tolerance) {
    const left = rect.x;
    const right = rect.x + rect.width;
    const top = rect.y;
    const bottom = rect.y + rect.height;
    const onVertical = (Math.abs(point.x - left) <= tolerance || Math.abs(point.x - right) <= tolerance) &&
        point.y >= top - tolerance &&
        point.y <= bottom + tolerance;
    const onHorizontal = (Math.abs(point.y - top) <= tolerance || Math.abs(point.y - bottom) <= tolerance) &&
        point.x >= left - tolerance &&
        point.x <= right + tolerance;
    return onVertical || onHorizontal;
}
export function assertRoutingStageContractsWithNodes(edges, nodes) {
    const report = createReport();
    const nodeById = buildById(nodes);
    const tolerance = 1;
    for (const edge of edges) {
        if (edge.flowLayer === 'hidden') {
            continue;
        }
        if (!edge.routing) {
            report.errors.push(`Edge ${edge.id} is missing routing output.`);
            continue;
        }
        if (!edge.routing.waypoints || edge.routing.waypoints.length < 2) {
            report.errors.push(`Edge ${edge.id} has insufficient waypoints.`);
        }
        if (!edge.routing.pattern) {
            report.warnings.push(`Edge ${edge.id} has no selected pattern recorded.`);
        }
        if (!edge.routing.scenario) {
            report.warnings.push(`Edge ${edge.id} has no scenario recorded.`);
        }
        const sourceNode = nodeById.get(edge.source);
        const targetNode = nodeById.get(edge.target);
        if (!sourceNode || !targetNode || sourceNode.x === undefined || sourceNode.y === undefined || targetNode.x === undefined || targetNode.y === undefined) {
            continue;
        }
        const points = edge.routing.waypoints;
        if (!points || points.length < 2) {
            continue;
        }
        const start = points[0];
        const end = points[points.length - 1];
        const sourceRect = nodeToRect(sourceNode);
        const targetRect = nodeToRect(targetNode);
        if (!pointNearRectBoundary(start, sourceRect, tolerance)) {
            report.warnings.push(`Edge ${edge.id} start waypoint is not aligned to source node boundary.`);
        }
        if (!pointNearRectBoundary(end, targetRect, tolerance)) {
            report.warnings.push(`Edge ${edge.id} end waypoint is not aligned to target node boundary.`);
        }
    }
    return report;
}
export function appendStageReport(target, report) {
    for (const err of report.errors) {
        target.errors.push(err);
    }
    for (const warning of report.warnings) {
        target.warnings.push(warning);
    }
}
