'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ArrowLeft, BookOpen, Settings, Palette, GitBranch, Map, ExternalLink } from 'lucide-react';
import { LayoutRulesPanel } from './LayoutRulesPanel';
import { ThemePanel } from './ThemePanel';
import { PatternTablePanel } from './PatternTablePanel';
import { RoutingTypesPanel } from './RoutingTypesPanel';
import { RoutingRulesPanel } from './RoutingRulesPanel';
const TABS = [
    { id: 'routing-types', label: 'Types', icon: _jsx(BookOpen, { size: 14 }), group: 'Reference' },
    { id: 'routing-rules', label: 'Rules', icon: _jsx(Map, { size: 14 }), group: 'Reference' },
    { id: 'patterns', label: 'Patterns', icon: _jsx(GitBranch, { size: 14 }), group: 'Routing' },
    { id: 'layout', label: 'Layout', icon: _jsx(Settings, { size: 14 }), group: 'Config' },
    { id: 'theme', label: 'Theme', icon: _jsx(Palette, { size: 14 }), group: 'Config' },
];
export const AdminView = ({ controller, patternTableController, routingRulesController, state, onBack }) => {
    const [activeTab, setActiveTab] = useState('theme');
    const openInNewWindow = () => {
        window.open('/admin', '_blank', 'noopener,noreferrer');
    };
    const groups = Array.from(new Set(TABS.map(t => t.group)));
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden', background: '#F9FAFB' }, children: [_jsxs("header", { style: { display: 'flex', alignItems: 'center', height: 44, flexShrink: 0, background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 16px', gap: 10 }, children: [_jsxs("button", { onClick: onBack, style: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 5 }, onMouseEnter: e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#111827'; }, onMouseLeave: e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6B7280'; }, children: [_jsx(ArrowLeft, { size: 14 }), "Back"] }), _jsx("div", { style: { width: 1, height: 18, background: '#E5E7EB' } }), _jsx("div", { children: _jsx("span", { style: { fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }, children: "Configuration" }) }), state.layoutResult && (_jsxs("div", { style: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#059669' }, children: [_jsx("span", { style: { width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' } }), "Live"] })), _jsxs("button", { onClick: openInNewWindow, title: "Open admin in a new window", style: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6366F1', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }, onMouseEnter: e => { e.currentTarget.style.background = '#E0E7FF'; e.currentTarget.style.borderColor = '#A5B4FC'; }, onMouseLeave: e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.borderColor = '#C7D2FE'; }, children: [_jsx(ExternalLink, { size: 12 }), "New Window"] })] }), _jsxs("div", { style: { display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }, children: [_jsxs("nav", { style: { width: 180, flexShrink: 0, background: '#fff', borderRight: '1px solid #E5E7EB', padding: '8px 0', overflowY: 'auto' }, children: [groups.map(group => (_jsxs("div", { style: { marginBottom: 8 }, children: [_jsx("div", { style: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', padding: '4px 12px 4px' }, children: group }), TABS.filter(t => t.group === group).map(tab => (_jsxs("button", { onClick: () => setActiveTab(tab.id), style: {
                                            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', width: '100%',
                                            background: activeTab === tab.id ? '#EEF2FF' : 'none',
                                            border: 'none', borderLeft: activeTab === tab.id ? '2px solid #6366F1' : '2px solid transparent',
                                            cursor: 'pointer', textAlign: 'left', fontSize: 12, fontWeight: activeTab === tab.id ? 600 : 400,
                                            color: activeTab === tab.id ? '#4338CA' : '#374151',
                                        }, onMouseEnter: e => { if (activeTab !== tab.id)
                                            e.currentTarget.style.background = '#F9FAFB'; }, onMouseLeave: e => { if (activeTab !== tab.id)
                                            e.currentTarget.style.background = 'none'; }, children: [_jsx("span", { style: { color: activeTab === tab.id ? '#6366F1' : '#9CA3AF', flexShrink: 0 }, children: tab.icon }), tab.label] }, tab.id)))] }, group))), _jsxs("div", { style: { marginTop: 12, padding: '10px 12px', borderTop: '1px solid #F3F4F6' }, children: [_jsx("div", { style: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#D1D5DB', marginBottom: 6 }, children: "Session" }), _jsx(OverrideStat, { label: "Layout", count: Object.keys(state.layoutSettingsOverrides).length, onReset: () => controller.updateLayoutSettings({}) }), _jsx(OverrideStat, { label: "Theme", count: Object.keys(state.themeOverrides).length, onReset: () => controller.updateThemeOverrides({}) })] })] }), _jsxs("main", { style: { flex: 1, minWidth: 0, overflowY: 'auto', padding: '20px 28px' }, children: [activeTab === 'routing-types' && (_jsx(RoutingTypesPanel, { layoutResult: state.layoutResult })), activeTab === 'routing-rules' && (_jsx(RoutingRulesPanel, { controller: routingRulesController, rules: state.routingRules })), activeTab === 'patterns' && (_jsx(PatternTablePanel, { controller: patternTableController, table: state.patternTable })), activeTab === 'layout' && (_jsx(LayoutRulesPanel, { overrides: state.layoutSettingsOverrides, onChange: o => controller.updateLayoutSettings(o) })), activeTab === 'theme' && (_jsx(ThemePanel, { overrides: state.themeOverrides, onChange: o => controller.updateThemeOverrides(o) }))] })] })] }));
};
// Count total modified keys across nested overrides
function flattenKeys(obj, prefix = '') {
    if (typeof obj !== 'object' || obj === null)
        return prefix ? { [prefix]: true } : {};
    let keys = {};
    for (const k of Object.keys(obj)) {
        const nested = flattenKeys(obj[k], prefix ? `${prefix}.${k}` : k);
        keys = { ...keys, ...nested };
    }
    return keys;
}
const OverrideStat = ({ label, count, onReset }) => (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, padding: '2px 0' }, children: [_jsx("span", { style: { fontSize: 11, color: '#6B7280' }, children: label }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx("span", { style: {
                        fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 9,
                        background: count > 0 ? '#EEF2FF' : '#F3F4F6',
                        color: count > 0 ? '#6366F1' : '#D1D5DB',
                    }, children: count }), count > 0 && (_jsx("button", { onClick: onReset, style: { fontSize: 10, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }, children: "reset" }))] })] }));
