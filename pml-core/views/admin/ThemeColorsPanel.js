'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { ColorInput } from './controls';
import { DEFAULT_THEME_COLOR_ROLES } from '../../core/styling/themeColorRoles';
const ROLE_FIELDS = [
    { key: 'primary', label: 'Primary', hint: 'Accents & selection' },
    { key: 'surface', label: 'Surface', hint: 'Default node fill' },
    { key: 'border', label: 'Border', hint: 'Default strokes' },
    { key: 'text', label: 'Text', hint: 'Labels' },
    { key: 'warning', label: 'Warning', hint: 'Loopback / exception' },
];
/**
 * "Theme Colors" — a handful of named color roles that everything else
 * defaults from (see themeColorRoles.ts). Changing a role recolors every
 * element currently at default; anything already customized individually
 * via ThemeContextualPanel keeps its own color (deepMerge in resolveTheme.ts
 * always lets explicit per-element overrides win over a role's derived
 * value — roles are a starting point, not a hard constraint).
 */
export const ThemeColorsPanel = ({ overrides, onChange }) => {
    const roles = { ...DEFAULT_THEME_COLOR_ROLES, ...(overrides.themeRoles ?? {}) };
    const setRole = useCallback((key, value) => {
        onChange({ ...overrides, themeRoles: { ...roles, [key]: value } });
    }, [overrides, roles, onChange]);
    const resetRoles = useCallback(() => {
        const { themeRoles, ...rest } = overrides;
        onChange(rest);
    }, [overrides, onChange]);
    const hasCustomRoles = Object.keys(overrides.themeRoles ?? {}).length > 0;
    return (_jsxs("div", { style: {
            marginBottom: 16, padding: '12px 14px', borderRadius: 10,
            border: '1px solid #E5E7EB', background: '#FAFAFB',
        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 12, fontWeight: 700, color: '#374151' }, children: "Theme Colors" }), _jsx("div", { style: { fontSize: 11, color: '#9CA3AF', marginTop: 1 }, children: "Sets the default for every element \u2014 anything you've styled individually below keeps its own color." })] }), hasCustomRoles && (_jsxs("button", { onClick: resetRoles, title: "Reset theme colors to default", style: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9CA3AF', background: 'none', border: '1px solid #E5E7EB', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', flexShrink: 0 }, onMouseEnter: e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FCA5A5'; }, onMouseLeave: e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#E5E7EB'; }, children: [_jsx(RotateCcw, { size: 11 }), "Reset"] }))] }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '10px 20px' }, children: ROLE_FIELDS.map(({ key, label, hint }) => (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 4 }, children: [_jsx("div", { style: { fontSize: 11, fontWeight: 500, color: '#374151' }, children: label }), _jsx(ColorInput, { value: roles[key], onChange: v => setRole(key, v) }), _jsx("div", { style: { fontSize: 10, color: '#9CA3AF' }, children: hint })] }, key))) })] }));
};
