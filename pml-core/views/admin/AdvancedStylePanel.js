'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo } from 'react';
import { DEFAULT_PROCESS_THEME } from '../../core/styling/defaultProcessTheme';
import { resolveTheme } from '../../core/styling/resolveTheme';
import { ROUTING_TYPE_LABELS } from '../../core/routing/routingRuleDefinition';
import { Field, Section, Num, Select, ColorInput } from './controls';
const ANCHOR_OPTIONS = [
    { value: 'start', label: 'Start' },
    { value: 'mid', label: 'Mid' },
    { value: 'end', label: 'End' },
    { value: 'elbow-1', label: 'Elbow 1' },
    { value: 'elbow-2', label: 'Elbow 2' },
    { value: 'elbow-3', label: 'Elbow 3' },
];
const MIRROR_OPTIONS = [
    { value: 'none', label: 'None (fixed)' },
    { value: 'vertical', label: 'Vertical (above/below)' },
    { value: 'horizontal', label: 'Horizontal (left/right)' },
];
const ROUTING_TYPES = [
    ['defaults', 'Defaults'],
    ...Object.entries(ROUTING_TYPE_LABELS),
];
function setPath(obj, path, value) {
    if (path.length === 0)
        return value;
    const [head, ...tail] = path;
    return { ...obj, [head]: setPath(obj[head] ?? {}, tail, value) };
}
/**
 * Theme settings that don't correspond to a single clickable canvas element
 * — spacing/sizing tokens, the per-routing-type edge-label placement table,
 * and status/marker colors (a status dot or task-type glyph isn't its own
 * clickable element the way a node/edge/lane/curtain is) — split out from
 * the Theme tab's click-to-style editor (ThemePanel.tsx) once that became
 * fully contextual. Per-element font sizes (node label, lane header, edge
 * label, curtain label) moved to ThemeContextualPanel instead of staying
 * here, since those ARE scoped to a clickable element.
 */
export const AdvancedStylePanel = ({ overrides, onChange }) => {
    const theme = useMemo(() => resolveTheme(overrides), [overrides]);
    const set_ = useCallback((path, value) => {
        onChange(setPath(overrides, path, value));
    }, [overrides, onChange]);
    const perType = (theme.edgeLabelPositions?.perType ?? {});
    const defaultPerType = (DEFAULT_PROCESS_THEME.edgeLabelPositions.perType ?? {});
    const compactSelectStyle = { height: 26, padding: '0 4px', fontSize: 11, border: '1px solid #D1D5DB', borderRadius: 4, background: '#FAFAFA', color: '#111827', cursor: 'pointer', outline: 'none', appearance: 'auto', minWidth: 72 };
    return (_jsxs("div", { children: [_jsxs("div", { style: { marginBottom: 16 }, children: [_jsx("div", { style: { fontSize: 15, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }, children: "Advanced Style" }), _jsxs("div", { style: { fontSize: 12, color: '#6B7280', marginTop: 2 }, children: ["Spacing and label-placement settings that aren't tied to a single clickable element \u2014 see the ", _jsx("strong", { children: "Theme" }), " tab for colors, borders, and per-element fonts."] })] }), _jsx(Section, { title: "Edge Label Sizing", children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }, children: [_jsxs("div", { style: { display: 'grid', gap: 6 }, children: [_jsx(Field, { label: "Char width", hint: "Estimated px per character", children: _jsx(Num, { value: theme.edges.label?.charWidthPx ?? 7, onChange: v => set_(['edges', 'label', 'charWidthPx'], v), min: 4, max: 14, step: 0.5, unit: "px", width: 56 }) }), _jsx(Field, { label: "Padding", hint: "Horizontal padding inside label", children: _jsx(Num, { value: theme.edges.label?.paddingX ?? 14, onChange: v => set_(['edges', 'label', 'paddingX'], v), min: 4, max: 40, unit: "px", width: 56 }) })] }), _jsxs("div", { style: { display: 'grid', gap: 6 }, children: [_jsx(Field, { label: "Min width", hint: "Minimum label container width", children: _jsx(Num, { value: theme.edges.label?.minWidth ?? 56, onChange: v => set_(['edges', 'label', 'minWidth'], v), min: 24, max: 200, unit: "px", width: 56 }) }), _jsx(Field, { label: "Max width", hint: "Maximum label container width", children: _jsx(Num, { value: theme.edges.label?.maxWidth ?? 200, onChange: v => set_(['edges', 'label', 'maxWidth'], v), min: 56, max: 400, unit: "px", width: 56 }) })] })] }) }), _jsxs(Section, { title: "Edge Label Placement", children: [_jsx("div", { style: { marginBottom: 10, fontSize: 11, color: '#6B7280' }, children: "Where labels sit relative to the routed path, per routing type." }), _jsx("div", { style: { overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: 6 }, children: _jsxs("table", { style: { borderCollapse: 'collapse', width: '100%', fontSize: 11, minWidth: 760 }, children: [_jsx("thead", { children: _jsxs("tr", { style: { background: '#F9FAFB' }, children: [_jsx("th", { style: { textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid #E5E7EB', color: '#374151', fontWeight: 600, minWidth: 110 }, children: "Routing" }), _jsx("th", { style: { padding: '6px 4px', borderBottom: '1px solid #E5E7EB', color: '#9CA3AF', fontWeight: 500, fontSize: 9, textTransform: 'uppercase' }, children: "Anchor" }), _jsx("th", { style: { padding: '6px 4px', borderBottom: '1px solid #E5E7EB', color: '#9CA3AF', fontWeight: 500, fontSize: 9, textTransform: 'uppercase' }, title: "Positive = right", children: "Offset X" }), _jsx("th", { style: { padding: '6px 4px', borderBottom: '1px solid #E5E7EB', color: '#9CA3AF', fontWeight: 500, fontSize: 9, textTransform: 'uppercase' }, title: "Positive = down", children: "Offset Y" }), _jsx("th", { style: { padding: '6px 4px', borderBottom: '1px solid #E5E7EB', color: '#9CA3AF', fontWeight: 500, fontSize: 9, textTransform: 'uppercase' }, children: "Mirror" })] }) }), _jsx("tbody", { children: ROUTING_TYPES.map(([code, label]) => {
                                        const isDefault = code === 'defaults';
                                        const placement = isDefault
                                            ? theme.edgeLabelPositions?.defaults
                                            : perType[code];
                                        const basePlacement = isDefault
                                            ? DEFAULT_PROCESS_THEME.edgeLabelPositions.defaults
                                            : defaultPerType[code] ?? DEFAULT_PROCESS_THEME.edgeLabelPositions.defaults;
                                        const anchor = placement?.anchor ?? basePlacement.anchor;
                                        const offsetX = placement?.offset?.x ?? basePlacement.offset.x;
                                        const offsetY = placement?.offset?.y ?? basePlacement.offset.y;
                                        const mirrorAxis = placement?.mirrorAxis ?? basePlacement.mirrorAxis;
                                        const pathPrefix = isDefault ? ['edgeLabelPositions', 'defaults'] : ['edgeLabelPositions', 'perType', code];
                                        return (_jsxs("tr", { style: { background: isDefault ? '#F5F3FF' : 'transparent' }, children: [_jsxs("td", { style: { padding: '3px 10px', borderBottom: '1px solid #F3F4F6', fontWeight: isDefault ? 600 : 400, color: '#374151', whiteSpace: 'nowrap' }, children: [!isDefault && (_jsx("span", { style: { fontFamily: 'monospace', fontSize: 10, color: '#9CA3AF', marginRight: 6 }, children: code })), label] }), _jsx("td", { style: { padding: '1px 2px', borderBottom: '1px solid #F3F4F6', borderRight: '1px solid #F3F4F6' }, children: _jsx(Select, { value: anchor, options: ANCHOR_OPTIONS, onChange: v => set_([...pathPrefix, 'anchor'], v), style: compactSelectStyle }) }), _jsx("td", { style: { padding: '1px 2px', borderBottom: '1px solid #F3F4F6', borderRight: '1px solid #F3F4F6' }, children: _jsx(Num, { value: offsetX, onChange: v => set_([...pathPrefix, 'offset', 'x'], v), min: -40, max: 40, step: 1, unit: "px", width: 52 }) }), _jsx("td", { style: { padding: '1px 2px', borderBottom: '1px solid #F3F4F6', borderRight: '1px solid #E5E7EB' }, children: _jsx(Num, { value: offsetY, onChange: v => set_([...pathPrefix, 'offset', 'y'], v), min: -40, max: 40, step: 1, unit: "px", width: 52 }) }), _jsx("td", { style: { padding: '1px 2px', borderBottom: '1px solid #F3F4F6' }, children: _jsx(Select, { value: mirrorAxis, options: MIRROR_OPTIONS, onChange: v => set_([...pathPrefix, 'mirrorAxis'], v), style: compactSelectStyle }) })] }, code));
                                    }) })] }) }), _jsxs("p", { style: { fontSize: 11, color: '#9CA3AF', margin: '8px 10px 0' }, children: [_jsx("strong", { children: "Anchor" }), " picks which point on the routed path the offset is measured from (a corner/elbow, the midpoint, or an endpoint).", ' ', _jsx("strong", { children: "Offset X/Y" }), " is the one placement mechanism \u2014 a raw pixel vector from that point, always both axes, always linear.", ' ', _jsx("strong", { children: "Mirror" }), " flips the offset per edge instance so a gateway's two branches land on opposite, correctly-mirrored sides without knowing about each other; leave it \"None\" for a fixed vector every edge of that type shares.", ' ', "This is the only placement mechanism \u2014 no automatic overlap avoidance runs on edge labels, so two edges of the same routing type always land at the same relative position."] })] }), _jsxs(Section, { title: "Status & Markers", children: [_jsx("div", { style: { marginBottom: 10, fontSize: 11, color: '#6B7280' }, children: "Colors for the small status dot (node.metadata.status) and task-type marker glyph \u2014 not tied to any single clickable element, so they're not in the per-element Theme editor." }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }, children: [_jsx(Field, { label: "Approved", children: _jsx(ColorInput, { value: theme.statusIndicators?.approved ?? '#10B981', onChange: v => set_(['statusIndicators', 'approved'], v) }) }), _jsx(Field, { label: "Pending", children: _jsx(ColorInput, { value: theme.statusIndicators?.pending ?? '#F59E0B', onChange: v => set_(['statusIndicators', 'pending'], v) }) }), _jsx(Field, { label: "Rejected", children: _jsx(ColorInput, { value: theme.statusIndicators?.rejected ?? '#EF4444', onChange: v => set_(['statusIndicators', 'rejected'], v) }) }), _jsx(Field, { label: "Other status", children: _jsx(ColorInput, { value: theme.statusIndicators?.default ?? '#94A3B8', onChange: v => set_(['statusIndicators', 'default'], v) }) }), _jsx(Field, { label: "Task-type marker", children: _jsx(ColorInput, { value: theme.taskTypeMarkerColor ?? '#6B7280', onChange: v => set_(['taskTypeMarkerColor'], v) }) })] })] }), _jsx(Section, { title: "Canvas", children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }, children: [_jsx(Field, { label: "Header height", hint: "px", children: _jsx(Num, { value: theme.canvasTokens.laneHeaderHeight, onChange: v => set_(['canvasTokens', 'laneHeaderHeight'], v), min: 12, max: 60, unit: "px", width: 56 }) }), _jsx(Field, { label: "Curtain width", hint: "px", children: _jsx(Num, { value: theme.canvasTokens.baseCurtainWidth, onChange: v => set_(['canvasTokens', 'baseCurtainWidth'], v), min: 40, max: 200, unit: "px", width: 56 }) }), _jsx(Field, { label: "Curtain padding", hint: "px", children: _jsx(Num, { value: theme.canvasTokens.curtainPadding, onChange: v => set_(['canvasTokens', 'curtainPadding'], v), min: 8, max: 80, unit: "px", width: 56 }) }), _jsx(Field, { label: "Bounds padding", hint: "px", children: _jsx(Num, { value: theme.canvasTokens.visualBoundsPadding, onChange: v => set_(['canvasTokens', 'visualBoundsPadding'], v), min: 0, max: 60, unit: "px", width: 56 }) }), _jsx(Field, { label: "Label container", hint: "px", children: _jsx(Num, { value: theme.canvasTokens.labelContainerWidth, onChange: v => set_(['canvasTokens', 'labelContainerWidth'], v), min: 40, max: 240, unit: "px", width: 56 }) })] }) })] }));
};
