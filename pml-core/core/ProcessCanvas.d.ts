import React from 'react';
import { LayoutResult } from './processLayout/layoutTypes';
import { ProcessThemeSchema } from './styling/styleSchema';
import { ConnectorStyle } from './rendering/buildNodeRenderModels';
interface ProcessCanvasProps {
    layoutResult: LayoutResult;
    zoom: number;
    panX: number;
    panY: number;
    viewportWidth: number;
    viewportHeight: number;
    theme?: ProcessThemeSchema;
    interactionMode?: 'select' | 'pan';
    onZoomRequest?: (delta: number, anchor: {
        x: number;
        y: number;
    }) => void;
    onPanRequest?: (dx: number, dy: number) => void;
    selectedElement?: {
        type: 'node' | 'edge' | 'lane';
        id: string;
    } | null;
    onElementSelect?: (type: 'node' | 'edge' | 'lane', id: string) => void;
    showLanes?: boolean;
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
export default function ProcessCanvas({ layoutResult, zoom, panX, panY, viewportWidth, viewportHeight, theme, interactionMode, onZoomRequest, onPanRequest, selectedElement, onElementSelect, showLanes, viewAsActor, flowVisibility, connectorStyle, curtainsOn, }: ProcessCanvasProps): React.JSX.Element;
export {};
//# sourceMappingURL=ProcessCanvas.d.ts.map