import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Download, MousePointer2, Hand, Eye, EyeOff } from 'lucide-react';
export const CanvasToolbar = ({ zoom, interactionMode, onSetInteractionMode, onZoomIn, onZoomOut, onReset, onFit, onExportSvg, showLanes = true, onToggleLanes, }) => {
    return (_jsxs("div", { style: {
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            padding: '3px 4px',
        }, children: [_jsx(ModeBtn, { active: interactionMode === 'select', onClick: () => onSetInteractionMode('select'), title: "Select mode (Space to toggle)", children: _jsx(MousePointer2, { size: 14 }) }), _jsx(ModeBtn, { active: interactionMode === 'pan', onClick: () => onSetInteractionMode('pan'), title: "Pan mode (Space to toggle)", children: _jsx(Hand, { size: 14 }) }), _jsx(Divider, {}), onToggleLanes !== undefined && (_jsx(ModeBtn, { active: showLanes, onClick: onToggleLanes, title: showLanes ? 'Hide swimlanes' : 'Show swimlanes', children: showLanes ? _jsx(Eye, { size: 14 }) : _jsx(EyeOff, { size: 14 }) })), _jsx(Divider, {}), _jsx(Btn, { onClick: onZoomOut, title: "Zoom out (\u2318 \u2212)", children: _jsx(ZoomOut, { size: 14 }) }), _jsxs("button", { onClick: onReset, title: "Reset zoom (\u2318 0)", style: {
                    padding: '2px 8px',
                    fontSize: 11,
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 500,
                    color: '#64748B',
                    background: 'none',
                    border: 'none',
                    borderRadius: 5,
                    cursor: 'pointer',
                    minWidth: 44,
                    textAlign: 'center',
                }, onMouseEnter: e => (e.currentTarget.style.background = '#F1F5F9'), onMouseLeave: e => (e.currentTarget.style.background = 'none'), children: [Math.round(zoom * 100), "%"] }), _jsx(Btn, { onClick: onZoomIn, title: "Zoom in (\u2318 +)", children: _jsx(ZoomIn, { size: 14 }) }), _jsx(Divider, {}), _jsx(Btn, { onClick: onFit, title: "Fit to view (\u2318 F)", children: _jsx(Maximize2, { size: 14 }) }), _jsx(Btn, { onClick: onReset, title: "Reset view (\u2318 0)", children: _jsx(RotateCcw, { size: 14 }) }), _jsx(Divider, {}), _jsx(Btn, { onClick: onExportSvg, title: "Copy SVG to clipboard", children: _jsx(Download, { size: 14 }) })] }));
};
const Btn = ({ onClick, title, children }) => (_jsx("button", { onClick: onClick, title: title, style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        padding: 0,
        border: 'none',
        background: 'none',
        borderRadius: 5,
        color: '#64748B',
        cursor: 'pointer',
    }, onMouseEnter: e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; }, onMouseLeave: e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748B'; }, children: children }));
const ModeBtn = ({ active, onClick, title, children }) => (_jsx("button", { onClick: onClick, title: title, style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        padding: 0,
        border: 'none',
        background: active ? '#EEF2FF' : 'none',
        borderRadius: 5,
        color: active ? '#6366F1' : '#94A3B8',
        cursor: 'pointer',
    }, onMouseEnter: e => { if (!active) {
        e.currentTarget.style.background = '#F1F5F9';
        e.currentTarget.style.color = '#1E293B';
    } }, onMouseLeave: e => { if (!active) {
        e.currentTarget.style.background = 'none';
        e.currentTarget.style.color = '#94A3B8';
    } }, children: children }));
const Divider = () => (_jsx("div", { style: { width: 1, height: 16, background: '#E2E8F0', margin: '0 2px' } }));
