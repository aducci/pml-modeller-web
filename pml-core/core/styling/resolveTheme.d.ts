/**
 * Single source of truth for turning theme `overrides` (as stored on
 * WorkspaceState.themeOverrides) into the actual ProcessThemeSchema used by
 * rendering — every consumer (the real workspace canvas, the admin theme
 * preview, and the admin panels themselves) must resolve it the same way,
 * or role colors would show in one place and not another.
 *
 * Resolution order: DEFAULT_PROCESS_THEME < role-derived colors < explicit
 * per-element overrides. `overrides.themeRoles` is read and stripped before
 * the final deepMerge so it never gets treated as a schema field itself —
 * it's a sibling key in the same object, not part of ProcessThemeSchema.
 */
export declare function resolveTheme(overrides: Record<string, any> | undefined | null): any;
//# sourceMappingURL=resolveTheme.d.ts.map