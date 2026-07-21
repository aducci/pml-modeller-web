import React from 'react';
interface Props {
    overrides: Record<string, any>;
    onChange: (overrides: Record<string, any>) => void;
}
/**
 * Theme settings that don't correspond to a single clickable canvas element
 * — spacing/sizing tokens and the per-routing-type edge-label placement
 * table — split out from the Theme tab's click-to-style editor
 * (ThemePanel.tsx) once that became fully contextual. Per-element font
 * sizes (node label, lane header, edge label, curtain label) moved to
 * ThemeContextualPanel instead of staying here, since those ARE scoped to
 * a clickable element.
 */
export declare const AdvancedStylePanel: React.FC<Props>;
export {};
//# sourceMappingURL=AdvancedStylePanel.d.ts.map