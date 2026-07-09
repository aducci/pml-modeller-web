'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * PatternTablePanel — admin UI for the first-class routing pattern table.
 *
 * Table view: one row per pattern in priority order.
 * Expand a row to edit detect criteria and flow parameters inline.
 * Changes go directly to PatternTableController → live layout preview.
 */
import { useState } from 'react';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
export const PatternTablePanel = ({ controller, table }) => {
    const [expanded, setExpanded] = useState(null);
    const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));
    return (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsxs("div", { children: [_jsx("h2", { style: { fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }, children: "Routing Patterns" }), _jsx("p", { style: { fontSize: 12, color: '#6B7280', margin: '4px 0 0' }, children: "Evaluated in priority order \u2014 first match wins. Drag to reorder; edit detect & flow criteria inline." })] }), _jsxs("button", { onClick: () => controller.resetToDefaults(), style: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7280', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }, children: [_jsx(RotateCcw, { size: 12 }), " Reset all"] })] }), _jsxs("div", { style: { border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }, children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '32px 48px 1fr 200px 80px', padding: '8px 12px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }, children: [_jsx("span", {}), _jsx("span", { style: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }, children: "Pri" }), _jsx("span", { style: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }, children: "Pattern" }), _jsx("span", { style: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }, children: "Detect criteria" }), _jsx("span", { style: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', textAlign: 'center' }, children: "Enabled" })] }), table.map((pattern, idx) => (_jsx(PatternRow, { pattern: pattern, isExpanded: expanded === pattern.id, onToggle: () => toggle(pattern.id), onUpdate: (patch) => controller.updatePattern(pattern.id, patch), onMoveUp: idx > 0 ? () => controller.reorder(idx, idx - 1) : undefined, onMoveDown: idx < table.length - 1 ? () => controller.reorder(idx, idx + 1) : undefined, isLast: idx === table.length - 1 }, pattern.id)))] })] }));
};
const PatternRow = ({ pattern, isExpanded, onToggle, onUpdate, onMoveUp, onMoveDown, isLast }) => {
    return (_jsxs("div", { style: { borderBottom: isLast ? 'none' : '1px solid #F3F4F6' }, children: [_jsxs("div", { style: {
                    display: 'grid', gridTemplateColumns: '32px 48px 1fr 200px 80px',
                    padding: '10px 12px', cursor: 'pointer', alignItems: 'center',
                    background: isExpanded ? '#F5F3FF' : 'white',
                }, onClick: onToggle, children: [_jsx("span", { style: { color: '#9CA3AF' }, children: isExpanded ? _jsx(ChevronDown, { size: 14 }) : _jsx(ChevronRight, { size: 14 }) }), _jsx("span", { style: {
                            fontSize: 11, fontWeight: 500, padding: '1px 5px', borderRadius: 3,
                            background: '#F3F4F6',
                            color: '#6B7280',
                            textAlign: 'center',
                            opacity: pattern.enabled ? 1 : 0.4,
                        }, children: pattern.priority }), _jsxs("div", { style: { opacity: pattern.enabled ? 1 : 0.45 }, children: [_jsx("div", { style: { fontSize: 13, fontWeight: 600, color: '#111827' }, children: pattern.label }), _jsx("div", { style: { fontSize: 11, color: '#9CA3AF', marginTop: 1 }, children: pattern.id })] }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 3 }, children: detectChips(pattern.detect).map((chip, i) => (_jsx("span", { style: {
                                fontSize: 10, padding: '2px 5px', borderRadius: 3,
                                background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB',
                                opacity: pattern.enabled ? 1 : 0.4,
                            }, children: chip }, i))) }), _jsx("div", { style: { textAlign: 'center' }, onClick: (e) => e.stopPropagation(), children: _jsx("label", { style: { display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }, children: _jsx("input", { type: "checkbox", checked: pattern.enabled, onChange: (e) => onUpdate({ enabled: e.target.checked }), style: { width: 16, height: 16, accentColor: '#6366F1', cursor: 'pointer' } }) }) })] }), isExpanded && (_jsx(PatternEditor, { pattern: pattern, onUpdate: onUpdate, onMoveUp: onMoveUp, onMoveDown: onMoveDown }))] }));
};
// ─── Pattern editor ───────────────────────────────────────────────────────────
const PatternEditor = ({ pattern, onUpdate, onMoveUp, onMoveDown }) => {
    const d = pattern.detect;
    const f = pattern.flow;
    return (_jsxs("div", { style: { padding: '0 12px 16px 44px', background: '#FAFAF9', borderTop: '1px solid #F3F4F6' }, children: [_jsxs("div", { style: { display: 'flex', gap: 8, marginBottom: 14, marginTop: 12 }, children: [onMoveUp && (_jsx("button", { onClick: onMoveUp, style: btnStyle, children: "\u2191 Move up" })), onMoveDown && (_jsx("button", { onClick: onMoveDown, style: btnStyle, children: "\u2193 Move down" })), _jsx("input", { type: "number", value: pattern.priority, onChange: (e) => onUpdate({ priority: Number(e.target.value) }), style: { width: 64, fontSize: 12, padding: '3px 6px', border: '1px solid #D1D5DB', borderRadius: 5, textAlign: 'center' }, title: "Priority" })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }, children: [_jsxs("div", { children: [_jsx(SectionHead, { children: "Detect criteria" }), _jsx(DetectField, { label: "Source is boundary", value: d.sourceIsBoundary, onChange: (v) => onUpdate({ detect: { ...d, sourceIsBoundary: v } }) }), _jsx(DetectField, { label: "Target is boundary", value: d.targetIsBoundary, onChange: (v) => onUpdate({ detect: { ...d, targetIsBoundary: v } }) }), _jsx(DetectField, { label: "Same lane", value: d.sameLane, onChange: (v) => onUpdate({ detect: { ...d, sameLane: v } }) }), _jsx(DetectField, { label: "Is loopback", value: d.isLoopback, onChange: (v) => onUpdate({ detect: { ...d, isLoopback: v } }) }), _jsx(DetectSelectField, { label: "Loopback side", value: d.loopbackSide ?? '', options: ['', 'top', 'bottom'], onChange: (v) => onUpdate({ detect: { ...d, loopbackSide: v ? v : undefined } }) }), _jsx(DetectSelectField, { label: "Lane direction", value: d.laneDirection ?? '', options: ['', 'downward', 'upward'], onChange: (v) => onUpdate({ detect: { ...d, laneDirection: v ? v : undefined } }) }), _jsx(DetectNumField, { label: "Source out-degree >", value: d.sourceOutDegreeGt, onChange: (v) => onUpdate({ detect: { ...d, sourceOutDegreeGt: v } }) }), _jsx(DetectNumField, { label: "Target in-degree >", value: d.targetInDegreeGt, onChange: (v) => onUpdate({ detect: { ...d, targetInDegreeGt: v } }) }), _jsx(DetectField, { label: "All targets in source lane", value: d.allTargetsInSourceLane, onChange: (v) => onUpdate({ detect: { ...d, allTargetsInSourceLane: v } }) }), _jsx(DetectNumField, { label: "DeltaY ratio >", value: d.deltaYRatioGt, onChange: (v) => onUpdate({ detect: { ...d, deltaYRatioGt: v } }) })] }), _jsxs("div", { children: [_jsx(SectionHead, { children: "Flow parameters" }), _jsx(FlowReadonlyRow, { label: "Scenario key", value: f.scenarioKey }), _jsx(FlowReadonlyRow, { label: "First segment", value: f.firstSegmentDirection ?? '—' }), _jsx(FlowReadonlyRow, { label: "Elbow Y policy", value: f.elbowYPolicy ?? '—' }), _jsx(FlowNumField, { label: "Exit buffer px", value: f.exitBufferPx ?? 12, onChange: (v) => onUpdate({ flow: { ...f, exitBufferPx: v } }) }), _jsx(FlowNumField, { label: "Entry buffer px", value: f.entryBufferPx ?? 12, onChange: (v) => onUpdate({ flow: { ...f, entryBufferPx: v } }) }), _jsx(FlowReadonlyRow, { label: "Source ports", value: f.sourcePortPriority.map((p) => `${p.side}(${p.hardness[0]})`).join(', ') }), _jsx(FlowReadonlyRow, { label: "Target ports", value: f.targetPortPriority.map((p) => `${p.side}(${p.hardness[0]})`).join(', ') })] })] }), _jsx("div", { style: { marginTop: 10, fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }, children: pattern.description })] }));
};
// ─── Sub-components ───────────────────────────────────────────────────────────
const SectionHead = ({ children }) => (_jsx("div", { style: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 8 }, children: children }));
const DetectField = ({ label, value, onChange }) => (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }, children: [_jsx("span", { style: { fontSize: 12, color: '#374151' }, children: label }), _jsxs("select", { value: value === undefined ? '' : String(value), onChange: (e) => onChange(e.target.value === '' ? undefined : e.target.value === 'true'), style: selectStyle, children: [_jsx("option", { value: "", children: "any" }), _jsx("option", { value: "true", children: "true" }), _jsx("option", { value: "false", children: "false" })] })] }));
const DetectSelectField = ({ label, value, options, onChange }) => (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }, children: [_jsx("span", { style: { fontSize: 12, color: '#374151' }, children: label }), _jsx("select", { value: value, onChange: (e) => onChange(e.target.value), style: selectStyle, children: options.map((o) => _jsx("option", { value: o, children: o || 'any' }, o)) })] }));
const DetectNumField = ({ label, value, onChange }) => (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }, children: [_jsx("span", { style: { fontSize: 12, color: '#374151' }, children: label }), _jsx("input", { type: "number", value: value ?? '', placeholder: "\u2014", onChange: (e) => onChange(e.target.value === '' ? undefined : Number(e.target.value)), style: { ...selectStyle, width: 64, textAlign: 'right' } })] }));
const FlowReadonlyRow = ({ label, value }) => (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 }, children: [_jsx("span", { style: { fontSize: 12, color: '#374151' }, children: label }), _jsx("span", { style: { fontSize: 11, color: '#6366F1', fontFamily: 'monospace' }, children: value })] }));
const FlowNumField = ({ label, value, onChange }) => (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }, children: [_jsx("span", { style: { fontSize: 12, color: '#374151' }, children: label }), _jsx("input", { type: "number", value: value, onChange: (e) => onChange(Number(e.target.value)), style: { ...selectStyle, width: 64, textAlign: 'right' } })] }));
// ─── Helpers ──────────────────────────────────────────────────────────────────
function detectChips(d) {
    const chips = [];
    if (d.sourceIsBoundary !== undefined)
        chips.push(`src.boundary=${d.sourceIsBoundary}`);
    if (d.targetIsBoundary !== undefined)
        chips.push(`tgt.boundary=${d.targetIsBoundary}`);
    if (d.sameLane !== undefined)
        chips.push(`sameLane=${d.sameLane}`);
    if (d.isLoopback !== undefined)
        chips.push(`loopback=${d.isLoopback}`);
    if (d.loopbackSide !== undefined)
        chips.push(`side=${d.loopbackSide}`);
    if (d.laneDirection !== undefined)
        chips.push(`dir=${d.laneDirection}`);
    if (d.sourceNodeTypes !== undefined)
        chips.push(`src∈[${d.sourceNodeTypes.join(',')}]`);
    if (d.sourceOutDegreeGt !== undefined)
        chips.push(`outDeg>${d.sourceOutDegreeGt}`);
    if (d.targetInDegreeGt !== undefined)
        chips.push(`inDeg>${d.targetInDegreeGt}`);
    if (d.allTargetsInSourceLane !== undefined)
        chips.push(`allTgtSameLane=${d.allTargetsInSourceLane}`);
    if (d.deltaYRatioGt !== undefined)
        chips.push(`ΔY>${d.deltaYRatioGt}`);
    return chips;
}
const selectStyle = {
    fontSize: 11, padding: '2px 4px', border: '1px solid #D1D5DB',
    borderRadius: 4, background: 'white', color: '#374151',
};
const btnStyle = {
    fontSize: 11, padding: '3px 8px', border: '1px solid #D1D5DB',
    borderRadius: 5, background: 'white', color: '#374151', cursor: 'pointer',
};
