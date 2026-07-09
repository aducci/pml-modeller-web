/**
 * Pattern Definition — first-class routing pattern records.
 *
 * Each PatternDefinition encodes:
 *   detect  — declarative criteria evaluated against an edge's resolved context
 *   flow    — the PortAssignmentRule applied when this pattern matches
 *
 * The matcher evaluates patterns in descending priority order and returns
 * the first fully-matching record. Priority replaces the old cascade order.
 *
 * Adding a new pattern = adding one record to DEFAULT_PATTERN_TABLE.
 * Enabling/disabling = flipping `enabled` on that record.
 * Reordering = changing `priority` values.
 */
// ─── Default pattern table ────────────────────────────────────────────────────
// Converted 1:1 from the former DEFAULT_PORT_RULES registry +
// the cascade conditions in computeScenarioKey(). Same routing behaviour;
// now expressed as data rather than code order.
export const DEFAULT_PATTERN_TABLE = [
    {
        id: 'boundary-outbound',
        label: 'Boundary outbound',
        description: 'Source is a boundary-attached event (e.g. external trigger entering the process). Highest priority — always fires before topology checks.',
        enabled: true,
        priority: 100,
        detect: { sourceIsBoundary: true },
        flow: {
            scenarioKey: 'boundary-outbound',
            sourcePortPriority: [{ side: 'top', hardness: 'locked' }, { side: 'right', hardness: 'fallback' }],
            targetPortPriority: [{ side: 'auto', hardness: 'preferred' }],
            firstSegmentDirection: 'vertical-first',
            exitBufferPx: 24,
            entryBufferPx: 12,
            elbowYPolicy: 'midpointY',
        },
    },
    {
        id: 'boundary-inbound',
        label: 'Boundary inbound',
        description: 'Target is a boundary-attached event (e.g. process output leaving to external). Fires before topology checks.',
        enabled: true,
        priority: 90,
        detect: { targetIsBoundary: true },
        flow: {
            scenarioKey: 'boundary-inbound',
            sourcePortPriority: [{ side: 'auto', hardness: 'preferred' }],
            targetPortPriority: [{ side: 'bottom', hardness: 'locked' }, { side: 'left', hardness: 'fallback' }],
            firstSegmentDirection: 'vertical-first',
            exitBufferPx: 12,
            entryBufferPx: 24,
            elbowYPolicy: 'matchTargetConnectionY',
        },
    },
    {
        id: 'same-lane-loopback-top',
        label: 'Same-lane loopback (top)',
        description: 'Backward edge within the same lane where the arc midpoint is in the upper half of the lane. Routes arc over the top of both nodes.',
        enabled: true,
        priority: 82,
        detect: { sameLane: true, isLoopback: true, loopbackSide: 'top' },
        flow: {
            scenarioKey: 'same-lane-loopback-top',
            sourcePortPriority: [{ side: 'top', hardness: 'locked' }],
            targetPortPriority: [{ side: 'top', hardness: 'locked' }],
            firstSegmentDirection: 'vertical-first',
            exitBufferPx: 20,
            entryBufferPx: 20,
            elbowYPolicy: 'midpointY',
        },
    },
    {
        id: 'same-lane-loopback-bottom',
        label: 'Same-lane loopback (bottom)',
        description: 'Backward edge within the same lane where the arc midpoint is in the lower half of the lane. Routes arc under both nodes.',
        enabled: true,
        priority: 80,
        detect: { sameLane: true, isLoopback: true, loopbackSide: 'bottom' },
        flow: {
            scenarioKey: 'same-lane-loopback-bottom',
            sourcePortPriority: [{ side: 'bottom', hardness: 'locked' }],
            targetPortPriority: [{ side: 'bottom', hardness: 'locked' }],
            firstSegmentDirection: 'vertical-first',
            exitBufferPx: 20,
            entryBufferPx: 20,
            elbowYPolicy: 'midpointY',
        },
    },
    {
        id: 'decision-split-vertical',
        label: 'Decision split — vertical fan',
        description: 'Gateway with multiple outgoing edges where all targets are in the same lane as the source. Branches fan vertically within the lane.',
        enabled: true,
        priority: 72,
        detect: {
            sourceNodeTypes: ['decision'],
            sourceOutDegreeGt: 1,
            allTargetsInSourceLane: true,
        },
        flow: {
            scenarioKey: 'decision-split-vertical',
            sourcePortPriority: [{ side: 'bottom', hardness: 'preferred' }, { side: 'right', hardness: 'preferred' }],
            targetPortPriority: [{ side: 'left', hardness: 'preferred' }, { side: 'top', hardness: 'fallback' }],
            firstSegmentDirection: 'vertical-first',
            exitBufferPx: 16,
            entryBufferPx: 12,
            elbowYPolicy: 'matchSourceConnectionY',
        },
    },
    {
        id: 'decision-split-horizontal',
        label: 'Decision split — horizontal fan',
        description: 'Gateway with multiple outgoing edges going to different lanes. Branches fan horizontally across lanes.',
        enabled: true,
        priority: 70,
        detect: {
            sourceNodeTypes: ['decision'],
            sourceOutDegreeGt: 1,
        },
        flow: {
            scenarioKey: 'decision-split-horizontal',
            sourcePortPriority: [{ side: 'right', hardness: 'preferred' }, { side: 'bottom', hardness: 'preferred' }],
            targetPortPriority: [{ side: 'left', hardness: 'preferred' }, { side: 'top', hardness: 'fallback' }],
            firstSegmentDirection: 'horizontal-first',
            exitBufferPx: 16,
            entryBufferPx: 12,
            elbowYPolicy: 'matchTargetConnectionY',
        },
    },
    {
        id: 'fan-in-join',
        label: 'Fan-in join',
        description: 'Multiple edges converging on a single target node (not a loopback). Entry port is locked to the left side for visual alignment.',
        enabled: true,
        priority: 60,
        detect: { isLoopback: false, targetInDegreeGt: 1 },
        flow: {
            scenarioKey: 'fan-in-join',
            sourcePortPriority: [{ side: 'right', hardness: 'preferred' }, { side: 'bottom', hardness: 'fallback' }],
            targetPortPriority: [{ side: 'left', hardness: 'locked' }],
            firstSegmentDirection: 'horizontal-first',
            exitBufferPx: 12,
            entryBufferPx: 16,
            elbowYPolicy: 'matchTargetConnectionY',
        },
    },
    {
        id: 'same-lane-elbow',
        label: 'Same-lane elbow',
        description: 'Forward edge within the same lane where the target is significantly offset vertically (> 50% of node height). Routes with an elbow bend.',
        enabled: true,
        priority: 32,
        detect: { sameLane: true, isLoopback: false, deltaYRatioGt: 0.5 },
        flow: {
            scenarioKey: 'same-lane-elbow',
            sourcePortPriority: [{ side: 'right', hardness: 'preferred' }, { side: 'bottom', hardness: 'preferred' }],
            targetPortPriority: [{ side: 'left', hardness: 'preferred' }, { side: 'top', hardness: 'fallback' }],
            firstSegmentDirection: 'horizontal-first',
            exitBufferPx: 12,
            entryBufferPx: 12,
            elbowYPolicy: 'matchTargetConnectionY',
        },
    },
    {
        id: 'same-lane-straight',
        label: 'Same-lane straight',
        description: 'Forward edge within the same lane with minimal vertical offset. Routes as a straight or near-straight horizontal line.',
        enabled: true,
        priority: 30,
        detect: { sameLane: true, isLoopback: false },
        flow: {
            scenarioKey: 'same-lane-straight',
            sourcePortPriority: [{ side: 'right', hardness: 'preferred' }, { side: 'bottom', hardness: 'fallback' }],
            targetPortPriority: [{ side: 'left', hardness: 'preferred' }, { side: 'top', hardness: 'fallback' }],
            firstSegmentDirection: 'horizontal-first',
            exitBufferPx: 12,
            entryBufferPx: 12,
            elbowYPolicy: 'matchTargetConnectionY',
        },
    },
    {
        id: 'cross-lane-downward',
        label: 'Cross-lane downward',
        description: 'Edge crossing from a higher lane to a lower lane (downward in the diagram). Uses buffer-rail geometry to avoid lane body collisions.',
        enabled: true,
        priority: 22,
        detect: { sameLane: false, laneDirection: 'downward' },
        flow: {
            scenarioKey: 'cross-lane-downward',
            sourcePortPriority: [{ side: 'right', hardness: 'preferred' }, { side: 'bottom', hardness: 'preferred' }, { side: 'left', hardness: 'fallback' }],
            targetPortPriority: [{ side: 'left', hardness: 'preferred' }, { side: 'top', hardness: 'preferred' }],
            firstSegmentDirection: 'horizontal-first',
            exitBufferPx: 12,
            entryBufferPx: 12,
            elbowYPolicy: 'matchTargetConnectionY',
            geometryModePreference: ['cross-down-r_to_l-buffer-rail-rise'],
            straightDownAlignmentThresholdPx: 20,
        },
    },
    {
        id: 'cross-lane-upward',
        label: 'Cross-lane upward',
        description: 'Edge crossing from a lower lane to a higher lane (upward / backward in the diagram). Catch-all for cross-lane flows not matched above.',
        enabled: true,
        priority: 20,
        detect: { sameLane: false, laneDirection: 'upward' },
        flow: {
            scenarioKey: 'cross-lane-upward',
            sourcePortPriority: [{ side: 'right', hardness: 'preferred' }, { side: 'top', hardness: 'preferred' }, { side: 'left', hardness: 'fallback' }],
            targetPortPriority: [{ side: 'left', hardness: 'preferred' }, { side: 'bottom', hardness: 'preferred' }],
            firstSegmentDirection: 'horizontal-first',
            exitBufferPx: 12,
            entryBufferPx: 12,
            elbowYPolicy: 'matchTargetConnectionY',
            geometryModePreference: ['cross-up-r_to_l-buffer-rail-drop'],
            straightDownAlignmentThresholdPx: 20,
        },
    },
];
