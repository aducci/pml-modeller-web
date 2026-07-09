import React from 'react';
import { WorkspaceState, SelectedElement } from '../types';
import type { ConnectorStyle } from '../core/rendering/buildNodeRenderModels';
export type InteractionMode = 'select' | 'pan';
export interface ProcessCanvasViewProps {
    state: WorkspaceState;
    onZoom: (zoom: number) => void;
    onPan: (dx: number, dy: number) => void;
    onSetViewport: (zoom: number, panX: number, panY: number) => void;
    onSelect: (type: SelectedElement['type'], id: string) => void;
    onResetView: () => void;
    onToggleLanes?: () => void;
    onToggleLaneMode?: () => void;
    viewAsActor?: string | null;
    flowVisibility?: {
        main: boolean;
        alternate: boolean;
        exception: boolean;
        termination: boolean;
    };
    connectorStyle?: ConnectorStyle;
    curtainsOn?: boolean;
}
export declare const ProcessCanvasView: React.FC<ProcessCanvasViewProps>;
//# sourceMappingURL=ProcessCanvasView.d.ts.map