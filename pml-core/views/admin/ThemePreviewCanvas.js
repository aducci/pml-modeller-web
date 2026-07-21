'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { ProcessController } from '../../controllers/ProcessController';
import { ProcessCanvasView } from '../ProcessCanvasView';
import { THEME_PREVIEW_PML } from '../../core/styling/themePreviewModel';
export const ThemePreviewCanvas = ({ overrides, onSelectElement }) => {
    const controllerRef = useRef();
    if (!controllerRef.current) {
        controllerRef.current = new ProcessController(THEME_PREVIEW_PML);
    }
    const controller = controllerRef.current;
    const [state, setState] = useState(null);
    useEffect(() => controller.subscribe(setState), [controller]);
    // Push the admin panel's live overrides into this dedicated controller
    // every time they change — this is the only thing that ever changes here;
    // the underlying document (THEME_PREVIEW_PML) is fixed for the session.
    useEffect(() => {
        controller.updateThemeOverrides(overrides);
    }, [controller, overrides]);
    if (!state)
        return null;
    return (_jsx(ProcessCanvasView, { state: state, onZoom: (z) => controller.setZoom(z), onPan: (dx, dy) => controller.pan(dx, dy), onSelect: (type, id) => {
            controller.selectElement(type, id);
            onSelectElement?.(type, id);
        }, onSetViewport: (zoom, panX, panY) => controller.setViewport(zoom, panX, panY), onResetView: () => controller.resetView(), curtainsOn: true }));
};
