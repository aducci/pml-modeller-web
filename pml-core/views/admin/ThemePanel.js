'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState } from 'react';
import { DEFAULT_PROCESS_THEME } from '../../core/styling/defaultProcessTheme';
import { ResetBtn } from './controls';
import { ThemePreviewCanvas } from './ThemePreviewCanvas';
import { ThemeContextualPanel } from './ThemeContextualPanel';
import { resolveThemeSelectionTarget } from './themeSelectionTarget';
/**
 * Theme tab — a live preview on the left, and a right-hand editor scoped to
 * whatever was last clicked in that preview (node / lane / edge / boundary
 * curtain), instead of one long flat form covering every element at once.
 * Settings with no single clickable element (edge-label placement/sizing,
 * canvas spacing tokens) live in the separate "Advanced Style" tab —
 * AdvancedStylePanel.tsx.
 */
export const ThemePanel = ({ overrides, onChange }) => {
    const [previewState, setPreviewState] = useState(null);
    const [selected, setSelected] = useState(null);
    const resetAll = () => onChange({});
    const handleSelectElement = useCallback((type, id) => {
        setSelected({ type, id });
    }, []);
    const target = selected && previewState ? resolveThemeSelectionTarget(selected.type, selected.id, previewState) : null;
    return (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 15, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }, children: "Theme & Appearance" }), _jsxs("div", { style: { fontSize: 12, color: '#6B7280', marginTop: 2 }, children: ["Editing: ", _jsx("span", { style: { fontWeight: 500, color: '#374151' }, children: DEFAULT_PROCESS_THEME.name }), " \u2014 session only"] })] }), _jsx(ResetBtn, { onClick: resetAll })] }), _jsxs("div", { style: { display: 'flex', gap: 16, height: 480 }, children: [_jsxs("div", { style: {
                            flex: '1 1 55%', minWidth: 0, borderRadius: 10, border: '1px solid #E5E7EB',
                            background: '#fff', overflow: 'hidden', position: 'relative',
                        }, children: [_jsx("div", { style: {
                                    position: 'absolute', top: 8, left: 10, zIndex: 5, fontSize: 10,
                                    fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em',
                                    pointerEvents: 'none',
                                }, children: "Click an element to style it" }), _jsx(ThemePreviewCanvas, { overrides: overrides, onSelectElement: handleSelectElement, onStateChange: setPreviewState })] }), _jsx("div", { style: {
                            flex: '1 1 45%', minWidth: 260, borderRadius: 10, border: '1px solid #E5E7EB',
                            background: '#fff', overflowY: 'auto',
                        }, children: _jsx(ThemeContextualPanel, { target: target, overrides: overrides, onChange: onChange }) })] })] }));
};
