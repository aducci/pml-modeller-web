/**
 * Routing Type → Port Assignment Rule
 *
 * Single source of truth mapping every RoutingTypeCode to the PortAssignmentRule
 * that realises it in the engine. This is the bridge between the admin rules
 * table (which speaks in canonical type codes) and the port resolver (which
 * speaks in PortAssignmentRule).
 *
 * deriveRoutingTypeCode() in routingDiagnostics.ts is the inverse of this
 * table — given resolved ports + bendType it returns the code. That function
 * is display-only; this table is the authoritative forward direction.
 */
// ---------------------------------------------------------------------------
// The canonical table
// ---------------------------------------------------------------------------
export const ROUTING_TYPE_PORT_RULES = {
    // ── Straight ──────────────────────────────────────────────────────────────
    STH: {
        scenarioKey: 'STH',
        sourcePortPriority: [{ side: 'right', hardness: 'preferred' }],
        targetPortPriority: [{ side: 'left', hardness: 'preferred' }],
        firstSegmentDirection: 'horizontal-first',
        exitBufferPx: 12,
        entryBufferPx: 12,
        elbowYPolicy: 'matchTargetConnectionY',
    },
    STV: {
        scenarioKey: 'STV',
        sourcePortPriority: [{ side: 'bottom', hardness: 'preferred' }],
        targetPortPriority: [{ side: 'top', hardness: 'preferred' }],
        firstSegmentDirection: 'vertical-first',
        exitBufferPx: 12,
        entryBufferPx: 12,
        elbowYPolicy: 'matchTargetConnectionY',
    },
    // ── Single elbow ──────────────────────────────────────────────────────────
    SEH: {
        scenarioKey: 'SEH',
        sourcePortPriority: [{ side: 'right', hardness: 'preferred' }, { side: 'bottom', hardness: 'fallback' }],
        targetPortPriority: [{ side: 'left', hardness: 'preferred' }, { side: 'top', hardness: 'fallback' }],
        firstSegmentDirection: 'horizontal-first',
        exitBufferPx: 12,
        entryBufferPx: 12,
        elbowYPolicy: 'matchTargetConnectionY',
    },
    SEV: {
        scenarioKey: 'SEV',
        sourcePortPriority: [{ side: 'top', hardness: 'preferred' }, { side: 'right', hardness: 'fallback' }],
        targetPortPriority: [{ side: 'left', hardness: 'preferred' }, { side: 'bottom', hardness: 'fallback' }],
        firstSegmentDirection: 'vertical-first',
        exitBufferPx: 12,
        entryBufferPx: 12,
        elbowYPolicy: 'matchTargetConnectionY',
    },
    // ── Double elbow ──────────────────────────────────────────────────────────
    // DEH — mid-skew: elbow lands at midpoint between source and target Y
    DEH: {
        scenarioKey: 'DEH',
        sourcePortPriority: [{ side: 'right', hardness: 'preferred' }, { side: 'bottom', hardness: 'fallback' }],
        targetPortPriority: [{ side: 'left', hardness: 'preferred' }, { side: 'top', hardness: 'fallback' }],
        firstSegmentDirection: 'horizontal-first',
        exitBufferPx: 12,
        entryBufferPx: 12,
        elbowYPolicy: 'midpointY',
    },
    // DEN — near-exit: elbow stays at source connection Y (exits horizontally, turns close to source)
    DEN: {
        scenarioKey: 'DEN',
        sourcePortPriority: [{ side: 'right', hardness: 'preferred' }],
        targetPortPriority: [{ side: 'left', hardness: 'preferred' }],
        firstSegmentDirection: 'horizontal-first',
        exitBufferPx: 12,
        entryBufferPx: 12,
        elbowYPolicy: 'matchSourceConnectionY',
    },
    // DEF — far-exit: elbow drops to target connection Y (travels far before turning)
    DEF: {
        scenarioKey: 'DEF',
        sourcePortPriority: [{ side: 'right', hardness: 'preferred' }],
        targetPortPriority: [{ side: 'left', hardness: 'preferred' }],
        firstSegmentDirection: 'horizontal-first',
        exitBufferPx: 12,
        entryBufferPx: 12,
        elbowYPolicy: 'matchTargetConnectionY',
    },
    // DEV — vertical Z: exits bottom, bridges horizontally, enters from top
    DEV: {
        scenarioKey: 'DEV',
        sourcePortPriority: [{ side: 'bottom', hardness: 'preferred' }],
        targetPortPriority: [{ side: 'top', hardness: 'preferred' }, { side: 'left', hardness: 'fallback' }],
        firstSegmentDirection: 'vertical-first',
        exitBufferPx: 12,
        entryBufferPx: 12,
        elbowYPolicy: 'midpointY',
    },
    // DBL — bottom-to-left: exits bottom, travels to horizontal corridor, enters from left
    DBL: {
        scenarioKey: 'DBL',
        sourcePortPriority: [{ side: 'bottom', hardness: 'preferred' }],
        targetPortPriority: [{ side: 'left', hardness: 'preferred' }],
        firstSegmentDirection: 'vertical-first',
        exitBufferPx: 12,
        entryBufferPx: 12,
        elbowYPolicy: 'midpointY',
        geometryModePreference: ['cross-down-b_to_l-buffer-rail-rise'],
    },
    // ── Triple elbow (loopback / feedback) ───────────────────────────────────
    // TEH — horizontal U-turn over the top or under the bottom of the same lane
    TEH: {
        scenarioKey: 'TEH',
        sourcePortPriority: [{ side: 'top', hardness: 'locked' }],
        targetPortPriority: [{ side: 'top', hardness: 'locked' }],
        firstSegmentDirection: 'vertical-first',
        exitBufferPx: 20,
        entryBufferPx: 20,
        elbowYPolicy: 'midpointY',
    },
    // TEV — vertical U-turn around the right side
    TEV: {
        scenarioKey: 'TEV',
        sourcePortPriority: [{ side: 'bottom', hardness: 'locked' }],
        targetPortPriority: [{ side: 'bottom', hardness: 'locked' }],
        firstSegmentDirection: 'vertical-first',
        exitBufferPx: 20,
        entryBufferPx: 20,
        elbowYPolicy: 'midpointY',
    },
    // ── Special ───────────────────────────────────────────────────────────────
    SLP: {
        scenarioKey: 'SLP',
        sourcePortPriority: [{ side: 'bottom', hardness: 'preferred' }],
        targetPortPriority: [{ side: 'bottom', hardness: 'preferred' }],
        firstSegmentDirection: 'vertical-first',
        exitBufferPx: 20,
        entryBufferPx: 20,
        elbowYPolicy: 'midpointY',
    },
    POH: {
        scenarioKey: 'POH',
        sourcePortPriority: [{ side: 'right', hardness: 'preferred' }],
        targetPortPriority: [{ side: 'left', hardness: 'preferred' }],
        firstSegmentDirection: 'horizontal-first',
        exitBufferPx: 12,
        entryBufferPx: 12,
        elbowYPolicy: 'channelY',
    },
    POV: {
        scenarioKey: 'POV',
        sourcePortPriority: [{ side: 'bottom', hardness: 'preferred' }],
        targetPortPriority: [{ side: 'top', hardness: 'preferred' }],
        firstSegmentDirection: 'vertical-first',
        exitBufferPx: 12,
        entryBufferPx: 12,
        elbowYPolicy: 'channelY',
    },
    // AOT falls back to engine defaults — not directly controllable via rules table
    AOT: {
        scenarioKey: 'AOT',
        sourcePortPriority: [{ side: 'right', hardness: 'preferred' }, { side: 'bottom', hardness: 'fallback' }],
        targetPortPriority: [{ side: 'left', hardness: 'preferred' }, { side: 'top', hardness: 'fallback' }],
        firstSegmentDirection: 'horizontal-first',
        exitBufferPx: 12,
        entryBufferPx: 12,
        elbowYPolicy: 'midpointY',
    },
};
/**
 * Returns the PortAssignmentRule for a given routing type code.
 * Returns null for codes that should not override engine defaults (AOT).
 */
export function codeToPortRule(code) {
    if (code === 'AOT')
        return null;
    return ROUTING_TYPE_PORT_RULES[code] ?? null;
}
