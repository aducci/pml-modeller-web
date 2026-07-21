/**
 * Theme Color Roles
 *
 * A small, named set of "core colors" (Primary, Surface, Border, Text,
 * Warning) that most of the schema's individual fill/stroke/label fields
 * default from — so changing one role recolors everything at default in
 * one step, instead of hand-editing a dozen individual hex fields.
 *
 * This is a DERIVATION layer, not a new persisted schema: `deriveThemeFromRoles`
 * produces a plain deep-partial ProcessThemeSchema patch (the same shape
 * ThemePanel's per-element `overrides` already use), which the caller
 * layers as `deepMerge(deepMerge(DEFAULT_PROCESS_THEME, roleTheme), overrides)`.
 * Because deepMerge only overwrites keys actually present in its second
 * argument, any field a user has explicitly set via the per-element
 * contextual editor (present in `overrides`) always wins over a role's
 * derived value — roles are a *starting point*, not a hard constraint.
 *
 * `themeRoles` values themselves are persisted as a sibling key inside the
 * same `themeOverrides` object ProcessController already stores/persists
 * (see ProcessController.updateThemeOverrides / core/sharedState.ts) — no
 * new persistence path, no schema migration.
 */
export interface ThemeColorRoles {
    /** Accents, selection highlights, primary interactive color. */
    primary: string;
    /** Default fill for ordinary nodes (task/subprocess/unknown). */
    surface: string;
    /** Default stroke/border color across nodes, lanes, default edges. */
    border: string;
    /** Default label/text color across nodes, lanes, edges. */
    text: string;
    /** Loopback/rework/exception accent color. */
    warning: string;
}
/** Matches DEFAULT_PROCESS_THEME's own "Blueprint Minimal" palette — picking
 *  these as the role defaults means "no roles set yet" renders identically
 *  to today, before any role customization. */
export declare const DEFAULT_THEME_COLOR_ROLES: ThemeColorRoles;
/**
 * Expands a set of role colors into the individual schema fields they feed.
 * Deliberately only touches "default" appearance — the `event`/`subprocess`
 * accent-blue look and gateway's distinct gray are visually intentional
 * (see defaultProcessTheme.ts's own comments), so only `task`/`unknown`
 * fill from `surface` directly; event/gateway/subprocess still derive their
 * stroke/label from primary/text/border since those roles are generic
 * enough to apply everywhere, while fill stays per-type by default.
 */
export declare function deriveThemeFromRoles(roles: ThemeColorRoles): Record<string, any>;
//# sourceMappingURL=themeColorRoles.d.ts.map