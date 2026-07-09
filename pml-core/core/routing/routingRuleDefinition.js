/**
 * Routing Rule Definition + matching function
 *
 * A routing rule maps (sourceType × targetType × laneConfig) to a preferred
 * RoutingTypeCode plus ordered alternates with activation conditions.
 *
 * matchRoutingRule() is the single lookup entry point used by pathRouter.
 * Rules are evaluated highest-priority-first; first enabled match wins.
 * '*' matches any value in any dimension.
 */
// ---------------------------------------------------------------------------
// Default rule table
//
// These rules reflect what the engine's hardcoded portResolver registry
// already does. They are the starting point — admin can adjust from here.
// Priority order: higher number = evaluated first. Specific beats wildcard.
// ---------------------------------------------------------------------------
export const DEFAULT_ROUTING_RULES = [
    // ── Self-loop (handled by loopback geometry, not port rules) ──────────────
    {
        id: 'self-loop',
        label: 'Self Loop',
        description: 'Connection from a node back to itself.',
        enabled: true,
        priority: 100,
        match: { sourceType: '*', targetType: '*', laneConfig: 'self-loop' },
        primary: 'SLP',
        alternates: [],
    },
    // ── Loopback / backward feedback ─────────────────────────────────────────
    {
        id: 'loopback',
        label: 'Loopback',
        description: 'Backward cycle — exits and enters from the top of the lane.',
        enabled: true,
        priority: 90,
        match: { sourceType: '*', targetType: '*', laneConfig: 'loopback' },
        primary: 'TEH',
        alternates: [
            { type: 'TEV', condition: 'path-blocked', priority: 1, note: 'Bottom U-turn if top corridor is blocked.' },
        ],
    },
    // ── Cross-lane downward ───────────────────────────────────────────────────
    // Boundary/relay events exit from the bottom — DBL is what the engine does.
    {
        id: 'cross-down-event',
        label: 'Cross-Lane Down — Event',
        description: 'Boundary or relay event exiting downward (bottom port → left entry).',
        enabled: true,
        priority: 75,
        match: { sourceType: 'event', targetType: '*', laneConfig: 'cross-lane-downward' },
        primary: 'DBL',
        alternates: [
            { type: 'DEH', condition: 'path-blocked', priority: 1 },
        ],
    },
    // Standard tasks/gateways going down — engine uses buffer-rail-rise (DEH).
    {
        id: 'cross-down-default',
        label: 'Cross-Lane Down — Default',
        description: 'Standard downward cross-lane flow via buffer-rail horizontal routing.',
        enabled: true,
        priority: 60,
        match: { sourceType: '*', targetType: '*', laneConfig: 'cross-lane-downward' },
        primary: 'DEH',
        alternates: [
            { type: 'DBL', condition: 'path-blocked', priority: 1, note: 'Exit bottom if right side is obstructed.' },
            { type: 'DEV', condition: 'compact-mode', priority: 2 },
        ],
    },
    // ── Cross-lane upward ─────────────────────────────────────────────────────
    // Engine uses buffer-rail-drop with matchTargetConnectionY = DEF skew.
    {
        id: 'cross-up-default',
        label: 'Cross-Lane Up — Default',
        description: 'Forward flow to a physically higher lane via buffer-rail drop.',
        enabled: true,
        priority: 65,
        match: { sourceType: '*', targetType: '*', laneConfig: 'cross-lane-upward' },
        primary: 'DEF',
        alternates: [
            { type: 'DEH', condition: 'compact-mode', priority: 1 },
            { type: 'DBL', condition: 'path-blocked', priority: 2 },
        ],
    },
    // ── Same-lane ─────────────────────────────────────────────────────────────
    // Events to tasks — engine uses same-lane-elbow = SEH.
    {
        id: 'same-lane-event',
        label: 'Same-Lane — Event',
        description: 'Start or intermediate event flowing to a task in the same lane.',
        enabled: true,
        priority: 55,
        match: { sourceType: 'event', targetType: '*', laneConfig: 'same-lane' },
        primary: 'SEH',
        alternates: [
            { type: 'STH', condition: 'compact-mode', priority: 1 },
            { type: 'DEH', condition: 'path-blocked', priority: 2 },
        ],
    },
    // General same-lane — engine uses same-lane-elbow or same-lane-straight = SEH/STH.
    {
        id: 'same-lane-default',
        label: 'Same-Lane — Default',
        description: 'Standard same-lane flow. Elbow when nodes are vertically offset; straight when aligned.',
        enabled: true,
        priority: 40,
        match: { sourceType: '*', targetType: '*', laneConfig: 'same-lane' },
        primary: 'SEH',
        alternates: [
            { type: 'STH', condition: 'compact-mode', priority: 1 },
            { type: 'DEH', condition: 'path-blocked', priority: 2 },
        ],
    },
];
// ---------------------------------------------------------------------------
// matchRoutingRule — single lookup entry point for pathRouter
//
// Returns the matched rule's primary RoutingTypeCode, or null if no enabled
// rule matches (engine falls through to its hardcoded portResolver registry).
// ---------------------------------------------------------------------------
export function matchRoutingRule(rules, ctx) {
    const sorted = rules
        .filter(r => r.enabled)
        .sort((a, b) => b.priority - a.priority);
    for (const rule of sorted) {
        const m = rule.match;
        if ((m.sourceType === '*' || m.sourceType === ctx.sourceType) &&
            (m.targetType === '*' || m.targetType === ctx.targetType) &&
            (m.laneConfig === '*' || m.laneConfig === ctx.laneConfig)) {
            return rule;
        }
    }
    return null;
}
