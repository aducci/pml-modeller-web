import { isActivityNodeKind, isEventNodeKind, isGatewayNodeKind } from '../nodeKinds';
/**
 * A node's effective size — layoutWidth/layoutHeight (which include external
 * label space) when present, falling back to width/height otherwise. This
 * exact `layoutHeight ?? height` / `layoutWidth ?? width` ternary was
 * independently repeated 14 times across processLayout/*.ts; this names it
 * once. Callers needing the half-value divide by 2 themselves rather than
 * this module adding four near-identical half-size variants.
 */
export function effectiveSize(node) {
    return {
        width: node.layoutWidth ?? node.width,
        height: node.layoutHeight ?? node.height,
    };
}
export function measureNodeDimensions(type, label, settings) {
    const { heuristics } = settings;
    if (isEventNodeKind(type)) {
        return {
            width: heuristics.eventSize,
            height: heuristics.eventSize,
            layoutWidth: heuristics.eventSize,
            layoutHeight: heuristics.eventSize,
        };
    }
    const estimatedTextWidth = label.length * heuristics.estimatedCharWidth + heuristics.textPaddingX;
    const boundedWidth = Math.min(settings.sizing.maxNodeWidth, Math.max(settings.sizing.minNodeWidth, estimatedTextWidth));
    if (isGatewayNodeKind(type)) {
        return {
            width: heuristics.decisionSize,
            height: heuristics.decisionSize,
            layoutWidth: heuristics.decisionSize,
            layoutHeight: heuristics.decisionSize,
        };
    }
    if (isActivityNodeKind(type)) {
        if (settings.sizing.activitySizingMode === 'standard') {
            const fixedWidth = settings.sizing.standardActivityWidth;
            return {
                width: fixedWidth,
                height: heuristics.taskHeight,
                layoutWidth: fixedWidth,
                layoutHeight: heuristics.taskHeight,
            };
        }
        const fitMin = settings.sizing.fitActivityMinWidth;
        const fitMax = settings.sizing.fitActivityMaxWidth;
        const widthStep = Math.max(1, settings.sizing.fitActivityWidthStep);
        const unclampedWidth = Math.min(fitMax, Math.max(fitMin, estimatedTextWidth));
        const snappedWidth = Math.round(unclampedWidth / widthStep) * widthStep;
        const fitWidth = Math.min(fitMax, Math.max(fitMin, snappedWidth));
        return {
            width: fitWidth,
            height: heuristics.taskHeight,
            layoutWidth: fitWidth,
            layoutHeight: heuristics.taskHeight,
        };
    }
    return {
        width: boundedWidth,
        height: settings.sizing.minNodeHeight,
        layoutWidth: boundedWidth,
        layoutHeight: settings.sizing.minNodeHeight,
    };
}
