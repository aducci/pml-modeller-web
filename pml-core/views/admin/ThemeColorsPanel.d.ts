import React from 'react';
interface Props {
    overrides: Record<string, any>;
    onChange: (overrides: Record<string, any>) => void;
}
/**
 * "Theme Colors" — a handful of named color roles that everything else
 * defaults from (see themeColorRoles.ts). Changing a role recolors every
 * element currently at default; anything already customized individually
 * via ThemeContextualPanel keeps its own color (deepMerge in resolveTheme.ts
 * always lets explicit per-element overrides win over a role's derived
 * value — roles are a starting point, not a hard constraint).
 */
export declare const ThemeColorsPanel: React.FC<Props>;
export {};
//# sourceMappingURL=ThemeColorsPanel.d.ts.map