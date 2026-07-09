'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { PanelRight, Rows3, SlidersHorizontal, GitBranch } from 'lucide-react';
export const EnhancementControlRail = ({ laneViewMode, modelSpacing, connectorStyle, propertiesPaneOn, onSetLaneViewMode, onSetModelSpacing, onSetConnectorStyle, onTogglePropertiesPane, }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [menu, setMenu] = useState(null);
    if (collapsed) {
        return (_jsx("button", { title: "Show enhancement controls", onClick: () => setCollapsed(false), style: {
                position: 'absolute',
                right: 12,
                bottom: 16,
                width: 30,
                height: 30,
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                background: '#FFFFFF',
                color: '#475569',
                zIndex: 35,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            }, children: '<' }));
    }
    return (_jsxs("div", { style: {
            position: 'absolute',
            right: 12,
            bottom: 16,
            zIndex: 35,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: 4,
            border: '1px solid #CBD5E1',
            borderRadius: 10,
            background: '#FFFFFF',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        }, children: [_jsx("button", { title: "Hide enhancement controls", onClick: () => {
                    setMenu(null);
                    setCollapsed(true);
                }, style: iconBtnStyle(false), children: '>' }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx("button", { title: "Lanes", onClick: () => setMenu((prev) => (prev === 'lanes' ? null : 'lanes')), style: iconBtnStyle(menu === 'lanes'), children: _jsx(Rows3, { size: 14 }) }), menu === 'lanes' && (_jsxs("div", { style: menuStyle, children: [_jsx(MenuItem, { active: laneViewMode === 'swimlane', onClick: () => { onSetLaneViewMode('swimlane'); setMenu(null); }, children: "Swimlane" }), _jsx(MenuItem, { active: laneViewMode === 'none', onClick: () => { onSetLaneViewMode('none'); setMenu(null); }, children: "None" }), _jsx(MenuItem, { active: laneViewMode === 'by-app', onClick: () => { onSetLaneViewMode('by-app'); setMenu(null); }, children: "By App" })] }))] }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx("button", { title: "Layout", onClick: () => setMenu((prev) => (prev === 'layout' ? null : 'layout')), style: iconBtnStyle(menu === 'layout'), children: _jsx(SlidersHorizontal, { size: 14 }) }), menu === 'layout' && (_jsxs("div", { style: menuStyle, children: [_jsx(MenuItem, { active: modelSpacing === 'Natural', onClick: () => onSetModelSpacing('Natural'), children: "Spacious" }), _jsx(MenuItem, { active: modelSpacing === 'Compact', onClick: () => onSetModelSpacing('Compact'), children: "Compact" })] }))] }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx("button", { title: "Connector Style", onClick: () => setMenu((prev) => (prev === 'connectors' ? null : 'connectors')), style: iconBtnStyle(menu === 'connectors'), children: _jsx(GitBranch, { size: 14 }) }), menu === 'connectors' && (_jsxs("div", { style: menuStyle, children: [_jsx(MenuItem, { active: connectorStyle === 'uniform', onClick: () => { onSetConnectorStyle('uniform'); setMenu(null); }, children: "Uniform" }), _jsx(MenuItem, { active: connectorStyle === 'keyFlow', onClick: () => { onSetConnectorStyle('keyFlow'); setMenu(null); }, children: "Key Flow" }), _jsx(MenuItem, { active: connectorStyle === 'flowTypes', onClick: () => { onSetConnectorStyle('flowTypes'); setMenu(null); }, children: "Colored" })] }))] }), _jsx("button", { title: "Properties Pane", onClick: onTogglePropertiesPane, style: iconBtnStyle(propertiesPaneOn), children: _jsx(PanelRight, { size: 14 }) })] }));
};
const menuStyle = {
    position: 'absolute',
    right: 0,
    bottom: 34,
    minWidth: 120,
    border: '1px solid #CBD5E1',
    borderRadius: 8,
    background: '#FFFFFF',
    boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
    padding: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
};
const MenuItem = ({ active, onClick, children, }) => (_jsx("button", { onClick: onClick, style: {
        textAlign: 'left',
        padding: '6px 8px',
        border: 'none',
        borderRadius: 6,
        background: active ? '#EEF2FF' : 'transparent',
        color: active ? '#4338CA' : '#334155',
        fontSize: 12,
        cursor: 'pointer',
    }, children: children }));
function iconBtnStyle(active) {
    return {
        width: 28,
        height: 28,
        border: 'none',
        borderRadius: 7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? '#EEF2FF' : 'transparent',
        color: active ? '#4338CA' : '#64748B',
        cursor: 'pointer',
    };
}
