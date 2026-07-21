import { WorkspaceState, SelectedElement } from '../../types';
/**
 * What kind of themeable thing is currently selected in the preview canvas,
 * and which theme sub-tree edits it. Resolved from the clicked element id +
 * the preview's own graph/layout data — no new selection concept, just a
 * classifier over what ProcessCanvasView's onSelect already reports.
 */
export type ThemeSelectionTarget = {
    kind: 'node';
    id: string;
    elementStyleKey: string;
    label: string;
} | {
    kind: 'lane';
    id: string;
    label: string;
} | {
    kind: 'edge';
    id: string;
    variant: 'default' | 'crossLane' | 'loopback';
    label: string;
} | {
    kind: 'curtain';
    side: 'inbound' | 'outbound';
    label: string;
};
export declare function resolveThemeSelectionTarget(type: SelectedElement['type'], id: string, state: WorkspaceState): ThemeSelectionTarget | null;
//# sourceMappingURL=themeSelectionTarget.d.ts.map