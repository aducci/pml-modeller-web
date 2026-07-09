/**
 * Port Resolver — Single controller for port rule selection, blocked-port
 * detection, downgrade logging, and geometry mode selection.
 *
 * IP-1: Full 11-scenario rule registry (kebab-case per spec Section 25.1),
 *        geometry mode selection from CrossLaneAlignmentContext,
 *        and basic channel-saturation / congestion detection stubs.
 */
import { nodeRect, rectCenter } from '../layoutGeometry';
// ---------------------------------------------------------------------------
// Port rule registry — all 11 scenarios (kebab-case, spec Section 25.1).
// ---------------------------------------------------------------------------
export const DEFAULT_PORT_RULES = {
    'same-lane-straight': {
        scenarioKey: 'same-lane-straight',
        sourcePortPriority: [
            { side: 'right', hardness: 'preferred' },
            { side: 'bottom', hardness: 'fallback' },
        ],
        targetPortPriority: [
            { side: 'left', hardness: 'preferred' },
            { side: 'top', hardness: 'fallback' },
        ],
        firstSegmentDirection: 'horizontal-first',
        exitBufferPx: 12,
        entryBufferPx: 12,
        elbowYPolicy: 'matchTargetConnectionY',
    },
    'same-lane-elbow': {
        scenarioKey: 'same-lane-elbow',
        sourcePortPriority: [
            { side: 'right', hardness: 'preferred' },
            { side: 'bottom', hardness: 'preferred' },
        ],
        targetPortPriority: [
            { side: 'left', hardness: 'preferred' },
            { side: 'top', hardness: 'fallback' },
        ],
        firstSegmentDirection: 'horizontal-first',
        exitBufferPx: 12,
        entryBufferPx: 12,
        elbowYPolicy: 'matchTargetConnectionY',
    },
    'same-lane-loopback-top': {
        scenarioKey: 'same-lane-loopback-top',
        sourcePortPriority: [{ side: 'top', hardness: 'locked' }],
        targetPortPriority: [{ side: 'top', hardness: 'locked' }],
        firstSegmentDirection: 'vertical-first',
        exitBufferPx: 20,
        entryBufferPx: 20,
        elbowYPolicy: 'midpointY',
    },
    'same-lane-loopback-bottom': {
        scenarioKey: 'same-lane-loopback-bottom',
        sourcePortPriority: [{ side: 'bottom', hardness: 'locked' }],
        targetPortPriority: [{ side: 'bottom', hardness: 'locked' }],
        firstSegmentDirection: 'vertical-first',
        exitBufferPx: 20,
        entryBufferPx: 20,
        elbowYPolicy: 'midpointY',
    },
    'cross-lane-downward': {
        scenarioKey: 'cross-lane-downward',
        sourcePortPriority: [
            { side: 'right', hardness: 'preferred' },
            { side: 'bottom', hardness: 'preferred' },
            { side: 'left', hardness: 'fallback' },
        ],
        targetPortPriority: [
            { side: 'left', hardness: 'preferred' },
            { side: 'top', hardness: 'preferred' },
        ],
        firstSegmentDirection: 'horizontal-first',
        exitBufferPx: 12,
        entryBufferPx: 12,
        elbowYPolicy: 'matchTargetConnectionY',
        geometryModePreference: [
            'cross-down-b_to_l-buffer-rail-rise',
            'cross-down-r_to_l-buffer-rail-rise',
        ],
        straightDownAlignmentThresholdPx: 20,
    },
    'cross-lane-upward': {
        scenarioKey: 'cross-lane-upward',
        sourcePortPriority: [
            { side: 'right', hardness: 'preferred' },
            { side: 'top', hardness: 'preferred' },
            { side: 'left', hardness: 'fallback' },
        ],
        targetPortPriority: [
            { side: 'left', hardness: 'preferred' },
            { side: 'bottom', hardness: 'preferred' },
        ],
        firstSegmentDirection: 'horizontal-first',
        exitBufferPx: 12,
        entryBufferPx: 12,
        elbowYPolicy: 'matchTargetConnectionY',
        geometryModePreference: [
            'cross-up-r_to_l-buffer-rail-drop',
        ],
        straightDownAlignmentThresholdPx: 20,
    },
    'decision-split-horizontal': {
        scenarioKey: 'decision-split-horizontal',
        sourcePortPriority: [
            { side: 'right', hardness: 'preferred' },
            { side: 'bottom', hardness: 'preferred' },
        ],
        targetPortPriority: [
            { side: 'left', hardness: 'preferred' },
            { side: 'top', hardness: 'fallback' },
        ],
        firstSegmentDirection: 'horizontal-first',
        exitBufferPx: 16,
        entryBufferPx: 12,
        elbowYPolicy: 'matchTargetConnectionY',
    },
    'decision-split-vertical': {
        scenarioKey: 'decision-split-vertical',
        sourcePortPriority: [
            { side: 'bottom', hardness: 'preferred' },
            { side: 'right', hardness: 'preferred' },
        ],
        targetPortPriority: [
            { side: 'left', hardness: 'preferred' },
            { side: 'top', hardness: 'fallback' },
        ],
        firstSegmentDirection: 'vertical-first',
        exitBufferPx: 16,
        entryBufferPx: 12,
        elbowYPolicy: 'matchSourceConnectionY',
    },
    'fan-in-join': {
        scenarioKey: 'fan-in-join',
        sourcePortPriority: [
            { side: 'right', hardness: 'preferred' },
            { side: 'bottom', hardness: 'fallback' },
        ],
        targetPortPriority: [{ side: 'left', hardness: 'locked' }],
        firstSegmentDirection: 'horizontal-first',
        exitBufferPx: 12,
        entryBufferPx: 16,
        elbowYPolicy: 'matchTargetConnectionY',
    },
    'boundary-outbound': {
        scenarioKey: 'boundary-outbound',
        sourcePortPriority: [
            { side: 'top', hardness: 'locked' },
            { side: 'right', hardness: 'fallback' },
        ],
        targetPortPriority: [{ side: 'auto', hardness: 'preferred' }],
        firstSegmentDirection: 'vertical-first',
        exitBufferPx: 24,
        entryBufferPx: 12,
        elbowYPolicy: 'midpointY',
    },
    'boundary-inbound': {
        scenarioKey: 'boundary-inbound',
        sourcePortPriority: [{ side: 'auto', hardness: 'preferred' }],
        targetPortPriority: [
            { side: 'bottom', hardness: 'locked' },
            { side: 'left', hardness: 'fallback' },
        ],
        firstSegmentDirection: 'vertical-first',
        exitBufferPx: 12,
        entryBufferPx: 24,
        elbowYPolicy: 'matchTargetConnectionY',
    },
};
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function resolvePortAssignment(scenarioKey, source, target, context, crossLaneContext, portRuleOverrides, flowLayerBias, matchedFlow) {
    const registry = { ...DEFAULT_PORT_RULES, ...portRuleOverrides };
    const rule = matchedFlow ?? registry[scenarioKey] ?? DEFAULT_PORT_RULES['same-lane-straight'];
    const horizontalConnectionsOnly = Boolean(context.horizontalConnectionsOnly);
    let selectedGeometryMode = horizontalConnectionsOnly
        ? selectHorizontalOnlyGeometryMode(scenarioKey, rule)
        : selectGeometryMode(rule);
    selectedGeometryMode = refineGeometryModeForSourcePattern(scenarioKey, selectedGeometryMode, source, target);
    let effectiveRule = selectedGeometryMode ? portAdjustedForMode(rule, selectedGeometryMode) : rule;
    if (!horizontalConnectionsOnly) {
        effectiveRule = applyDecisionSplitDirectionalPolicy(effectiveRule, source, target);
    }
    if (horizontalConnectionsOnly) {
        effectiveRule = enforceHorizontalConnectionsOnly(effectiveRule, source, target);
    }
    // Flow layer port hardness adjustment: alternate/exception flows must not use locked ports
    // (except boundary scenarios, which always require hard attachment per spec Section 10.2).
    if (flowLayerBias?.downgradeLockedPorts && !scenarioKey.includes('boundary')) {
        effectiveRule = downgradeLockedPortHardness(effectiveRule);
    }
    const resolution = resolvePorts(effectiveRule, source, target, context);
    return { rule: effectiveRule, resolution, selectedGeometryMode };
}
function refineGeometryModeForSourcePattern(scenarioKey, mode, source, target) {
    if (scenarioKey !== 'cross-lane-downward')
        return mode;
    // Switch to right-exit when source is a non-boundary internal event that is
    // NOT clearly above the target — the right-exit shape is more compact in that
    // degenerate case and avoids an unnecessary extra bend.
    if (mode === 'cross-down-b_to_l-buffer-rail-rise') {
        const isInternalRelayEvent = source.type === 'event'
            && !source.isBoundary
            && String(source.metadata?.direction || 'internal') === 'internal';
        const sourceY = source.y ?? 0;
        const targetY = target.y ?? 0;
        const targetNotClearlyBelow = targetY <= sourceY + 1;
        if (isInternalRelayEvent && targetNotClearlyBelow) {
            return 'cross-down-r_to_l-buffer-rail-rise';
        }
    }
    return mode;
}
// ---------------------------------------------------------------------------
// Flow layer port hardness adjustment
// ---------------------------------------------------------------------------
function downgradeLockedPortHardness(rule) {
    const downgrade = (prefs) => prefs.map((p) => p.hardness === 'locked' ? { ...p, hardness: 'preferred' } : p);
    return {
        ...rule,
        sourcePortPriority: downgrade(rule.sourcePortPriority),
        targetPortPriority: downgrade(rule.targetPortPriority),
    };
}
// ---------------------------------------------------------------------------
// Geometry mode selection
// ---------------------------------------------------------------------------
function selectGeometryMode(rule) {
    return rule.geometryModePreference?.[0];
}
function portAdjustedForMode(rule, mode) {
    // Override port priorities to match the required anchors for the geometry mode.
    const p = (side, hardness = 'preferred') => [{ side, hardness }];
    switch (mode) {
        case 'cross-up-r_to_l-buffer-rail-drop':
            return { ...rule, sourcePortPriority: p('right'), targetPortPriority: p('left') };
        case 'cross-up-r_to_l-top-exit':
            return { ...rule, sourcePortPriority: p('top'), targetPortPriority: p('left') };
        case 'cross-down-r_to_l-buffer-rail-rise':
            return { ...rule, sourcePortPriority: p('right'), targetPortPriority: p('left') };
        case 'cross-down-b_to_l-buffer-rail-rise':
            return { ...rule, sourcePortPriority: p('bottom'), targetPortPriority: p('left') };
        default:
            return rule;
    }
}
function selectHorizontalOnlyGeometryMode(scenarioKey, rule) {
    if (!rule.geometryModePreference || rule.geometryModePreference.length === 0) {
        return undefined;
    }
    if (scenarioKey.includes('cross-lane')) {
        return rule.geometryModePreference[0];
    }
    return undefined;
}
function applyDecisionSplitDirectionalPolicy(rule, source, target) {
    if (rule.scenarioKey !== 'decision-split-horizontal' && rule.scenarioKey !== 'decision-split-vertical') {
        return rule;
    }
    const sourceY = source.y ?? 0;
    const targetY = target.y ?? 0;
    const verticalDelta = targetY - sourceY;
    const verticalTolerance = Math.max(source.height, target.height) * 0.25;
    if (verticalDelta < -verticalTolerance) {
        return {
            ...rule,
            sourcePortPriority: [{ side: 'top', hardness: 'preferred' }],
            targetPortPriority: [{ side: 'left', hardness: 'preferred' }],
            firstSegmentDirection: 'vertical-first',
            elbowYPolicy: 'matchTargetConnectionY',
        };
    }
    if (verticalDelta > verticalTolerance) {
        return {
            ...rule,
            sourcePortPriority: [{ side: 'bottom', hardness: 'preferred' }],
            targetPortPriority: [{ side: 'left', hardness: 'preferred' }],
            firstSegmentDirection: 'vertical-first',
            elbowYPolicy: 'matchTargetConnectionY',
        };
    }
    return {
        ...rule,
        sourcePortPriority: [{ side: 'right', hardness: 'preferred' }],
        targetPortPriority: [{ side: 'left', hardness: 'preferred' }],
        firstSegmentDirection: 'horizontal-first',
        elbowYPolicy: 'matchTargetConnectionY',
    };
}
function enforceHorizontalConnectionsOnly(rule, source, target) {
    const sourceX = source.x ?? 0;
    const targetX = target.x ?? 0;
    const forward = sourceX <= targetX;
    return {
        ...rule,
        sourcePortPriority: [
            { side: forward ? 'right' : 'left', hardness: 'preferred' },
            { side: forward ? 'left' : 'right', hardness: 'fallback' },
        ],
        targetPortPriority: [
            { side: forward ? 'left' : 'right', hardness: 'preferred' },
            { side: forward ? 'right' : 'left', hardness: 'fallback' },
        ],
        firstSegmentDirection: 'horizontal-first',
        elbowYPolicy: 'matchTargetConnectionY',
    };
}
// ---------------------------------------------------------------------------
// Port resolution
// ---------------------------------------------------------------------------
function resolvePorts(rule, source, target, context) {
    const lockedViolations = [];
    const sourceResolution = selectPortFromPriority(rule.sourcePortPriority, 'right', source, target, true, lockedViolations, context);
    const targetResolution = selectPortFromPriority(rule.targetPortPriority, 'left', source, target, false, lockedViolations, context);
    return {
        sourceRequested: sourceResolution.requested,
        sourceSelected: sourceResolution.selected,
        sourceDowngradeReason: sourceResolution.downgradeReason,
        targetRequested: targetResolution.requested,
        targetSelected: targetResolution.selected,
        targetDowngradeReason: targetResolution.downgradeReason,
        lockedViolations,
    };
}
function selectPortFromPriority(priority, fallbackSide, source, target, isSource, lockedViolations, context) {
    const effective = priority.length > 0
        ? priority
        : [{ side: fallbackSide, hardness: 'preferred' }];
    const requested = effective[0].side;
    for (let i = 0; i < effective.length; i++) {
        const pref = effective[i];
        const candidate = (pref.side === 'auto' ? fallbackSide : pref.side);
        const blocked = getPortBlockedReason(candidate, source, target, isSource, context);
        if (!blocked) {
            if (i > 0) {
                return {
                    requested,
                    selected: candidate,
                    downgradeReason: `${isSource ? 'source' : 'target'} port downgraded to ${candidate}`,
                };
            }
            return { requested, selected: candidate };
        }
        if (pref.hardness === 'locked') {
            lockedViolations.push(`${isSource ? 'source' : 'target'}:${candidate}`);
            return {
                requested,
                selected: candidate,
                downgradeReason: `${isSource ? 'source' : 'target'} locked port ${candidate} blocked: ${blocked}`,
            };
        }
    }
    return {
        requested,
        selected: fallbackSide,
        downgradeReason: `${isSource ? 'source' : 'target'} fallback selected (${fallbackSide})`,
    };
}
// ---------------------------------------------------------------------------
// Blocked-port detection
// ---------------------------------------------------------------------------
const MAX_EDGES_PER_PORT_SIDE = 3;
function getPortBlockedReason(side, source, target, isSource, context) {
    const node = isSource ? source : target;
    const srcR = nodeRect(source);
    const tgtR = nodeRect(target);
    const { x: srcCX, y: srcCY } = rectCenter(srcR);
    const { x: tgtCX, y: tgtCY } = rectCenter(tgtR);
    if (isSource) {
        if (side === 'right' && tgtCX < srcCX && Math.abs(tgtCY - srcCY) < srcR.height)
            return 'node-obstruction';
        if (side === 'left' && tgtCX > srcCX && Math.abs(tgtCY - srcCY) < srcR.height)
            return 'node-obstruction';
        if (side === 'top' && tgtCY > srcCY && Math.abs(tgtCX - srcCX) < srcR.width)
            return 'node-obstruction';
        if (side === 'bottom' && tgtCY < srcCY && Math.abs(tgtCX - srcCX) < srcR.width)
            return 'node-obstruction';
    }
    else {
        if (side === 'left' && srcCX > tgtCX && Math.abs(tgtCY - srcCY) < tgtR.height)
            return 'node-obstruction';
        if (side === 'right' && srcCX < tgtCX && Math.abs(tgtCY - srcCY) < tgtR.height)
            return 'node-obstruction';
        if (side === 'top' && srcCY > tgtCY && Math.abs(tgtCX - srcCX) < tgtR.width)
            return 'node-obstruction';
        if (side === 'bottom' && srcCY < tgtCY && Math.abs(tgtCX - srcCX) < tgtR.width)
            return 'node-obstruction';
    }
    // channel-saturation: too many edges already assigned to this port side
    const portKey = `${node.id}:${side}`;
    if (context.portSideEdgeCounts) {
        const count = context.portSideEdgeCounts.get(portKey) ?? 0;
        if (count >= MAX_EDGES_PER_PORT_SIDE)
            return 'channel-saturation';
    }
    // hard-side-conflict: a locked assignment already claimed this port side
    if (context.lockedPortClaims?.has(portKey))
        return 'hard-side-conflict';
    return null;
}
