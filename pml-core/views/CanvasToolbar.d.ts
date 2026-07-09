import React from 'react';
import { InteractionMode } from './ProcessCanvasView';
interface CanvasToolbarProps {
    zoom: number;
    interactionMode: InteractionMode;
    onSetInteractionMode: (mode: InteractionMode) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    onFit: () => void;
    onExportSvg: () => void;
    showLanes?: boolean;
    onToggleLanes?: () => void;
    laneMode?: string;
    onToggleLaneMode?: () => void;
}
export declare const CanvasToolbar: React.FC<CanvasToolbarProps>;
export {};
//# sourceMappingURL=CanvasToolbar.d.ts.map