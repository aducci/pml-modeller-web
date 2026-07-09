'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo } from 'react';
import { DEFAULT_PROCESS_THEME } from '../../core/styling/defaultProcessTheme';
import { Field, Section, Num, Slider, ColorInput, ResetBtn, Select } from './controls';
const NODE_TYPES = [
    ['task', 'Task'],
    ['event', 'Event'],
    ['gateway', 'Gateway / Decision'],
    ['subprocess', 'Subprocess'],
    ['parallel', 'Parallel gateway'],
];
const ANCHOR_OPTIONS = [
    { value: 'start', label: 'Start' },
    { value: 'mid', label: 'Mid' },
    { value: 'end', label: 'End' },
    { value: 'elbow-1', label: 'Elbow 1' },
    { value: 'elbow-2', label: 'Elbow 2' },
    { value: 'elbow-3', label: 'Elbow 3' },
];
const SIDE_OPTIONS = [
    { value: 'above', label: 'Above' },
    { value: 'center', label: 'Center' },
    { value: 'below', label: 'Below' },
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
];
const ROUTING_TYPES = [
    ['defaults', 'Defaults'],
    ['STH', 'Straight Horizontal'],
    ['STV', 'Straight Vertical'],
    ['SEH', 'Single Elbow H'],
    ['SEV', 'Single Elbow V'],
    ['DEH', 'Double Elbow H'],
    ['DEN', 'Double Elbow Near-Exit H'],
    ['DEF', 'Double Elbow Far-Exit H'],
    ['DEV', 'Double Elbow V'],
    ['DBL', 'Double Elbow Bottom→Left'],
    ['TEH', 'Triple Elbow H'],
    ['TEV', 'Triple Elbow V'],
    ['SLP', 'Self Loop'],
    ['POH', 'Parallel Offset H'],
    ['POV', 'Parallel Offset V'],
    ['AOT', 'Auto Orthogonal'],
];
function mergeDeep(base, overrides) {
    if (!overrides)
        return base;
    const result = { ...base };
    for (const key of Object.keys(overrides)) {
        if (typeof overrides[key] === 'object' && overrides[key] !== null && !Array.isArray(overrides[key]) && typeof base[key] === 'object') {
            result[key] = mergeDeep(base[key], overrides[key]);
        }
        else {
            result[key] = overrides[key];
        }
    }
    return result;
}
function setPath(obj, path, value) {
    if (path.length === 0)
        return value;
    const [head, ...tail] = path;
    return { ...obj, [head]: setPath(obj[head] ?? {}, tail, value) };
}
export const ThemePanel = ({ overrides, onChange }) => {
    const theme = useMemo(() => mergeDeep(DEFAULT_PROCESS_THEME, overrides), [overrides]);
    const set_ = useCallback((path, value) => {
        onChange(setPath(overrides, path, value));
    }, [overrides, onChange]);
    const resetAll = () => onChange({});
    const elemColor = (type, field) => theme.elementStyles[type]?.appearance?.[field] ?? '#000000';
    const setElemColor = (type, field, v) => set_(['elementStyles', type, 'appearance', field], v);
    const perType = (theme.edgeLabelPositions?.perType ?? {});
    const defaultPerType = (DEFAULT_PROCESS_THEME.edgeLabelPositions.perType ?? {});
    const compactNumStyle = { width: 64 };
    const compactSelectStyle = { height: 26, padding: '0 4px', fontSize: 11, border: '1px solid #D1D5DB', borderRadius: 4, background: '#FAFAFA', color: '#111827', cursor: 'pointer', outline: 'none', appearance: 'auto', minWidth: 72 };
    return (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 15, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }, children: "Theme & Appearance" }), _jsxs("div", { style: { fontSize: 12, color: '#6B7280', marginTop: 2 }, children: ["Editing: ", _jsx("span", { style: { fontWeight: 500, color: '#374151' }, children: DEFAULT_PROCESS_THEME.name }), " \u2014 session only"] })] }), _jsx(ResetBtn, { onClick: resetAll })] }), _jsx(Section, { title: "Nodes", children: _jsx("div", { style: { display: 'grid', gap: 6 }, children: NODE_TYPES.map(([type, label]) => (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '22px 1fr 72px 72px 72px', gap: 8, alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #F3F4F6' }, children: [_jsx("span", { style: {
                                    display: 'inline-block', width: 16, height: 16, borderRadius: type === 'event' || type === 'parallel' ? '50%' : type === 'gateway' ? 0 : 3,
                                    background: elemColor(type, 'fill'), border: `1px solid ${elemColor(type, 'stroke')}`,
                                    transform: type === 'gateway' ? 'rotate(45deg)' : 'none', flexShrink: 0,
                                } }), _jsx("span", { style: { fontSize: 12, fontWeight: 500, color: '#374151' }, children: label }), _jsx(ColorInput, { value: elemColor(type, 'fill'), onChange: v => setElemColor(type, 'fill', v) }), _jsx(ColorInput, { value: elemColor(type, 'stroke'), onChange: v => setElemColor(type, 'stroke', v) }), _jsx(ColorInput, { value: elemColor(type, 'label'), onChange: v => setElemColor(type, 'label', v) })] }, type))) }) }), _jsx(Section, { title: "Edges", children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }, children: [_jsxs("div", { style: { display: 'grid', gap: 6 }, children: [_jsx(Field, { label: "Default stroke", hint: "Same-lane flows", children: _jsx(ColorInput, { value: theme.edges.default?.stroke ?? '#888780', onChange: v => set_(['edges', 'default', 'stroke'], v) }) }), _jsx(Field, { label: "Cross-lane stroke", children: _jsx(ColorInput, { value: theme.edges.crossLane?.stroke ?? '#B4B2A9', onChange: v => set_(['edges', 'crossLane', 'stroke'], v) }) }), _jsx(Field, { label: "Loopback stroke", children: _jsx(ColorInput, { value: theme.edges.loopback?.stroke ?? '#BA7517', onChange: v => set_(['edges', 'loopback', 'stroke'], v) }) }), _jsx(Field, { label: "Selected stroke", children: _jsx(ColorInput, { value: theme.edges.selected?.stroke ?? '#378ADD', onChange: v => set_(['edges', 'selected', 'stroke'], v) }) }), _jsx(Field, { label: "Arrowhead", children: _jsx(ColorInput, { value: theme.edges.marker?.fill ?? '#888780', onChange: v => set_(['edges', 'marker', 'fill'], v) }) })] }), _jsxs("div", { style: { display: 'grid', gap: 6 }, children: [_jsx(Field, { label: "Label text", hint: "Condition text colour", children: _jsx(ColorInput, { value: theme.edges.label?.fill ?? '#5F5E5A', onChange: v => set_(['edges', 'label', 'fill'], v) }) }), _jsx(Field, { label: "Label halo", hint: "Text halo colour", children: _jsx(ColorInput, { value: theme.edges.label?.haloColor ?? '#F7F6F2', onChange: v => set_(['edges', 'label', 'haloColor'], v) }) }), _jsx(Field, { label: "Edge width", hint: "Default stroke width", children: _jsx(Num, { value: theme.edges.default?.strokeWidth ?? 1.5, onChange: v => set_(['edges', 'default', 'strokeWidth'], v), min: 0.5, max: 5, step: 0.5, unit: "px", width: 56 }) }), _jsx(Field, { label: "Halo width", hint: "Halo stroke width", children: _jsx(Num, { value: theme.edges.halo?.default?.width ?? 4, onChange: v => set_(['edges', 'halo', 'default', 'width'], v), min: 0, max: 12, unit: "px", width: 56 }) })] })] }) }), _jsx(Section, { title: "Edge Label Sizing", children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }, children: [_jsxs("div", { style: { display: 'grid', gap: 6 }, children: [_jsx(Field, { label: "Char width", hint: "Estimated px per character", children: _jsx(Num, { value: theme.edges.label?.charWidthPx ?? 7, onChange: v => set_(['edges', 'label', 'charWidthPx'], v), min: 4, max: 14, step: 0.5, unit: "px", width: 56 }) }), _jsx(Field, { label: "Padding", hint: "Horizontal padding inside label", children: _jsx(Num, { value: theme.edges.label?.paddingX ?? 14, onChange: v => set_(['edges', 'label', 'paddingX'], v), min: 4, max: 40, unit: "px", width: 56 }) })] }), _jsxs("div", { style: { display: 'grid', gap: 6 }, children: [_jsx(Field, { label: "Min width", hint: "Minimum label container width", children: _jsx(Num, { value: theme.edges.label?.minWidth ?? 56, onChange: v => set_(['edges', 'label', 'minWidth'], v), min: 24, max: 200, unit: "px", width: 56 }) }), _jsx(Field, { label: "Max width", hint: "Maximum label container width", children: _jsx(Num, { value: theme.edges.label?.maxWidth ?? 200, onChange: v => set_(['edges', 'label', 'maxWidth'], v), min: 56, max: 400, unit: "px", width: 56 }) })] })] }) }), _jsxs(Section, { title: "Edge Label Placement", children: [_jsx("div", { style: { marginBottom: 10, fontSize: 11, color: '#6B7280' }, children: "Where labels sit relative to the routed path, per routing type." }), _jsx("div", { style: { overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: 6 }, children: _jsxs("table", { style: { borderCollapse: 'collapse', width: '100%', fontSize: 11, minWidth: 860 }, children: [_jsxs("thead", { children: [_jsxs("tr", { style: { background: '#F9FAFB' }, children: [_jsx("th", { rowSpan: 2, style: { textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid #E5E7EB', color: '#374151', fontWeight: 600, minWidth: 110 }, children: "Routing" }), _jsx("th", { colSpan: 3, style: { textAlign: 'center', padding: '6px 4px', borderBottom: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB', color: '#6366F1', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }, children: "Primary" }), _jsx("th", { colSpan: 3, style: { textAlign: 'center', padding: '6px 4px', borderBottom: '1px solid #E5E7EB', color: '#9CA3AF', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }, children: "Secondary" })] }), _jsxs("tr", { style: { background: '#F9FAFB' }, children: [_jsx("th", { style: { padding: '4px 2px', borderBottom: '1px solid #E5E7EB', color: '#9CA3AF', fontWeight: 500, fontSize: 9, textTransform: 'uppercase' }, children: "Anchor" }), _jsx("th", { style: { padding: '4px 2px', borderBottom: '1px solid #E5E7EB', color: '#9CA3AF', fontWeight: 500, fontSize: 9, textTransform: 'uppercase' }, children: "Side" }), _jsx("th", { style: { padding: '4px 2px', borderBottom: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB', color: '#9CA3AF', fontWeight: 500, fontSize: 9, textTransform: 'uppercase' }, children: "Offset" }), _jsx("th", { style: { padding: '4px 2px', borderBottom: '1px solid #E5E7EB', color: '#9CA3AF', fontWeight: 500, fontSize: 9, textTransform: 'uppercase' }, children: "Anchor" }), _jsx("th", { style: { padding: '4px 2px', borderBottom: '1px solid #E5E7EB', color: '#9CA3AF', fontWeight: 500, fontSize: 9, textTransform: 'uppercase' }, children: "Side" }), _jsx("th", { style: { padding: '4px 2px', borderBottom: '1px solid #E5E7EB', color: '#9CA3AF', fontWeight: 500, fontSize: 9, textTransform: 'uppercase' }, children: "Offset" })] })] }), _jsx("tbody", { children: ROUTING_TYPES.map(([code, label]) => {
                                        const isDefault = code === 'defaults';
                                        const placement = isDefault
                                            ? theme.edgeLabelPositions?.defaults
                                            : perType[code];
                                        const basePlacement = isDefault
                                            ? DEFAULT_PROCESS_THEME.edgeLabelPositions.defaults
                                            : defaultPerType[code] ?? DEFAULT_PROCESS_THEME.edgeLabelPositions.defaults;
                                        const anchor = placement?.anchor ?? basePlacement.anchor;
                                        const side = placement?.side ?? basePlacement.side;
                                        const offset = placement?.offsetPx ?? basePlacement.offsetPx;
                                        const pathPrefix = isDefault ? ['edgeLabelPositions', 'defaults'] : ['edgeLabelPositions', 'perType', code];
                                        return (_jsxs("tr", { style: { background: isDefault ? '#F5F3FF' : 'transparent' }, children: [_jsx("td", { style: { padding: '3px 10px', borderBottom: '1px solid #F3F4F6', fontWeight: isDefault ? 600 : 400, color: '#374151', whiteSpace: 'nowrap' }, children: label }), _jsx("td", { style: { padding: '1px 2px', borderBottom: '1px solid #F3F4F6', borderRight: '1px solid #F3F4F6' }, children: _jsx(Select, { value: anchor, options: ANCHOR_OPTIONS, onChange: v => set_([...pathPrefix, 'anchor'], v), style: compactSelectStyle }) }), _jsx("td", { style: { padding: '1px 2px', borderBottom: '1px solid #F3F4F6', borderRight: '1px solid #E5E7EB' }, children: _jsx(Select, { value: side, options: SIDE_OPTIONS, onChange: v => set_([...pathPrefix, 'side'], v), style: compactSelectStyle }) }), _jsx("td", { style: { padding: '1px 2px', borderBottom: '1px solid #F3F4F6', borderRight: '1px solid #E5E7EB' }, children: _jsx(Num, { value: offset, onChange: v => set_([...pathPrefix, 'offsetPx'], v), min: -40, max: 80, step: 1, unit: "px", width: 52 }) }), _jsx("td", { style: { padding: '1px 2px', borderBottom: '1px solid #F3F4F6', borderRight: '1px solid #F3F4F6' }, children: _jsx(Select, { value: placement?.secondaryAnchor ?? basePlacement?.secondaryAnchor ?? 'mid', options: ANCHOR_OPTIONS, onChange: v => set_([...pathPrefix, 'secondaryAnchor'], v), style: compactSelectStyle }) }), _jsx("td", { style: { padding: '1px 2px', borderBottom: '1px solid #F3F4F6', borderRight: '1px solid #E5E7EB' }, children: _jsx(Select, { value: placement?.secondarySide ?? basePlacement?.secondarySide ?? 'center', options: SIDE_OPTIONS, onChange: v => set_([...pathPrefix, 'secondarySide'], v), style: compactSelectStyle }) }), _jsx("td", { style: { padding: '1px 2px', borderBottom: '1px solid #F3F4F6' }, children: _jsx(Num, { value: placement?.secondaryOffsetPx ?? basePlacement?.secondaryOffsetPx ?? 0, onChange: v => set_([...pathPrefix, 'secondaryOffsetPx'], v), min: -40, max: 80, step: 1, unit: "px", width: 52 }) })] }, code));
                                    }) })] }) })] }), _jsx(Section, { title: "Swimlanes & Boundaries", children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }, children: [_jsxs("div", { style: { display: 'grid', gap: 6 }, children: [_jsx(Field, { label: "Lane body", children: _jsx(ColorInput, { value: theme.lanes.bodyFill, onChange: v => set_(['lanes', 'bodyFill'], v) }) }), _jsx(Field, { label: "Lane header", children: _jsx(ColorInput, { value: theme.lanes.headerFill, onChange: v => set_(['lanes', 'headerFill'], v) }) }), _jsx(Field, { label: "Border", children: _jsx(ColorInput, { value: theme.lanes.borderColor, onChange: v => set_(['lanes', 'borderColor'], v) }) }), _jsx(Field, { label: "Label", children: _jsx(ColorInput, { value: theme.lanes.labelColor, onChange: v => set_(['lanes', 'labelColor'], v) }) }), _jsx(Field, { label: "Border width", hint: "px", children: _jsx(Num, { value: theme.lanes.borderWidth, onChange: v => set_(['lanes', 'borderWidth'], v), min: 0.5, max: 4, step: 0.5, unit: "px", width: 56 }) })] }), _jsx("div", { style: { display: 'grid', gap: 6 }, children: ['inbound', 'outbound'].map(side => (_jsxs("div", { style: { padding: '8px 10px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6 }, children: [_jsx("div", { style: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: side === 'inbound' ? '#185FA5' : '#A32D2D', marginBottom: 6 }, children: side === 'inbound' ? '← IN' : 'OUT →' }), _jsxs("div", { style: { display: 'grid', gap: 4 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("span", { style: { fontSize: 11, color: '#6B7280' }, children: "Fill" }), _jsx(ColorInput, { value: theme.curtains[side].fill, onChange: v => set_(['curtains', side, 'fill'], v) })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("span", { style: { fontSize: 11, color: '#6B7280' }, children: "Stroke" }), _jsx(ColorInput, { value: theme.curtains[side].stroke, onChange: v => set_(['curtains', side, 'stroke'], v) })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("span", { style: { fontSize: 11, color: '#6B7280' }, children: "Label" }), _jsx(ColorInput, { value: theme.curtains[side].labelColor, onChange: v => set_(['curtains', side, 'labelColor'], v) })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("span", { style: { fontSize: 11, color: '#6B7280' }, children: "Opacity" }), _jsx(Slider, { value: theme.curtains[side].fillOpacity, onChange: v => set_(['curtains', side, 'fillOpacity'], v), min: 0, max: 1, step: 0.05, format: v => `${Math.round(v * 100)}%` })] })] })] }, side))) })] }) }), _jsx(Section, { title: "Typography", children: _jsx("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }, children: [
                        ['laneHeader', 'Lane header'],
                        ['nodeLabel', 'Node label'],
                        ['edgeLabel', 'Edge label'],
                        ['curtainLabel', 'Curtain label'],
                    ].map(([key, label]) => (_jsx(Field, { label: label, hint: "px", children: _jsx(Num, { value: theme.typography[key]?.fontSizePx ?? 10, onChange: v => set_(['typography', key, 'fontSizePx'], v), min: 6, max: 20, unit: "px", width: 56 }) }, key))) }) }), _jsx(Section, { title: "Canvas", children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }, children: [_jsx(Field, { label: "Header height", hint: "px", children: _jsx(Num, { value: theme.canvasTokens.laneHeaderHeight, onChange: v => set_(['canvasTokens', 'laneHeaderHeight'], v), min: 12, max: 60, unit: "px", width: 56 }) }), _jsx(Field, { label: "Curtain width", hint: "px", children: _jsx(Num, { value: theme.canvasTokens.baseCurtainWidth, onChange: v => set_(['canvasTokens', 'baseCurtainWidth'], v), min: 40, max: 200, unit: "px", width: 56 }) }), _jsx(Field, { label: "Curtain padding", hint: "px", children: _jsx(Num, { value: theme.canvasTokens.curtainPadding, onChange: v => set_(['canvasTokens', 'curtainPadding'], v), min: 8, max: 80, unit: "px", width: 56 }) }), _jsx(Field, { label: "Bounds padding", hint: "px", children: _jsx(Num, { value: theme.canvasTokens.visualBoundsPadding, onChange: v => set_(['canvasTokens', 'visualBoundsPadding'], v), min: 0, max: 60, unit: "px", width: 56 }) }), _jsx(Field, { label: "Label container", hint: "px", children: _jsx(Num, { value: theme.canvasTokens.labelContainerWidth, onChange: v => set_(['canvasTokens', 'labelContainerWidth'], v), min: 40, max: 240, unit: "px", width: 56 }) })] }) })] }));
};
