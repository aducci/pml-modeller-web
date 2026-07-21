import React from 'react';
interface Props {
    overrides: Record<string, any>;
    onChange: (overrides: Record<string, any>) => void;
}
/**
 * Theme tab — a live preview on the left, and a right-hand editor scoped to
 * whatever was last clicked in that preview (node / lane / edge / boundary
 * curtain), instead of one long flat form covering every element at once.
 * Settings with no single clickable element (edge-label placement/sizing,
 * canvas spacing tokens) live in the separate "Advanced Style" tab —
 * AdvancedStylePanel.tsx.
 */
export declare const ThemePanel: React.FC<Props>;
export {};
//# sourceMappingURL=ThemePanel.d.ts.map