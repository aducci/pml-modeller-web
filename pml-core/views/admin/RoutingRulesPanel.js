'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * RoutingRulesPanel — admin UI for the routing rule mapping table.
 *
 * Each rule maps (sourceType × targetType × laneConfig) to a primary routing
 * type plus ordered alternates with activation conditions.
 */
import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, RotateCcw, Trash2 } from 'lucide-react';
// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------
const NODE_TYPE_OPTIONS = [
    { value: '*', label: 'Any type' },
    { value: 'task', label: 'Task' },
    { value: 'event', label: 'Event' },
    { value: 'gateway', label: 'Gateway' },
    { value: 'annotation', label: 'Annotation' },
    { value: 'subprocess', label: 'Sub-process' },
];
const LANE_CONFIG_OPTIONS = [
    { value: '*', label: 'Any' },
    { value: 'same-lane', label: 'Same lane' },
    { value: 'cross-lane-downward', label: 'Cross-lane ↓' },
    { value: 'cross-lane-upward', label: 'Cross-lane ↑' },
    { value: 'loopback', label: 'Loopback' },
    { value: 'self-loop', label: 'Self loop' },
];
const ROUTING_TYPE_OPTIONS = [
    { value: 'STH', label: 'STH — Straight Horizontal', group: 'Straight' },
    { value: 'STV', label: 'STV — Straight Vertical', group: 'Straight' },
    { value: 'SEH', label: 'SEH — Single Elbow Horizontal', group: 'Single Elbow' },
    { value: 'SEV', label: 'SEV — Single Elbow Vertical', group: 'Single Elbow' },
    { value: 'DEH', label: 'DEH — Double Elbow Horizontal', group: 'Double Elbow' },
    { value: 'DEN', label: 'DEN — Double Elbow Near-Exit', group: 'Double Elbow' },
    { value: 'DEF', label: 'DEF — Double Elbow Far-Exit', group: 'Double Elbow' },
    { value: 'DEV', label: 'DEV — Double Elbow Vertical', group: 'Double Elbow' },
    { value: 'DBL', label: 'DBL — Double Elbow Bottom-to-Left', group: 'Double Elbow' },
    { value: 'TEH', label: 'TEH — Triple Elbow Horizontal', group: 'Triple Elbow' },
    { value: 'TEV', label: 'TEV — Triple Elbow Vertical', group: 'Triple Elbow' },
    { value: 'SLP', label: 'SLP — Self Loop', group: 'Special' },
    { value: 'POH', label: 'POH — Parallel Offset Horizontal', group: 'Special' },
    { value: 'POV', label: 'POV — Parallel Offset Vertical', group: 'Special' },
    { value: 'AOT', label: 'AOT — Auto Orthogonal', group: 'Special' },
];
const CONDITION_OPTIONS = [
    { value: 'compact-mode', label: 'Compact mode', description: 'When layout density = compact' },
    { value: 'path-blocked', label: 'Path blocked', description: 'Primary path intersects a node' },
    { value: 'parallel-offset', label: 'Parallel offset', description: 'Another connection occupies same path' },
    { value: 'always', label: 'Always (fallback)', description: 'Unconditional last resort' },
];
export const RoutingRulesPanel = ({ controller, rules }) => {
    const [expandedId, setExpandedId] = useState(null);
    return (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }, children: [_jsxs("div", { children: [_jsx("h2", { style: { fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }, children: "Routing Rules" }), _jsxs("p", { style: { fontSize: 12, color: '#6B7280', margin: '4px 0 0', lineHeight: 1.5, maxWidth: 560 }, children: ["Maps ", _jsx("strong", { children: "source type \u00D7 target type \u00D7 lane configuration" }), " to a preferred routing type with ordered alternates. Rules are evaluated highest-priority-first; first match wins."] })] }), _jsxs("div", { style: { display: 'flex', gap: 8, flexShrink: 0 }, children: [_jsxs("button", { onClick: () => {
                                    const id = `rule-${Date.now()}`;
                                    controller.addRule({
                                        id,
                                        label: 'New Rule',
                                        description: '',
                                        enabled: true,
                                        priority: (rules[0]?.priority ?? 0) + 10,
                                        match: { sourceType: '*', targetType: '*', laneConfig: '*' },
                                        primary: 'DEH',
                                        alternates: [],
                                    });
                                    setExpandedId(id);
                                }, style: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#fff', background: '#6366F1', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontWeight: 500 }, children: [_jsx(Plus, { size: 13 }), " Add rule"] }), _jsxs("button", { onClick: () => controller.resetToDefaults(), style: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7280', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }, children: [_jsx(RotateCcw, { size: 12 }), " Reset"] })] })] }), _jsxs("div", { style: { border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }, children: [_jsxs("div", { style: {
                            display: 'grid',
                            gridTemplateColumns: '28px 32px 130px 130px 140px 110px 1fr 60px',
                            padding: '8px 12px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB',
                            alignItems: 'center', gap: 8,
                        }, children: [_jsx("span", {}), _jsx("span", { style: thStyle, children: "Pri" }), _jsx("span", { style: thStyle, children: "Source" }), _jsx("span", { style: thStyle, children: "Target" }), _jsx("span", { style: thStyle, children: "Lane config" }), _jsx("span", { style: thStyle, children: "Primary type" }), _jsx("span", { style: thStyle, children: "Alternates" }), _jsx("span", { style: thStyle, children: "On" })] }), rules.length === 0 && (_jsx("div", { style: { padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 12 }, children: "No rules defined. Click \"Add rule\" to create one." })), rules.map((rule, idx) => (_jsx(RuleRow, { rule: rule, isExpanded: expandedId === rule.id, onToggle: () => setExpandedId(prev => prev === rule.id ? null : rule.id), onMoveUp: idx > 0 ? () => controller.reorder(idx, idx - 1) : undefined, onMoveDown: idx < rules.length - 1 ? () => controller.reorder(idx, idx + 1) : undefined, onUpdate: patch => controller.updateRule(rule.id, patch), onUpdateMatch: match => controller.updateMatch(rule.id, match), onSetPrimary: type => controller.setPrimary(rule.id, type), onSetAlternates: alts => controller.setAlternates(rule.id, alts), onAddAlternate: alt => controller.addAlternate(rule.id, alt), onRemoveAlternate: i => controller.removeAlternate(rule.id, i), onToggleEnabled: () => controller.toggleEnabled(rule.id), onDelete: () => controller.deleteRule(rule.id) }, rule.id)))] }), _jsxs("div", { style: { marginTop: 20, padding: '12px 16px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }, children: [_jsx("div", { style: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 8 }, children: "Alternate conditions" }), _jsx("div", { style: { display: 'flex', gap: 16, flexWrap: 'wrap' }, children: CONDITION_OPTIONS.map(c => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx("span", { style: { fontSize: 10, background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 3, padding: '1px 5px', fontWeight: 500 }, children: c.label }), _jsx("span", { style: { fontSize: 11, color: '#6B7280' }, children: c.description })] }, c.value))) })] })] }));
};
function RuleRow({ rule, isExpanded, onToggle, onMoveUp, onMoveDown, onUpdate, onUpdateMatch, onSetPrimary, onSetAlternates, onAddAlternate, onRemoveAlternate, onToggleEnabled, onDelete, }) {
    const label = LANE_CONFIG_OPTIONS.find(o => o.value === rule.match.laneConfig)?.label ?? rule.match.laneConfig;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: '28px 32px 130px 130px 140px 110px 1fr 60px',
                    padding: '9px 12px',
                    borderBottom: isExpanded ? 'none' : '1px solid #F3F4F6',
                    background: isExpanded ? '#FAFAFA' : rule.enabled ? '#fff' : '#FAFAFA',
                    alignItems: 'center', gap: 8,
                    opacity: rule.enabled ? 1 : 0.55,
                    cursor: 'pointer',
                }, onClick: onToggle, onMouseEnter: e => { if (!isExpanded)
                    e.currentTarget.style.background = '#F9FAFB'; }, onMouseLeave: e => { if (!isExpanded)
                    e.currentTarget.style.background = rule.enabled ? '#fff' : '#FAFAFA'; }, children: [_jsx("span", { style: { color: '#9CA3AF' }, children: isExpanded ? _jsx(ChevronDown, { size: 13 }) : _jsx(ChevronRight, { size: 13 }) }), _jsx("span", { style: { fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', textAlign: 'center' }, children: rule.priority }), _jsx(NodeTypeBadge, { value: rule.match.sourceType }), _jsx(NodeTypeBadge, { value: rule.match.targetType }), _jsx("span", { style: {
                            fontSize: 11, padding: '2px 6px', borderRadius: 3, display: 'inline-flex', alignItems: 'center',
                            background: '#F3F4F6',
                            color: '#6B7280',
                            border: `1px solid #E5E7EB`,
                            fontWeight: 500, whiteSpace: 'nowrap',
                        }, children: label }), _jsx(RoutingTypeBadge, { code: rule.primary, size: "sm" }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 4 }, children: rule.alternates.length === 0
                            ? _jsx("span", { style: { fontSize: 10, color: '#D1D5DB' }, children: "none" })
                            : rule.alternates.map((alt, i) => (_jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: 3 }, children: [_jsx(RoutingTypeBadge, { code: alt.type, size: "xs" }), _jsx(ConditionBadge, { condition: alt.condition })] }, i))) }), _jsx("div", { style: { display: 'flex', justifyContent: 'center' }, onClick: e => e.stopPropagation(), children: _jsx(Toggle, { checked: rule.enabled, onChange: onToggleEnabled }) })] }), isExpanded && (_jsxs("div", { style: { padding: '0 12px 16px', borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }, onClick: e => e.stopPropagation(), children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 12 }, children: [_jsxs("div", { children: [_jsx(SectionHead, { children: "Match criteria" }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 }, children: [_jsx(FieldRow, { label: "Label", children: _jsx("input", { value: rule.label, onChange: e => onUpdate({ label: e.target.value }), style: inputStyle, placeholder: "Rule label" }) }), _jsx(FieldRow, { label: "Description", children: _jsx("input", { value: rule.description, onChange: e => onUpdate({ description: e.target.value }), style: inputStyle, placeholder: "Optional description" }) }), _jsx(FieldRow, { label: "Source type", children: _jsx("select", { value: rule.match.sourceType, onChange: e => onUpdateMatch({ sourceType: e.target.value }), style: selectStyle, children: NODE_TYPE_OPTIONS.map(o => _jsx("option", { value: o.value, children: o.label }, o.value)) }) }), _jsx(FieldRow, { label: "Target type", children: _jsx("select", { value: rule.match.targetType, onChange: e => onUpdateMatch({ targetType: e.target.value }), style: selectStyle, children: NODE_TYPE_OPTIONS.map(o => _jsx("option", { value: o.value, children: o.label }, o.value)) }) }), _jsx(FieldRow, { label: "Lane config", children: _jsx("select", { value: rule.match.laneConfig, onChange: e => onUpdateMatch({ laneConfig: e.target.value }), style: selectStyle, children: LANE_CONFIG_OPTIONS.map(o => _jsx("option", { value: o.value, children: o.label }, o.value)) }) }), _jsx(FieldRow, { label: "Priority", children: _jsx("input", { type: "number", value: rule.priority, onChange: e => onUpdate({ priority: Number(e.target.value) }), style: { ...inputStyle, width: 80 }, min: 0, max: 999 }) })] })] }), _jsxs("div", { children: [_jsx(SectionHead, { children: "Routing types" }), _jsxs("div", { style: { marginBottom: 14 }, children: [_jsx("div", { style: { fontSize: 11, color: '#6B7280', marginBottom: 5, fontWeight: 500 }, children: "Primary" }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("select", { value: rule.primary, onChange: e => onSetPrimary(e.target.value), style: selectStyle, children: groupedTypeOptions() }), _jsx(RoutingTypeBadge, { code: rule.primary, size: "sm" })] }), _jsx("p", { style: { fontSize: 10, color: '#9CA3AF', margin: '4px 0 0', lineHeight: 1.4 }, children: "Used when no alternate condition is active." })] }), _jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }, children: [_jsx("div", { style: { fontSize: 11, color: '#6B7280', fontWeight: 500 }, children: "Alternates" }), _jsx(AddAlternateButton, { onAdd: onAddAlternate })] }), rule.alternates.length === 0 ? (_jsx("div", { style: { fontSize: 11, color: '#D1D5DB', padding: '8px 0' }, children: "No alternates defined." })) : (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 6 }, children: rule.alternates.map((alt, i) => (_jsx(AlternateRow, { alt: alt, onUpdate: patch => {
                                                        onSetAlternates(rule.alternates.map((a, j) => j === i ? { ...a, ...patch } : a));
                                                    }, onRemove: () => onRemoveAlternate(i) }, i))) }))] })] })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid #F3F4F6' }, children: [_jsxs("div", { style: { display: 'flex', gap: 6 }, children: [onMoveUp && (_jsx("button", { onClick: onMoveUp, style: miniBtn, children: "\u2191 Move up" })), onMoveDown && (_jsx("button", { onClick: onMoveDown, style: miniBtn, children: "\u2193 Move down" }))] }), _jsxs("button", { onClick: onDelete, style: { ...miniBtn, color: '#DC2626', borderColor: '#FECACA', background: '#FEF2F2', display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx(Trash2, { size: 11 }), " Delete rule"] })] })] }))] }));
}
function AlternateRow({ alt, onUpdate, onRemove }) {
    return (_jsxs("div", { style: {
            display: 'grid', gridTemplateColumns: '1fr 140px auto',
            gap: 8, alignItems: 'center',
            background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: '7px 10px',
        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx("select", { value: alt.type, onChange: e => onUpdate({ type: e.target.value }), style: { ...selectStyle, fontSize: 11 }, children: groupedTypeOptions() }), _jsx(RoutingTypeBadge, { code: alt.type, size: "xs" })] }), _jsx("select", { value: alt.condition, onChange: e => onUpdate({ condition: e.target.value }), style: { ...selectStyle, fontSize: 11 }, children: CONDITION_OPTIONS.map(c => _jsx("option", { value: c.value, children: c.label }, c.value)) }), _jsx("button", { onClick: onRemove, style: { background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2, display: 'flex' }, children: _jsx(Trash2, { size: 13 }) })] }));
}
// ---------------------------------------------------------------------------
// AddAlternateButton
// ---------------------------------------------------------------------------
function AddAlternateButton({ onAdd }) {
    return (_jsxs("button", { onClick: () => onAdd({ type: 'DEH', condition: 'compact-mode', priority: 1 }), style: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6366F1', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }, children: [_jsx(Plus, { size: 11 }), " Add alternate"] }));
}
// ---------------------------------------------------------------------------
// Small shared components
// ---------------------------------------------------------------------------
function RoutingTypeBadge({ code, size }) {
    const fs = size === 'xs' ? 10 : 11;
    return (_jsx("span", { style: {
            fontFamily: 'monospace', fontWeight: 600, fontSize: fs,
            background: '#F3F4F6', color: '#374151',
            border: '1px solid #E5E7EB', borderRadius: 3,
            padding: size === 'xs' ? '0px 3px' : '1px 4px',
            whiteSpace: 'nowrap',
        }, children: code }));
}
function NodeTypeBadge({ value }) {
    const isWild = value === '*';
    return (_jsx("span", { style: {
            fontSize: 11, padding: '2px 6px', borderRadius: 3,
            background: isWild ? '#F3F4F6' : '#F0FDF4',
            color: isWild ? '#9CA3AF' : '#166534',
            border: `1px solid ${isWild ? '#E5E7EB' : '#BBF7D0'}`,
            fontWeight: 500,
        }, children: isWild ? 'Any' : value }));
}
function ConditionBadge({ condition }) {
    return (_jsx("span", { style: {
            fontSize: 9, padding: '1px 4px', borderRadius: 3,
            background: '#F3F4F6', color: '#6B7280',
            border: '1px solid #E5E7EB',
            fontWeight: 500, whiteSpace: 'nowrap',
        }, children: condition === 'compact-mode' ? 'compact'
            : condition === 'path-blocked' ? 'blocked'
                : condition === 'parallel-offset' ? 'parallel'
                    : 'fallback' }));
}
function Toggle({ checked, onChange }) {
    return (_jsx("button", { onClick: onChange, style: {
            width: 32, height: 18, borderRadius: 9, border: 'none', cursor: 'pointer',
            background: checked ? '#6366F1' : '#D1D5DB',
            position: 'relative', transition: 'background 0.15s',
            flexShrink: 0,
        }, children: _jsx("span", { style: {
                position: 'absolute', top: 2, left: checked ? 16 : 2,
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                transition: 'left 0.15s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            } }) }));
}
function SectionHead({ children }) {
    return (_jsx("div", { style: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 8 }, children: children }));
}
function FieldRow({ label, children }) {
    return (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '90px 1fr', alignItems: 'center', gap: 8 }, children: [_jsx("span", { style: { fontSize: 11, color: '#6B7280' }, children: label }), children] }));
}
function groupedTypeOptions() {
    const groups = [...new Set(ROUTING_TYPE_OPTIONS.map(o => o.group))];
    return groups.map(g => (_jsx("optgroup", { label: g, children: ROUTING_TYPE_OPTIONS.filter(o => o.group === g).map(o => (_jsx("option", { value: o.value, children: o.label }, o.value))) }, g)));
}
// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const thStyle = {
    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF',
};
const inputStyle = {
    width: '100%', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 5,
    padding: '4px 8px', outline: 'none', background: '#fff', color: '#374151',
};
const selectStyle = {
    width: '100%', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 5,
    padding: '4px 8px', outline: 'none', background: '#fff', color: '#374151', cursor: 'pointer',
};
const miniBtn = {
    fontSize: 11, padding: '4px 8px', borderRadius: 5, cursor: 'pointer',
    background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#6B7280',
};
