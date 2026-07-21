import React from 'react';
import { ThemeSelectionTarget } from './themeSelectionTarget';
interface Props {
    target: ThemeSelectionTarget | null;
    overrides: Record<string, any>;
    onChange: (overrides: Record<string, any>) => void;
}
/**
 * The right-hand half of the Theme tab's split view — shows only the
 * properties of whatever was last clicked in the live preview (a node,
 * lane, edge, or boundary curtain), instead of a single flat form covering
 * every element at once. Typography sizes for non-node-label text, canvas
 * spacing tokens, and edge-label placement/sizing are NOT here — those
 * don't correspond to a single clickable element, and live in the
 * "Advanced Style" tab instead.
 */
export declare const ThemeContextualPanel: React.FC<Props>;
export {};
//# sourceMappingURL=ThemeContextualPanel.d.ts.map