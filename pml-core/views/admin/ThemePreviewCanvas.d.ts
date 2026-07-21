import React from 'react';
import { WorkspaceState, SelectedElement } from '../../types';
/**
 * Live preview canvas for the admin Theme panel — a small, fixed sample
 * model (THEME_PREVIEW_PML) rendered through the same ProcessCanvasView the
 * real workspace uses, so the preview can never drift from what a real
 * document actually looks like. Owns a dedicated ProcessController (kept
 * out of the admin page's own controller, which has no document loaded) and
 * just mirrors whatever theme `overrides` ThemePanel currently holds into
 * it — theme changes are pure re-render (no relayout), so this updates on
 * every keystroke/drag with no debouncing needed.
 */
export interface ThemePreviewCanvasProps {
    overrides: Record<string, any>;
    /** Fired when the user clicks a node/lane/edge in the preview, so the host
     *  panel can scroll/expand the matching form section. */
    onSelectElement?: (type: SelectedElement['type'], id: string) => void;
    /** Fired on every state update — lets the host resolve a click into a
     *  ThemeSelectionTarget (needs layoutResult/graphEdges to know a node's
     *  type/direction, a lane's label, an edge's loop/cross-lane-ness). */
    onStateChange?: (state: WorkspaceState) => void;
}
export declare const ThemePreviewCanvas: React.FC<ThemePreviewCanvasProps>;
//# sourceMappingURL=ThemePreviewCanvas.d.ts.map