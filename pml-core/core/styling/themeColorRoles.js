/** Matches DEFAULT_PROCESS_THEME's own "Blueprint Minimal" palette — picking
 *  these as the role defaults means "no roles set yet" renders identically
 *  to today, before any role customization. */
export const DEFAULT_THEME_COLOR_ROLES = {
    primary: '#378ADD',
    surface: '#F1EFE8',
    border: '#888780',
    text: '#2C2C2A',
    warning: '#BA7517',
};
/**
 * Expands a set of role colors into the individual schema fields they feed.
 * Deliberately only touches "default" appearance — the `event`/`subprocess`
 * accent-blue look and gateway's distinct gray are visually intentional
 * (see defaultProcessTheme.ts's own comments), so only `task`/`unknown`
 * fill from `surface` directly; event/gateway/subprocess still derive their
 * stroke/label from primary/text/border since those roles are generic
 * enough to apply everywhere, while fill stays per-type by default.
 */
export function deriveThemeFromRoles(roles) {
    return {
        elementStyles: {
            task: { appearance: { fill: roles.surface, stroke: roles.border, label: roles.text } },
            unknown: { appearance: { fill: roles.surface, stroke: roles.border, label: roles.text } },
            event: { appearance: { stroke: roles.primary, label: roles.text }, interaction: { selectedStroke: roles.primary } },
            subprocess: { appearance: { stroke: roles.primary, label: roles.text }, interaction: { selectedStroke: roles.primary } },
            decision: { appearance: { stroke: roles.border, label: roles.text }, interaction: { selectedStroke: roles.primary } },
            gateway: { appearance: { stroke: roles.border, label: roles.text }, interaction: { selectedStroke: roles.primary } },
        },
        edges: {
            default: { stroke: roles.border },
            crossLane: { stroke: roles.border },
            loopback: { stroke: roles.warning },
            // message deliberately NOT derived from a role — it's a fixed accent
            // (see defaultProcessTheme.ts) so a message-flow edge stays visually
            // recognizable as "the cross-actor communication color" regardless of
            // how a user tunes the 5 generic roles; still fully editable directly
            // via ThemeContextualPanel's per-edge-kind fields if they want to
            // change it.
            selected: { stroke: roles.primary },
            marker: { fill: roles.border },
            label: { fill: roles.text },
        },
        lanes: {
            borderColor: roles.border,
            labelColor: roles.text,
            selectedBorderColor: roles.primary,
            headerSelectedColor: roles.primary,
        },
    };
}
