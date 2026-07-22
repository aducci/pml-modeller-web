'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback } from 'react';
import { MousePointerClick } from 'lucide-react';
import { resolveTheme } from '../../core/styling/resolveTheme';
import { Field, ColorInput, Num, Select, Toggle } from './controls';
import { DEFAULT_THEME_COLOR_ROLES } from '../../core/styling/themeColorRoles';
const DASH_OPTIONS = [
    { value: '', label: 'Solid' },
    { value: '4 3', label: 'Dashed (fine)' },
    { value: '7 4', label: 'Dashed' },
    { value: '2 4', label: 'Dotted' },
];
const ROLE_ORDER = ['primary', 'surface', 'border', 'text', 'warning'];
const ROLE_LABEL = {
    primary: 'Primary', surface: 'Surface', border: 'Border', text: 'Text', warning: 'Warning',
};
function setPath(obj, path, value) {
    if (path.length === 0)
        return value;
    const [head, ...tail] = path;
    return { ...obj, [head]: setPath(obj[head] ?? {}, tail, value) };
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
export const ThemeContextualPanel = ({ target, overrides, onChange }) => {
    const theme = React.useMemo(() => resolveTheme(overrides), [overrides]);
    const roles = { ...DEFAULT_THEME_COLOR_ROLES, ...(overrides.themeRoles ?? {}) };
    const set_ = useCallback((path, value) => {
        onChange(setPath(overrides, path, value));
    }, [overrides, onChange]);
    if (!target) {
        return (_jsxs("div", { style: {
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: '100%', color: '#9CA3AF', textAlign: 'center', padding: 24, gap: 8,
            }, children: [_jsx(MousePointerClick, { size: 28, color: "#D1D5DB" }), _jsx("div", { style: { fontSize: 13, fontWeight: 500, color: '#6B7280' }, children: "Click an element to style it" }), _jsx("div", { style: { fontSize: 12, color: '#9CA3AF', maxWidth: 220 }, children: "Select any task, decision, lane, edge, or boundary event in the preview on the left." })] }));
    }
    return (_jsxs("div", { style: { padding: '4px 4px 0' }, children: [_jsx("div", { style: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 2 }, children: target.kind === 'node' ? 'Node' : target.kind === 'lane' ? 'Lane' : target.kind === 'edge' ? 'Edge' : 'Boundary' }), _jsx("div", { style: { fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }, children: target.label }), target.kind === 'node' && _jsx(NodeFields, { elementStyleKey: target.elementStyleKey, theme: theme, roles: roles, set_: set_ }), target.kind === 'lane' && _jsx(LaneFields, { theme: theme, roles: roles, set_: set_ }), target.kind === 'edge' && _jsx(EdgeFields, { variant: target.variant, theme: theme, roles: roles, set_: set_ }), target.kind === 'curtain' && _jsx(CurtainFields, { side: target.side, theme: theme, roles: roles, set_: set_ })] }));
};
// ---------------------------------------------------------------------------
// RoleColorField — a ColorInput plus a row of 5 small theme-color swatches.
// Clicking a swatch is a one-time "set this field to that role's current
// color" action (same effect as typing the hex directly) — it does not
// create a live link back to the role, unlike a field left at its true
// default (see resolveTheme.ts: only fields with NO explicit override still
// track a role's color as it's changed later).
// ---------------------------------------------------------------------------
const RoleColorField = ({ label, hint, value, roles, onChange }) => (_jsx(Field, { label: label, hint: hint, reverseLayout: true, children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 4 }, children: [_jsx(ColorInput, { value: value, onChange: onChange }), _jsx("div", { style: { display: 'flex', gap: 4 }, children: ROLE_ORDER.map((key) => (_jsx("button", { onClick: () => onChange(roles[key]), title: `Use theme color: ${ROLE_LABEL[key]}`, style: {
                        width: 14, height: 14, borderRadius: '50%', padding: 0, cursor: 'pointer',
                        background: roles[key], border: value === roles[key] ? '2px solid #6366F1' : '1px solid #D1D5DB',
                        flexShrink: 0,
                    } }, key))) })] }) }));
// ---------------------------------------------------------------------------
const NodeFields = ({ elementStyleKey, theme, roles, set_ }) => {
    const appearance = theme.elementStyles[elementStyleKey]?.appearance ?? {};
    const text = theme.elementStyles[elementStyleKey]?.text ?? {};
    const path = (...tail) => ['elementStyles', elementStyleKey, ...tail];
    return (_jsxs("div", { style: { display: 'grid', gap: 2 }, children: [_jsx(RoleColorField, { label: "Fill", value: appearance.fill ?? '#E6F1FB', roles: roles, onChange: v => set_(path('appearance', 'fill'), v) }), _jsx(RoleColorField, { label: "Border", value: appearance.stroke ?? '#94A3B8', roles: roles, onChange: v => set_(path('appearance', 'stroke'), v) }), _jsx(Field, { label: "Border width", children: _jsx(Num, { value: appearance.strokeWidth ?? 1, onChange: v => set_(path('appearance', 'strokeWidth'), v), min: 0, max: 6, step: 0.5, unit: "px", width: 56 }) }), _jsx(RoleColorField, { label: "Label color", value: appearance.label ?? '#111827', roles: roles, onChange: v => set_(path('appearance', 'label'), v) }), _jsx(Field, { label: "Font size", children: _jsx(Num, { value: text.fontSizePx ?? 11, onChange: v => set_(path('text', 'fontSizePx'), v), min: 6, max: 24, unit: "px", width: 56 }) }), _jsxs("div", { style: { marginTop: 14, paddingTop: 10, borderTop: '1px solid #F1F0ED' }, children: [_jsxs("div", { style: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', marginBottom: 4 }, children: ["All nodes (not just ", elementStyleKey, ")"] }), _jsx(Field, { label: "Drop shadow", children: _jsx(Toggle, { value: theme.nodeEffects?.shadow ?? true, onChange: v => set_(['nodeEffects', 'shadow'], v) }) }), _jsx(Field, { label: "Gradient shading", children: _jsx(Toggle, { value: theme.nodeEffects?.gradient ?? false, onChange: v => set_(['nodeEffects', 'gradient'], v) }) })] })] }));
};
const LaneFields = ({ theme, roles, set_ }) => {
    const lanes = theme.lanes;
    return (_jsxs("div", { style: { display: 'grid', gap: 2 }, children: [_jsx(RoleColorField, { label: "Body fill", value: lanes.bodyFill, roles: roles, onChange: v => set_(['lanes', 'bodyFill'], v) }), _jsx(RoleColorField, { label: "Header fill", value: lanes.headerFill, roles: roles, onChange: v => set_(['lanes', 'headerFill'], v) }), _jsx(RoleColorField, { label: "Border color", value: lanes.borderColor, roles: roles, onChange: v => set_(['lanes', 'borderColor'], v) }), _jsx(Field, { label: "Border width", children: _jsx(Num, { value: lanes.borderWidth, onChange: v => set_(['lanes', 'borderWidth'], v), min: 0.5, max: 4, step: 0.5, unit: "px", width: 56 }) }), _jsx(RoleColorField, { label: "Label color", value: lanes.labelColor, roles: roles, onChange: v => set_(['lanes', 'labelColor'], v) }), _jsx(Field, { label: "Header font size", children: _jsx(Num, { value: theme.typography?.laneHeader?.fontSizePx ?? 11, onChange: v => set_(['typography', 'laneHeader', 'fontSizePx'], v), min: 6, max: 24, unit: "px", width: 56 }) })] }));
};
const VARIANT_LABEL = { default: 'Same-lane flow', crossLane: 'Cross-lane flow', loopback: 'Loopback / rework flow' };
const EdgeFields = ({ variant, theme, roles, set_ }) => {
    const edgeStyle = theme.edges[variant] ?? theme.edges.default;
    const label = theme.edges.label ?? {};
    return (_jsxs("div", { style: { display: 'grid', gap: 2 }, children: [_jsxs("div", { style: { fontSize: 11, color: '#6B7280', marginBottom: 8 }, children: ["Styling ", _jsx("strong", { children: VARIANT_LABEL[variant] }), " edges \u2014 this edge's kind, based on its source/target and whether it loops back."] }), _jsx(RoleColorField, { label: "Stroke", value: edgeStyle.stroke, roles: roles, onChange: v => set_(['edges', variant, 'stroke'], v) }), _jsx(Field, { label: "Stroke width", children: _jsx(Num, { value: edgeStyle.strokeWidth ?? 1.5, onChange: v => set_(['edges', variant, 'strokeWidth'], v), min: 0.5, max: 5, step: 0.5, unit: "px", width: 56 }) }), _jsx(Field, { label: "Dash style", children: _jsx(Select, { value: edgeStyle.strokeDasharray ?? '', options: DASH_OPTIONS, onChange: v => set_(['edges', variant, 'strokeDasharray'], v) }) }), _jsx(RoleColorField, { label: "Arrowhead", value: theme.edges.marker?.fill ?? '#888780', roles: roles, onChange: v => set_(['edges', 'marker', 'fill'], v) }), _jsx(RoleColorField, { label: "Label color", value: label.fill ?? '#5F5E5A', roles: roles, onChange: v => set_(['edges', 'label', 'fill'], v) }), _jsx(Field, { label: "Label font size", children: _jsx(Num, { value: theme.typography?.edgeLabel?.fontSizePx ?? 10, onChange: v => set_(['typography', 'edgeLabel', 'fontSizePx'], v), min: 6, max: 20, unit: "px", width: 56 }) })] }));
};
const CurtainFields = ({ side, theme, roles, set_ }) => {
    const curtain = theme.curtains[side];
    return (_jsxs("div", { style: { display: 'grid', gap: 2 }, children: [_jsxs("div", { style: { fontSize: 11, color: '#6B7280', marginBottom: 8 }, children: ["Styling the ", side === 'inbound' ? 'inbound (entry)' : 'outbound (exit)', " boundary band."] }), _jsx(RoleColorField, { label: "Fill", value: curtain.fill, roles: roles, onChange: v => set_(['curtains', side, 'fill'], v) }), _jsx(Field, { label: "Fill opacity", children: _jsx(Num, { value: Math.round((curtain.fillOpacity ?? 1) * 100), onChange: v => set_(['curtains', side, 'fillOpacity'], Math.max(0, Math.min(100, v)) / 100), min: 0, max: 100, unit: "%", width: 56 }) }), _jsx(RoleColorField, { label: "Stroke", value: curtain.stroke, roles: roles, onChange: v => set_(['curtains', side, 'stroke'], v) }), _jsx(RoleColorField, { label: "Label color", value: curtain.labelColor, roles: roles, onChange: v => set_(['curtains', side, 'labelColor'], v) }), _jsx(Field, { label: "Label font size", children: _jsx(Num, { value: theme.typography?.curtainLabel?.fontSizePx ?? 10, onChange: v => set_(['typography', 'curtainLabel', 'fontSizePx'], v), min: 6, max: 20, unit: "px", width: 56 }) })] }));
};
