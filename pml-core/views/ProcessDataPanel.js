'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Table2, Plus, X } from 'lucide-react';
/** Maps a data category to the catalog it draws descriptions from, where one exists. */
const CATEGORY_CATALOG_KIND = {
    risk: 'risk_register',
    app: 'app_registry',
    businessRule: 'rule_library',
};
const DATA_CATEGORIES = [
    { key: 'nodes', label: 'All Elements', colHeader: 'Type', actorHeader: 'Lane' },
    { key: 'risk', label: 'Risk', colHeader: 'Risk ID', actorHeader: 'Lane' },
    { key: 'sla', label: 'SLA', colHeader: 'SLA', actorHeader: 'Lane' },
    { key: 'raci', label: 'RACI', colHeader: 'Owner (A)', actorHeader: 'Actor (R)' },
    { key: 'app', label: 'Apps', colHeader: 'Application', actorHeader: 'Lane' },
    { key: 'businessRule', label: 'Business Rules', colHeader: 'Rule', actorHeader: 'Lane' },
];
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const ProcessDataPanel = ({ isOpen, onTogglePanel, overlayEntries, activeCategory = 'nodes', selectedNode, allNodes = [], catalogs, onSetCategory, onAdd, onEdit, onRemove, onSelectNode, onSetCatalogEntry, }) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen)
                onTogglePanel();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onTogglePanel]);
    const panelHeight = isOpen ? 320 : 24;
    return (_jsxs("div", { style: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: panelHeight,
            background: '#fff',
            borderTop: '1.5px solid #6366F1',
            boxShadow: isOpen ? '0 -2px 12px rgba(0,0,0,0.08)' : 'none',
            transition: 'height 0.2s ease-out',
            zIndex: 30,
            overflow: 'hidden',
        }, children: [_jsxs("div", { style: { display: 'flex', height: 24, borderBottom: isOpen ? '1px solid #F1F5F9' : 'none' }, children: [_jsx(TriggerTab, { isOpen: isOpen, dataBadge: totalEntries(overlayEntries), onClick: onTogglePanel }), isOpen && (_jsx("button", { onClick: onTogglePanel, title: "Close panel", style: {
                            marginLeft: 'auto',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 24, height: 24, padding: 0, border: 'none',
                            background: 'none', cursor: 'pointer', color: '#94A3B8',
                        }, onMouseEnter: e => { e.currentTarget.style.color = '#475569'; }, onMouseLeave: e => { e.currentTarget.style.color = '#94A3B8'; }, children: _jsx(X, { size: 12 }) }))] }), isOpen && (_jsx(DataContent, { entries: overlayEntries, activeCategory: activeCategory, selectedNode: selectedNode ?? null, allNodes: allNodes, catalogs: catalogs, height: panelHeight - 24, onSetCategory: onSetCategory, onAdd: onAdd, onEdit: onEdit, onRemove: onRemove, onSelectNode: onSelectNode, onSetCatalogEntry: onSetCatalogEntry }))] }));
};
// ---------------------------------------------------------------------------
// Trigger tab
// ---------------------------------------------------------------------------
const TriggerTab = ({ isOpen, dataBadge, onClick }) => (_jsxs("button", { onClick: onClick, style: {
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '0 12px', height: 24,
        background: isOpen ? '#F8FAFF' : 'none',
        border: 'none',
        borderRight: '1px solid #F1F5F9',
        cursor: 'pointer', fontSize: 11,
        color: isOpen ? '#4338CA' : '#64748B',
        fontWeight: isOpen ? 600 : 400,
        transition: 'color 0.1s, background 0.1s',
    }, onMouseEnter: e => { if (!isOpen) {
        e.currentTarget.style.background = '#F1F5F9';
        e.currentTarget.style.color = '#1E293B';
    } }, onMouseLeave: e => { if (!isOpen) {
        e.currentTarget.style.background = 'none';
        e.currentTarget.style.color = '#64748B';
    } }, children: [_jsx(Table2, { size: 12 }), _jsx("span", { children: "Process data" }), dataBadge !== undefined && dataBadge > 0 && (_jsx("span", { style: {
                background: '#6366F1', color: '#fff',
                borderRadius: 8, fontSize: 9, padding: '0 4px', lineHeight: '14px',
            }, children: dataBadge })), isOpen ? _jsx(ChevronDown, { size: 11 }) : _jsx(ChevronUp, { size: 11 })] }));
// ---------------------------------------------------------------------------
// Data tab content
// ---------------------------------------------------------------------------
const DataContent = ({ entries, activeCategory, selectedNode, allNodes, catalogs, height, onSetCategory, onAdd, onEdit, onRemove, onSelectNode, onSetCatalogEntry }) => {
    const [input, setInput] = useState('');
    const [addNodeId, setAddNodeId] = useState('');
    const catDef = DATA_CATEGORIES.find(c => c.key === activeCategory);
    const catalogKind = CATEGORY_CATALOG_KIND[activeCategory];
    const catalogEntries = catalogKind ? catalogs?.[catalogKind] ?? [] : null;
    useEffect(() => {
        setAddNodeId(selectedNode?.id ?? '');
    }, [selectedNode, activeCategory]);
    if (activeCategory === 'nodes') {
        const nodeRows = entries.nodes;
        return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', height }, children: [_jsx(CategoryPillBar, { entries: entries, activeCategory: activeCategory, onSetCategory: onSetCategory }), _jsx("div", { style: { flex: 1, overflowY: 'auto', minHeight: 0 }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 12 }, children: [_jsx("thead", { children: _jsxs("tr", { style: { background: '#F8FAFC', position: 'sticky', top: 0 }, children: [_jsx(Th, { children: "Node" }), _jsx(Th, { children: "Type" }), _jsx(Th, { children: "Lane" }), _jsx(Th, { children: "Meta" })] }) }), _jsxs("tbody", { children: [nodeRows.map((row) => (_jsxs("tr", { onClick: () => onSelectNode(row.nodeId), style: { borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }, onMouseEnter: e => (e.currentTarget.style.background = '#FAFAFA'), onMouseLeave: e => (e.currentTarget.style.background = ''), children: [_jsx(Td, { title: row.label, children: _jsx("span", { style: { display: 'block', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: row.label }) }), _jsx(Td, { children: _jsx("span", { style: { color: '#64748B' }, children: row.type }) }), _jsx(Td, { children: _jsx("span", { style: { color: '#64748B' }, children: row.actor || '—' }) }), _jsx(Td, { children: _jsx("span", { style: { color: '#94A3B8' }, children: row.metaCount || '—' }) })] }, row.nodeId))), nodeRows.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 4, style: { padding: '16px 12px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }, children: "No elements in this process yet." }) }))] })] }) })] }));
    }
    const rows = entries[activeCategory] ?? [];
    const handleAdd = () => {
        const value = input.trim();
        const nodeId = addNodeId || selectedNode?.id;
        if (!nodeId || !value)
            return;
        onAdd(nodeId, activeCategory, value);
        setInput('');
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', height }, children: [_jsx(CategoryPillBar, { entries: entries, activeCategory: activeCategory, onSetCategory: onSetCategory }), _jsx("div", { style: { flex: 1, overflowY: 'auto', minHeight: 0 }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', fontSize: 12 }, children: [_jsx("thead", { children: _jsxs("tr", { style: { background: '#F8FAFC', position: 'sticky', top: 0 }, children: [_jsx(Th, { children: "Node" }), _jsx(Th, { children: catDef.actorHeader }), _jsx(Th, { children: catDef.colHeader }), catalogKind && _jsx(Th, { children: "Description" }), _jsx("th", { style: { width: 32, padding: '6px 8px' } })] }) }), _jsxs("tbody", { children: [rows.map((row, idx) => {
                                    const catalogEntry = catalogEntries?.find(e => e.id === row.value);
                                    return (_jsxs("tr", { style: { borderBottom: '1px solid #F1F5F9' }, onMouseEnter: e => (e.currentTarget.style.background = '#FAFAFA'), onMouseLeave: e => (e.currentTarget.style.background = ''), children: [_jsx(Td, { title: row.label, children: _jsx("span", { style: { display: 'block', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: row.label }) }), _jsx(Td, { children: _jsx("span", { style: { color: '#64748B' }, children: row.actor || '—' }) }), _jsx(Td, { children: _jsx(EditableValue, { value: row.value, onCommit: (newValue) => {
                                                        if (newValue && newValue !== row.value)
                                                            onEdit(row.nodeId, activeCategory, row.value, newValue);
                                                    } }) }), catalogKind && (_jsx(Td, { children: _jsx(EditableValue, { value: catalogEntry?.description ?? '', placeholder: "+ define\u2026", onCommit: (desc) => {
                                                        if (desc)
                                                            onSetCatalogEntry(catalogKind, row.value, desc);
                                                    } }) })), _jsx("td", { style: { padding: '4px 8px', textAlign: 'center' }, children: _jsx("button", { onClick: () => onRemove(row.nodeId, row.value), title: "Remove", style: {
                                                        border: 'none', borderRadius: 4, width: 20, height: 20,
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        background: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0,
                                                    }, onMouseEnter: e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }, onMouseLeave: e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94A3B8'; }, children: _jsx(X, { size: 11 }) }) })] }, `${row.nodeId}-${row.value}-${idx}`));
                                }), rows.length === 0 && (_jsx("tr", { children: _jsxs("td", { colSpan: catalogKind ? 5 : 4, style: { padding: '16px 12px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }, children: ["No ", catDef.label.toLowerCase(), " entries across this process."] }) }))] })] }) }), _jsxs("div", { style: { padding: '6px 12px', borderTop: '1px solid #F1F5F9', flexShrink: 0, display: 'flex', gap: 6, alignItems: 'center' }, children: [_jsxs("select", { value: addNodeId, onChange: e => setAddNodeId(e.target.value), style: {
                            minWidth: 90, maxWidth: 110, border: '1px solid #CBD5E1', borderRadius: 4,
                            fontSize: 11, padding: '4px 6px', background: '#fff', color: '#334155',
                        }, children: [_jsx("option", { value: "", disabled: true, children: "Select node\u2026" }), allNodes.map(n => (_jsx("option", { value: n.id, children: n.label }, n.id)))] }), _jsx("input", { value: input, onChange: e => setInput(e.target.value), placeholder: `Add ${catDef.colHeader.toLowerCase()}…`, disabled: !addNodeId, onKeyDown: e => { if (e.key === 'Enter')
                            handleAdd(); }, style: {
                            flex: 1, border: '1px solid #CBD5E1', borderRadius: 4,
                            fontSize: 11, padding: '4px 8px',
                            background: addNodeId ? '#fff' : '#F8FAFC',
                            color: '#334155',
                        } }), _jsxs("button", { onClick: handleAdd, disabled: !addNodeId || input.trim().length === 0, style: {
                            display: 'flex', alignItems: 'center', gap: 4,
                            border: 'none', borderRadius: 4, padding: '4px 10px',
                            fontSize: 11, fontWeight: 500, color: '#fff',
                            background: addNodeId && input.trim().length > 0 ? '#6366F1' : '#CBD5E1',
                            cursor: addNodeId && input.trim().length > 0 ? 'pointer' : 'not-allowed',
                            flexShrink: 0,
                        }, children: [_jsx(Plus, { size: 11 }), "Add"] })] })] }));
};
const CategoryPillBar = ({ entries, activeCategory, onSetCategory }) => (_jsx("div", { style: { display: 'flex', gap: 2, padding: '6px 12px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }, children: DATA_CATEGORIES.map(cat => {
        const count = cat.key === 'nodes' ? entries.nodes.length : entries[cat.key]?.length ?? 0;
        const active = cat.key === activeCategory;
        return (_jsxs("button", { onClick: () => onSetCategory(cat.key), style: {
                border: 'none', borderRadius: 999, padding: '3px 8px',
                fontSize: 11, cursor: 'pointer',
                background: active ? '#EEF2FF' : '#F8FAFC',
                color: active ? '#4338CA' : '#475569',
                fontWeight: active ? 600 : 400,
            }, children: [cat.label, " ", count > 0 && _jsxs("span", { style: { opacity: 0.7 }, children: ["(", count, ")"] })] }, cat.key));
    }) }));
/** An inline text cell that becomes an editable input on click, committing on blur/Enter. */
const EditableValue = ({ value, placeholder, onCommit }) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    useEffect(() => { setDraft(value); }, [value]);
    const commit = () => {
        setEditing(false);
        const trimmed = draft.trim();
        if (trimmed !== value)
            onCommit(trimmed);
    };
    if (editing) {
        return (_jsx("input", { autoFocus: true, value: draft, onChange: e => setDraft(e.target.value), onBlur: commit, onKeyDown: e => { if (e.key === 'Enter')
                commit(); if (e.key === 'Escape') {
                setDraft(value);
                setEditing(false);
            } }, style: {
                width: '100%', border: '1px solid #A5B4FC', borderRadius: 4,
                fontSize: 11, padding: '2px 6px', background: '#fff', color: '#334155',
            } }));
    }
    return (_jsx("span", { onClick: () => setEditing(true), title: value || placeholder, style: {
            display: 'block', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            cursor: 'text', color: value ? undefined : '#94A3B8', fontStyle: value ? undefined : 'italic',
        }, children: value || placeholder || '—' }));
};
// ---------------------------------------------------------------------------
// Shared primitive components
// ---------------------------------------------------------------------------
const Th = ({ children }) => (_jsx("th", { style: { padding: '6px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #E2E8F0' }, children: children }));
const Td = ({ children, title }) => (_jsx("td", { title: title, style: { padding: '6px 12px', color: '#0F172A', verticalAlign: 'middle' }, children: children }));
// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function totalEntries(entries) {
    return DATA_CATEGORIES.reduce((sum, cat) => sum + (entries[cat.key]?.length ?? 0), 0);
}
