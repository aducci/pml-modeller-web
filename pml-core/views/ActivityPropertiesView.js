'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { X, Trash2, Plus, ArrowRight, ArrowLeft, CheckSquare, GitBranch, Zap, SlidersHorizontal } from 'lucide-react';
import { PML_METADATA_PROPERTIES, NON_USER_METADATA_KEYS } from '../core/activityMetadataSchema';
// ---------------------------------------------------------------------------
// Style constants — inline styles throughout (not Tailwind utility classes):
// this component ships as part of the `pml-core` library and is consumed by
// host apps with their own Tailwind `content` globs, which never scan
// node_modules — utility classes used only here would silently never be
// generated in the consumer's CSS. Inline styles make the panel self-contained,
// matching the sibling panels (ProcessDataPanel, EnhancementControlRail).
// ---------------------------------------------------------------------------
const INK = '#0F172A';
const MUTED = '#94A3B8';
const LABEL = '#64748B';
const BORDER = '#E5E7EB';
const SOFT_BORDER = '#F1F5F9';
const SURFACE = '#F8FAFC';
/**
 * `queried` is the PML language's only per-element review marker — the `?`
 * suffix on a node id (spec §10). It renders as a dashed/tentative outline on
 * the canvas. There is no separate per-element `status=` anymore: the
 * language only supports `status=` at the `@process` header level (whole
 * document), which is a distinct, coarser-grained thing this panel doesn't
 * control. One mechanism, one place each concept lives.
 */
const QUERIED_STYLE = { bg: '#FEF3C7', fg: '#B45309', dot: '#F59E0B', label: 'Queried' };
const OK_STYLE = { bg: '#F1F5F9', fg: '#64748B', dot: '#94A3B8', label: 'OK' };
/** Accent color per element type — an extension of the app's existing indigo/slate chrome palette. */
const TYPE_ACCENT = {
    task: { color: '#6366F1', tint: '#EEF2FF', icon: _jsx(CheckSquare, { size: 13 }) },
    decision: { color: '#F59E0B', tint: '#FFFBEB', icon: _jsx(GitBranch, { size: 13 }) },
    event: { color: '#0D9488', tint: '#F0FDFA', icon: _jsx(Zap, { size: 13 }) },
};
const GATEWAY_KIND_OPTIONS = [
    { value: 'exclusive', label: 'XOR — Exclusive' },
    { value: 'inclusive', label: 'OR — Inclusive' },
    { value: 'parallel', label: 'AND — Parallel' },
];
const EVENT_TYPE_OPTIONS = [
    { value: 'message', label: 'Message' },
    { value: 'signal', label: 'Signal' },
    { value: 'timer', label: 'Timer' },
    { value: 'state', label: 'State' },
];
export const ActivityPropertiesView = ({ selectedElement, elementData, allNodes = [], allEdges = [], appCatalog = [], onClose, onUpdateNode, onRenameNode, onAddOutcome, onUpdateOutcome, onRemoveOutcome, onSelectNode, onAddAppCatalogEntry, }) => {
    const node = elementData;
    const typeMeta = node ? TYPE_ACCENT[node.type] : undefined;
    const accent = typeMeta?.color ?? '#64748B';
    const handleLabelChange = (newLabel) => {
        if (onUpdateNode && node)
            onUpdateNode(selectedElement.id, 'label', newLabel);
    };
    const handleDescriptionChange = (description) => {
        if (onUpdateNode && node)
            onUpdateNode(selectedElement.id, 'metadata', { ...(node.metadata || {}), description });
    };
    const handleToggleQueried = () => {
        if (!onUpdateNode || !node)
            return;
        const metadata = { ...(node.metadata || {}) };
        if (metadata.queried)
            delete metadata.queried;
        else
            metadata.queried = true;
        onUpdateNode(selectedElement.id, 'metadata', metadata);
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', height: '100%', minWidth: 260, background: '#fff', color: INK, borderLeft: `1px solid ${BORDER}`, boxShadow: '-2px 0 8px rgba(15,23,42,0.04)' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, background: SURFACE, flexShrink: 0 }, children: [_jsxs("h3", { style: { margin: 0, fontSize: 12, fontWeight: 600, color: LABEL, display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx(SlidersHorizontal, { size: 12 }), "Properties"] }), _jsx("button", { onClick: onClose, title: "Close", style: iconButtonStyle(), children: _jsx(X, { size: 13 }) })] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto' }, children: !node ? (_jsx("div", { style: { padding: 20, fontSize: 12, color: MUTED, fontStyle: 'italic', textAlign: 'center' }, children: "Select a node to inspect" })) : node.type === 'task' || node.type === 'decision' || node.type === 'event' ? (_jsxs(_Fragment, { children: [_jsx(PanelHeader, { accent: accent, icon: typeMeta.icon, typeLabel: node.type === 'decision' ? 'Gateway' : node.type[0].toUpperCase() + node.type.slice(1), node: node, onRenameNode: onRenameNode, onToggleQueried: handleToggleQueried }), _jsxs(Section, { children: [_jsx(Field, { label: "Label", children: _jsx(TextInput, { value: node.label || '', onChange: handleLabelChange, accent: accent }) }), _jsx(Field, { label: "Description", alignTop: true, children: _jsx(TextArea, { value: node.metadata?.description || '', onChange: handleDescriptionChange, accent: accent }) })] }), node.type === 'decision' && (_jsx(GatewaySection, { node: node, accent: accent, allNodes: allNodes, allEdges: allEdges, onUpdateNode: onUpdateNode, onAddOutcome: onAddOutcome, onUpdateOutcome: onUpdateOutcome, onRemoveOutcome: onRemoveOutcome })), node.type === 'event' && (_jsx(EventSection, { node: node, accent: accent, allEdges: allEdges, onUpdateNode: onUpdateNode, onSelectNode: onSelectNode })), _jsx(GenericMetadataSection, { node: node, accent: accent, onUpdateNode: onUpdateNode, selectedElement: selectedElement, appCatalog: appCatalog, onAddAppCatalogEntry: onAddAppCatalogEntry })] })) : (_jsx(FallbackView, { node: node })) })] }));
};
// ---------------------------------------------------------------------------
// Shared header: {Type} - {id}, editable id, status pill top-right
// ---------------------------------------------------------------------------
function PanelHeader({ accent, icon, typeLabel, node, onRenameNode, onToggleQueried, }) {
    const [editingId, setEditingId] = useState(false);
    const [idDraft, setIdDraft] = useState(node.id);
    const [idError, setIdError] = useState(null);
    const queried = Boolean(node.metadata?.queried);
    const statusStyle = queried ? QUERIED_STYLE : OK_STYLE;
    useEffect(() => {
        setIdDraft(node.id);
        setIdError(null);
    }, [node.id]);
    const commitId = () => {
        const trimmed = idDraft.trim();
        if (trimmed === node.id) {
            setEditingId(false);
            return;
        }
        const applied = onRenameNode?.(node.id, trimmed) ?? false;
        if (applied) {
            setEditingId(false);
            setIdError(null);
        }
        else
            setIdError('ID already in use or invalid');
    };
    return (_jsxs("div", { style: { padding: '12px 14px', borderBottom: `1px solid ${SOFT_BORDER}`, borderLeft: `3px solid ${accent}`, background: TYPE_ACCENT[node.type]?.tint }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1, fontSize: 15, fontWeight: 700, color: accent }, children: [_jsx("span", { title: typeLabel, style: { flexShrink: 0, display: 'flex' }, children: icon }), editingId ? (_jsx("input", { autoFocus: true, value: idDraft, onChange: (e) => setIdDraft(e.target.value), onBlur: commitId, onKeyDown: (e) => {
                                    if (e.key === 'Enter')
                                        commitId();
                                    if (e.key === 'Escape') {
                                        setIdDraft(node.id);
                                        setEditingId(false);
                                        setIdError(null);
                                    }
                                }, style: { minWidth: 0, flex: 1, fontSize: 14, fontFamily: 'monospace', fontWeight: 700, padding: '2px 7px', border: `1px solid ${accent}`, borderRadius: 4, background: '#fff', color: accent, outline: 'none' } })) : (_jsx("span", { onClick: () => setEditingId(true), title: "Click to rename", style: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace', cursor: 'text', borderBottom: `1px dashed ${accent}66` }, children: node.id }))] }), _jsxs("button", { onClick: onToggleQueried, title: queried
                            ? 'Queried — shown as a dashed outline on the canvas, flagged for SME review. Click to resolve.'
                            : 'OK — not flagged. Click to mark as queried (raises a question for SME review).', style: {
                            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                            fontSize: 10, fontWeight: 700, letterSpacing: 0.2, padding: '3px 9px', borderRadius: 999,
                            border: 'none', cursor: 'pointer', background: statusStyle.bg, color: statusStyle.fg,
                        }, children: [_jsx("span", { style: { width: 6, height: 6, borderRadius: '50%', background: statusStyle.dot, display: 'inline-block' } }), statusStyle.label] })] }), idError && _jsx("div", { style: { fontSize: 10, color: '#DC2626', marginTop: 4 }, children: idError })] }));
}
// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------
function Section({ children }) {
    return _jsx("div", { style: { padding: '12px 14px', borderBottom: `1px solid ${SOFT_BORDER}`, display: 'flex', flexDirection: 'column', gap: 9 }, children: children });
}
function SectionLabel({ accent, children }) {
    return _jsx("div", { style: { fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: accent }, children: children });
}
/** Label left-aligned, control right-aligned — the panel's standard row shape. */
function Field({ label, children, alignTop }) {
    return (_jsxs("div", { style: { display: 'flex', gap: 10, alignItems: alignTop ? 'flex-start' : 'center' }, children: [_jsx("span", { style: { width: 84, flexShrink: 0, fontSize: 11.5, color: LABEL, fontWeight: 500, paddingTop: alignTop ? 5 : 0 }, children: label }), _jsx("div", { style: { flex: 1, minWidth: 0, display: 'flex', justifyContent: 'flex-end' }, children: children })] }));
}
function TextInput({ value, onChange, accent, placeholder, readOnly }) {
    return (_jsx("input", { type: "text", value: value, readOnly: readOnly, placeholder: placeholder, onChange: (e) => onChange?.(e.target.value), onFocus: (e) => !readOnly && focusRing(e, accent), onBlur: (e) => blurRing(e, readOnly), style: inputStyle(accent, readOnly) }));
}
function TextArea({ value, onChange, accent }) {
    return (_jsx("textarea", { value: value, onChange: (e) => onChange(e.target.value), onFocus: (e) => focusRing(e, accent), onBlur: (e) => blurRing(e), rows: 2, placeholder: "\u2014", style: { ...inputStyle(accent), resize: 'vertical', minHeight: 44, fontFamily: 'inherit' } }));
}
function inputStyle(accent, readOnly) {
    return {
        width: '100%', textAlign: 'right', fontSize: 12, padding: '6px 9px', borderRadius: 6,
        border: `1px solid ${readOnly ? SOFT_BORDER : BORDER}`,
        background: readOnly ? SURFACE : '#fff',
        color: readOnly ? MUTED : INK,
        outline: 'none',
    };
}
function iconButtonStyle() {
    return {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 22, height: 22, padding: 0, border: 'none', borderRadius: 5,
        background: 'none', color: MUTED, cursor: 'pointer',
    };
}
function focusRing(e, accent) {
    e.currentTarget.style.borderColor = accent;
    e.currentTarget.style.boxShadow = `0 0 0 2px ${accent}22`;
}
function blurRing(e, readOnly) {
    e.currentTarget.style.borderColor = readOnly ? SOFT_BORDER : BORDER;
    e.currentTarget.style.boxShadow = 'none';
}
// ---------------------------------------------------------------------------
// Gateway (decision) section — kind selector + outcome rule modeller
// ---------------------------------------------------------------------------
function GatewaySection({ node, accent, allNodes, allEdges, onUpdateNode, onAddOutcome, onUpdateOutcome, onRemoveOutcome, }) {
    const [newName, setNewName] = useState('');
    const [newTarget, setNewTarget] = useState('');
    const outcomes = allEdges.filter((e) => e.source === node.id);
    const handleAdd = () => {
        const name = newName.trim();
        if (!name || !newTarget)
            return;
        onAddOutcome?.(node.id, name, newTarget);
        setNewName('');
        setNewTarget('');
    };
    return (_jsxs(Section, { children: [_jsx(SectionLabel, { accent: accent, children: "Gateway" }), _jsx(Field, { label: "Type", children: _jsx("select", { value: node.gatewayKind || 'exclusive', onChange: (e) => onUpdateNode?.(node.id, 'gatewayKind', e.target.value), onFocus: (e) => focusRing(e, accent), onBlur: (e) => blurRing(e), style: selectStyle(accent), children: GATEWAY_KIND_OPTIONS.map((o) => _jsx("option", { value: o.value, children: o.label }, o.value)) }) }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: 10, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', color: MUTED, marginBottom: 6 }, children: "Outcomes" }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 5 }, children: [outcomes.map((edge) => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 5, background: SURFACE, borderRadius: 7, padding: '5px 6px', border: `1px solid ${SOFT_BORDER}` }, children: [_jsx("input", { type: "text", defaultValue: edge.condition, onBlur: (e) => {
                                            const value = e.target.value.trim();
                                            if (value && value !== edge.condition)
                                                onUpdateOutcome?.(node.id, edge.condition, { name: value });
                                        }, style: { width: 74, flexShrink: 0, fontSize: 11, padding: '3px 6px', borderRadius: 5, border: `1px solid ${BORDER}`, background: '#fff', textAlign: 'right' } }), _jsx(ArrowRight, { size: 11, color: MUTED, style: { flexShrink: 0 } }), _jsx("select", { value: edge.target, onChange: (e) => onUpdateOutcome?.(node.id, edge.condition, { target: e.target.value }), style: { flex: 1, minWidth: 0, fontSize: 11, padding: '3px 6px', borderRadius: 5, border: `1px solid ${BORDER}`, background: '#fff' }, children: allNodes.map((n) => _jsx("option", { value: n.id, children: n.label }, n.id)) }), _jsxs("label", { title: "Happy path", style: { display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, fontSize: 10, color: LABEL, cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: Boolean(edge.primary), onChange: (e) => onUpdateOutcome?.(node.id, edge.condition, { primary: e.target.checked }), style: { accentColor: accent } }), "*"] }), _jsxs("label", { title: "Loop back", style: { display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, fontSize: 10, color: LABEL, cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: Boolean(edge.loop), onChange: (e) => onUpdateOutcome?.(node.id, edge.condition, { loop: e.target.checked }), style: { accentColor: accent } }), "loop"] }), _jsx("button", { onClick: () => onRemoveOutcome?.(node.id, edge.condition), title: "Remove outcome", style: { flexShrink: 0, display: 'flex', border: 'none', background: 'none', padding: 2, color: MUTED, cursor: 'pointer', borderRadius: 4 }, children: _jsx(Trash2, { size: 11 }) })] }, `${edge.source}-${edge.condition}-${edge.target}`))), outcomes.length === 0 && _jsx("div", { style: { fontSize: 11, color: MUTED, fontStyle: 'italic', padding: '4px 0' }, children: "No outcomes yet" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }, children: [_jsx("input", { type: "text", value: newName, onChange: (e) => setNewName(e.target.value), placeholder: "Outcome", style: { width: 74, flexShrink: 0, fontSize: 11, padding: '5px 7px', borderRadius: 5, border: `1px solid ${BORDER}`, background: '#fff' } }), _jsx(ArrowRight, { size: 11, color: MUTED, style: { flexShrink: 0 } }), _jsxs("select", { value: newTarget, onChange: (e) => setNewTarget(e.target.value), style: { flex: 1, minWidth: 0, fontSize: 11, padding: '5px 7px', borderRadius: 5, border: `1px solid ${BORDER}`, background: '#fff' }, children: [_jsx("option", { value: "", disabled: true, children: "Next step\u2026" }), allNodes.map((n) => _jsx("option", { value: n.id, children: n.label }, n.id))] }), _jsx("button", { onClick: handleAdd, disabled: !newName.trim() || !newTarget, style: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', background: !newName.trim() || !newTarget ? MUTED : accent, opacity: !newName.trim() || !newTarget ? 0.5 : 1 }, children: _jsx(Plus, { size: 13 }) })] })] })] }));
}
// ---------------------------------------------------------------------------
// Event section — event type + derived triggered-by / triggers
// ---------------------------------------------------------------------------
function EventSection({ node, accent, allEdges, onUpdateNode, onSelectNode, }) {
    const triggeredBy = allEdges.filter((e) => e.target === node.id).map((e) => e.source);
    const triggers = allEdges.filter((e) => e.source === node.id).map((e) => e.target);
    return (_jsxs(Section, { children: [_jsx(SectionLabel, { accent: accent, children: "Event" }), _jsx(Field, { label: "Type", children: _jsx("select", { value: node.eventType || 'message', onChange: (e) => onUpdateNode?.(node.id, 'eventType', e.target.value), onFocus: (e) => focusRing(e, accent), onBlur: (e) => blurRing(e), style: selectStyle(accent), children: EVENT_TYPE_OPTIONS.map((o) => _jsx("option", { value: o.value, children: o.label }, o.value)) }) }), _jsx(NodeRefList, { icon: _jsx(ArrowLeft, { size: 10 }), title: "Triggered by", ids: triggeredBy, onSelectNode: onSelectNode }), _jsx(NodeRefList, { icon: _jsx(ArrowRight, { size: 10 }), title: "Triggers", ids: triggers, onSelectNode: onSelectNode })] }));
}
function NodeRefList({ icon, title, ids, onSelectNode }) {
    return (_jsxs("div", { children: [_jsxs("div", { style: { fontSize: 10, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', color: MUTED, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }, children: [icon, title] }), ids.length === 0 ? (_jsx("div", { style: { fontSize: 11, color: MUTED, fontStyle: 'italic' }, children: "\u2014" })) : (_jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 5 }, children: ids.map((id) => (_jsx("button", { onClick: () => onSelectNode?.(id), style: { fontSize: 11, fontFamily: 'monospace', padding: '3px 8px', borderRadius: 999, border: 'none', background: SURFACE, color: LABEL, cursor: 'pointer' }, onMouseEnter: (e) => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.color = '#4338CA'; }, onMouseLeave: (e) => { e.currentTarget.style.background = SURFACE; e.currentTarget.style.color = LABEL; }, children: id }, id))) }))] }));
}
function selectStyle(accent) {
    return { width: '100%', textAlign: 'right', fontSize: 12, padding: '6px 9px', borderRadius: 6, border: `1px solid ${BORDER}`, background: '#fff', color: INK };
}
// ---------------------------------------------------------------------------
// Generic metadata (risk/sla/owner/app/rule/etc — shared across all three types)
// ---------------------------------------------------------------------------
function GenericMetadataSection({ node, accent, onUpdateNode, selectedElement, appCatalog = [], onAddAppCatalogEntry, }) {
    const [addingProperty, setAddingProperty] = useState(false);
    const handleMetadataChange = (key, value) => {
        if (!onUpdateNode)
            return;
        const metadata = { ...(node.metadata || {}) };
        if (key === 'app' || key === 'rule') {
            metadata[key] = value.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
        }
        else {
            metadata[key] = value;
        }
        onUpdateNode(selectedElement.id, 'metadata', metadata);
    };
    const handleSetAppList = (apps) => {
        if (!onUpdateNode)
            return;
        onUpdateNode(selectedElement.id, 'metadata', { ...(node.metadata || {}), app: apps });
    };
    const handleAddMetadata = (key) => {
        if (!onUpdateNode)
            return;
        onUpdateNode(selectedElement.id, 'metadata', { ...(node.metadata || {}), [key]: '' });
    };
    const handleRemoveMetadata = (key) => {
        if (!onUpdateNode)
            return;
        const metadata = { ...(node.metadata || {}) };
        delete metadata[key];
        onUpdateNode(selectedElement.id, 'metadata', metadata);
    };
    // Description and queried/? already have dedicated UI elsewhere in the panel;
    // NON_USER_METADATA_KEYS covers the rest (see its definition for why).
    const visibleMetadata = Object.entries(node.metadata || {}).filter(([k]) => k !== 'description' && !NON_USER_METADATA_KEYS.has(k));
    const existingKeys = new Set(visibleMetadata.map(([k]) => k));
    const availableKeys = PML_METADATA_PROPERTIES.filter((p) => p.key !== 'description' && !existingKeys.has(p.key));
    if (visibleMetadata.length === 0 && availableKeys.length === 0)
        return null;
    return (_jsxs(Section, { children: [_jsx(SectionLabel, { accent: accent, children: "Metadata" }), visibleMetadata.map(([key, value]) => {
                if (key === 'app') {
                    return (_jsx(AppMetadataField, { apps: Array.isArray(value) ? value : [], catalog: appCatalog, accent: accent, onChange: handleSetAppList, onAddCatalogEntry: onAddAppCatalogEntry, onRemoveField: () => handleRemoveMetadata(key) }, key));
                }
                const isReadOnly = key === 'risks' || key === 'changes';
                const displayValue = Array.isArray(value)
                    ? key === 'rule'
                        ? value.map((v) => String(v)).join(', ')
                        : value.map((v) => v.date || JSON.stringify(v)).join(', ')
                    : String(value);
                return (_jsx(Field, { label: key, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4, width: '100%' }, children: [_jsx("input", { type: "text", value: displayValue, readOnly: isReadOnly, onChange: (e) => handleMetadataChange(key, e.target.value), placeholder: "\u2014", onFocus: (e) => !isReadOnly && focusRing(e, accent), onBlur: (e) => blurRing(e, isReadOnly), style: inputStyle(accent, isReadOnly) }), !isReadOnly && (_jsx("button", { onClick: () => handleRemoveMetadata(key), style: { flexShrink: 0, display: 'flex', border: 'none', background: 'none', padding: 3, color: MUTED, cursor: 'pointer', borderRadius: 4 }, children: _jsx(Trash2, { size: 11 }) }))] }) }, key));
            }), availableKeys.length > 0 && (addingProperty ? (_jsxs("select", { autoFocus: true, onChange: (e) => { if (e.target.value)
                    handleAddMetadata(e.target.value); setAddingProperty(false); }, onBlur: () => setAddingProperty(false), style: { width: '100%', fontSize: 12, padding: '6px 9px', borderRadius: 6, border: `1px solid ${accent}`, background: '#fff' }, defaultValue: "", children: [_jsx("option", { value: "", disabled: true, children: "Select property\u2026" }), availableKeys.map((p) => _jsx("option", { value: p.key, children: p.label }, p.key))] })) : (_jsxs("button", { onClick: () => setAddingProperty(true), style: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: LABEL, background: 'none', border: 'none', cursor: 'pointer', padding: 0, alignSelf: 'flex-start' }, onMouseEnter: (e) => { e.currentTarget.style.color = accent; }, onMouseLeave: (e) => { e.currentTarget.style.color = LABEL; }, children: [_jsx(Plus, { size: 12 }), "Add property"] })))] }));
}
/**
 * Application field: a dropdown restricted to app_registry entries (no free text), each
 * currently-assigned app shown as a removable chip, plus a small "+" affordance to register
 * a brand-new app in the catalog (which every other task can then pick from too).
 */
function AppMetadataField({ apps, catalog, accent, onChange, onAddCatalogEntry, onRemoveField, }) {
    const [creating, setCreating] = useState(false);
    const [newId, setNewId] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const labelFor = (id) => catalog.find((c) => c.id === id)?.description || id;
    const available = catalog.filter((c) => !apps.includes(c.id));
    const handleSelect = (id) => {
        if (!id || apps.includes(id))
            return;
        onChange([...apps, id]);
    };
    const handleRemove = (id) => {
        const next = apps.filter((a) => a !== id);
        if (next.length === 0) {
            onRemoveField();
        }
        else {
            onChange(next);
        }
    };
    const handleCreate = () => {
        const id = newId.trim();
        if (!id || !onAddCatalogEntry)
            return;
        onAddCatalogEntry(id, newLabel.trim() || id);
        if (!apps.includes(id))
            onChange([...apps, id]);
        setNewId('');
        setNewLabel('');
        setCreating(false);
    };
    return (_jsx(Field, { label: "app", alignTop: true, children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 5, width: '100%', alignItems: 'stretch' }, children: [apps.map((id) => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx("span", { title: id, style: {
                                flex: 1, minWidth: 0, textAlign: 'right', fontSize: 12, padding: '5px 9px',
                                borderRadius: 6, border: `1px solid ${BORDER}`, background: SURFACE, color: INK,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }, children: labelFor(id) }), _jsx("button", { onClick: () => handleRemove(id), style: { flexShrink: 0, display: 'flex', border: 'none', background: 'none', padding: 3, color: MUTED, cursor: 'pointer', borderRadius: 4 }, children: _jsx(Trash2, { size: 11 }) })] }, id))), creating ? (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 4, padding: 6, borderRadius: 6, border: `1px dashed ${accent}` }, children: [_jsx("input", { autoFocus: true, type: "text", value: newId, onChange: (e) => setNewId(e.target.value), placeholder: "app id (e.g. core_banking)", style: { ...inputStyle(accent), textAlign: 'left' } }), _jsx("input", { type: "text", value: newLabel, onChange: (e) => setNewLabel(e.target.value), placeholder: "display name (optional)", onKeyDown: (e) => { if (e.key === 'Enter')
                                handleCreate(); if (e.key === 'Escape')
                                setCreating(false); }, style: { ...inputStyle(accent), textAlign: 'left' } }), _jsxs("div", { style: { display: 'flex', gap: 6, justifyContent: 'flex-end' }, children: [_jsx("button", { onClick: () => setCreating(false), style: { fontSize: 11, color: MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }, children: "Cancel" }), _jsx("button", { onClick: handleCreate, disabled: !newId.trim(), style: { fontSize: 11, fontWeight: 600, color: '#fff', background: accent, border: 'none', borderRadius: 4, cursor: newId.trim() ? 'pointer' : 'not-allowed', padding: '3px 8px', opacity: newId.trim() ? 1 : 0.5 }, children: "Add" })] })] })) : (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsxs("select", { onChange: (e) => { handleSelect(e.target.value); e.target.value = ''; }, value: "", disabled: available.length === 0, style: { ...selectStyle(accent), textAlign: 'left', opacity: available.length === 0 ? 0.5 : 1 }, children: [_jsx("option", { value: "", disabled: true, children: available.length > 0 ? 'Add app…' : 'All apps assigned' }), available.map((c) => _jsx("option", { value: c.id, children: c.description || c.id }, c.id))] }), onAddCatalogEntry && (_jsx("button", { onClick: () => setCreating(true), title: "Register a new app", style: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, border: `1px solid ${BORDER}`, borderRadius: 5, background: '#fff', color: LABEL, cursor: 'pointer' }, children: _jsx(Plus, { size: 12 }) }))] }))] }) }));
}
// ---------------------------------------------------------------------------
// Fallback — edges, lanes, subprocesses (out of scope for the type-specific redesign)
// ---------------------------------------------------------------------------
function FallbackView({ node }) {
    const metadata = Object.entries(node.metadata || {}).filter(([k]) => !NON_USER_METADATA_KEYS.has(k));
    return (_jsxs(Section, { children: [_jsx(Field, { label: "Type", children: _jsx("span", { style: { fontSize: 12, fontFamily: 'monospace', color: LABEL }, children: node.type }) }), _jsx(Field, { label: "ID", children: _jsx("span", { style: { fontSize: 12, fontFamily: 'monospace', color: LABEL }, children: node.id }) }), node.label && _jsx(Field, { label: "Label", children: _jsx("span", { style: { fontSize: 12, color: INK }, children: node.label }) }), metadata.map(([key, value]) => (_jsx(Field, { label: key, children: _jsx("span", { style: { fontSize: 12, color: LABEL }, children: Array.isArray(value) ? JSON.stringify(value) : String(value) }) }, key)))] }));
}
