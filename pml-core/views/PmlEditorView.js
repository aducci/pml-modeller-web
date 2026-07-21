'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import Editor from '@monaco-editor/react';
import { FolderOpen, ChevronDown, Save, AlertCircle, AlertTriangle, Info, ChevronUp, Wrench, Star, FileText, Plus } from 'lucide-react';
import { computeQualityScore } from '../core/diagnostics';
function toDisplayName(filename) {
    const base = filename.split('/').pop()?.replace(/\.pml$/, '') ?? filename;
    return base.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function groupFiles(files) {
    const map = new Map();
    for (const f of files) {
        const parts = f.split('/');
        const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
        if (!map.has(folder))
            map.set(folder, []);
        map.get(folder).push(f);
    }
    return [...map.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([folder, fs]) => ({ folder, files: fs.sort((a, b) => a.localeCompare(b)) }));
}
export const PmlEditorView = forwardRef(({ content, onChange, diagnostics = [], files: projectFiles, activeFileId, onSelectFile, onCreateFile, }, ref) => {
    const isProjectFileMode = projectFiles !== undefined;
    const monacoRef = useRef(null);
    const editorRef = useRef(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [legacyFiles, setLegacyFiles] = useState([]);
    const [currentFile, setCurrentFile] = useState(null);
    const currentFileRef = useRef(null);
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);
    const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    useImperativeHandle(ref, () => ({
        revealLine(line) {
            if (editorRef.current) {
                editorRef.current.revealLineInCenter(line);
                editorRef.current.setPosition({ lineNumber: line, column: 1 });
                editorRef.current.focus();
            }
        }
    }));
    useEffect(() => {
        if (!showDropdown)
            return;
        const handleOutsideClick = (e) => {
            if (buttonRef.current && !buttonRef.current.contains(e.target) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [showDropdown]);
    useEffect(() => {
        if (!monacoRef.current || !editorRef.current)
            return;
        const model = editorRef.current.getModel();
        if (!model)
            return;
        const monaco = monacoRef.current;
        const markers = diagnostics
            .filter(d => d.source)
            .map(d => {
            let severity = monaco.MarkerSeverity.Error;
            if (d.severity === 'warning')
                severity = monaco.MarkerSeverity.Warning;
            if (d.severity === 'info')
                severity = monaco.MarkerSeverity.Info;
            return {
                severity,
                message: d.message,
                startLineNumber: d.source.startLine,
                startColumn: d.source.startColumn,
                endLineNumber: d.source.endLine,
                endColumn: d.source.endColumn,
            };
        });
        monaco.editor.setModelMarkers(model, 'pml', markers);
    }, [diagnostics, content]);
    const fetchFiles = async () => {
        if (isProjectFileMode) {
            // Caller already supplied the list — nothing to fetch.
            setShowDropdown(true);
            return;
        }
        try {
            const res = await fetch('/processes/index.json');
            if (res.ok) {
                const data = await res.json();
                setLegacyFiles(data.files || []);
            }
        }
        catch {
            // no file index
        }
        setShowDropdown(true);
    };
    const saveFile = async () => {
        const file = currentFileRef.current;
        const text = editorRef.current?.getValue() ?? '';
        if (!file)
            return;
        await fetch(`/processes/${encodeURIComponent(file)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: text,
        });
    };
    const loadFile = async (filename) => {
        try {
            const res = await fetch(`/processes/${filename}`);
            if (res.ok) {
                onChange(await res.text());
                setCurrentFile(filename);
                currentFileRef.current = filename;
                setShowDropdown(false);
            }
        }
        catch {
            // ignore
        }
    };
    const handleEditorMount = useCallback((editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        editor.onDidChangeCursorPosition((e) => {
            setCursorPos({ line: e.position.lineNumber, col: e.position.column });
        });
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            const text = editor.getValue();
            const file = currentFileRef.current;
            if (file) {
                fetch(`/processes/${encodeURIComponent(file)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: text,
                }).catch(() => { });
            }
            else {
                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'process.pml';
                a.click();
                URL.revokeObjectURL(url);
            }
        });
        if (!monaco.languages.getLanguages().some((lang) => lang.id === 'pml')) {
            const keywords = ['actor', 'event', 'task', 'decision', 'subprocess', 'flow', 'as'];
            monaco.languages.register({ id: 'pml' });
            monaco.languages.setMonarchTokensProvider('pml', {
                tokenizer: {
                    root: [
                        [/\/\/.*$/, 'comment'],
                        [/^\s*#.*$/, 'comment'],
                        [/^\s*[@]process\b.*$/, 'keyword.directive'],
                        [new RegExp(`\\b(${keywords.join('|')})\\b`), 'keyword.declaration'],
                        [/\b(inScope|external|boundary|inbound|outbound|internal)\b/, 'keyword.meta'],
                        [/[a-zA-Z_][a-zA-Z0-9_]*=/, 'attribute.key'],
                        [/->|<|>/, 'operator.arrow'],
                        [/[{}]/, 'delimiter.bracket'],
                        [/[()]/, 'delimiter.parenthesis'],
                        [/"[^"]*"/, 'string'],
                        [/[0-9]+/, 'number'],
                    ],
                },
            });
            monaco.editor.defineTheme('pmlTheme', {
                base: 'vs',
                inherit: true,
                rules: [
                    { token: 'comment', foreground: '94A3B8' },
                    { token: 'keyword.directive', foreground: '7C3AED' },
                    { token: 'keyword.declaration', foreground: '2563EB', fontStyle: 'bold' },
                    { token: 'keyword.meta', foreground: '059669', fontStyle: 'italic' },
                    { token: 'attribute.key', foreground: 'D97706' },
                    { token: 'operator.arrow', foreground: '94A3B8' },
                    { token: 'delimiter.bracket', foreground: '334155' },
                    { token: 'delimiter.parenthesis', foreground: '334155' },
                    { token: 'string', foreground: '16A34A' },
                    { token: 'number', foreground: '0284C7' },
                ],
                colors: {
                    'editor.background': '#FAFAFA',
                    'editorLineNumber.foreground': '#CBD5E1',
                    'editorLineNumber.activeForeground': '#64748B',
                    'editor.lineHighlightBackground': '#F1F5F9',
                },
            });
        }
        // TODO: Implement process interface link styling when viewPanel.processInterfacesOn is true
        // The Monaco editor should render `-> [process-name]` patterns as clickable hyperlinks
        // See ProcessWorkspaceView for breadcrumb integration
        monaco.editor.setTheme('pmlTheme');
    }, []);
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }, className: "bg-[#FAFAFA] border-r border-slate-200", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 36, flexShrink: 0 }, className: "px-3 bg-slate-50 border-b border-slate-200", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-widest text-slate-400 select-none", children: "PML Editor" }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 2 }, children: [!isProjectFileMode && currentFile && (_jsx("button", { onClick: saveFile, title: "Save (Ctrl+S)", className: "flex items-center px-2 py-1 rounded text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors", children: _jsx(Save, { size: 13 }) })), _jsxs("div", { style: { position: 'relative' }, children: [_jsxs("button", { ref: buttonRef, onClick: () => showDropdown ? setShowDropdown(false) : fetchFiles(), title: isProjectFileMode ? 'Switch file' : 'Open process file', className: "flex items-center gap-1 px-2 py-1 rounded text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors text-xs", children: [_jsx(FolderOpen, { size: 13 }), _jsx(ChevronDown, { size: 10 })] }), showDropdown && isProjectFileMode && (_jsxs("div", { ref: dropdownRef, style: { position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 50, minWidth: 220 }, className: "bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden", children: [_jsx("div", { className: "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100", children: "Files in this project" }), projectFiles.length === 0 && (_jsx("div", { className: "px-3 py-3 text-xs text-slate-400 italic", children: "No files found" })), projectFiles.map((f) => (_jsxs("button", { onClick: () => { onSelectFile?.(f.id); setShowDropdown(false); }, className: `flex w-full items-center gap-1.5 text-left px-3 py-1 text-[12px] leading-tight border-b border-slate-50 last:border-0 transition-colors ${f.id === activeFileId
                                                    ? 'bg-teal/10 text-teal font-semibold'
                                                    : 'text-slate-600 font-medium hover:bg-teal/10 hover:text-teal'}`, children: [_jsx(FileText, { size: 11, className: f.id === activeFileId ? 'text-teal shrink-0' : 'text-slate-400 shrink-0' }), _jsx("span", { className: "truncate", children: f.name })] }, f.id))), onCreateFile && (_jsxs("button", { onClick: () => { onCreateFile(); setShowDropdown(false); }, className: "flex w-full items-center gap-1.5 text-left px-3 py-1.5 text-[12px] font-medium text-teal hover:bg-teal/10 border-t border-slate-100 transition-colors", children: [_jsx(Plus, { size: 11, className: "shrink-0" }), "New file"] }))] })), showDropdown && !isProjectFileMode && (_jsxs("div", { ref: dropdownRef, style: { position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 50, minWidth: 220 }, className: "bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden", children: [_jsx("div", { className: "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100", children: "Processes" }), legacyFiles.length === 0 && (_jsx("div", { className: "px-3 py-3 text-xs text-slate-400 italic", children: "No files found" })), groupFiles(legacyFiles).map(({ folder, files: groupedFiles }) => (_jsxs("div", { children: [folder && (_jsx("div", { className: "px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100 border-t border-slate-100 mt-0.5 first:mt-0", children: folder })), groupedFiles.map(f => (_jsx("button", { onClick: () => loadFile(f), className: "w-full text-left px-3 py-1.5 text-[13px] text-slate-700 hover:bg-blue-50 hover:text-blue-700 border-b border-slate-50 last:border-0 transition-colors", children: toDisplayName(f) }, f)))] }, folder || '__root__')))] }))] })] })] }), _jsx("div", { style: { flex: 1, minHeight: 0, position: 'relative' }, children: _jsx("div", { style: { position: 'absolute', inset: 0 }, children: _jsx(Editor, { height: "100%", language: "pml", value: content, onChange: (v) => onChange(v ?? ''), onMount: handleEditorMount, options: {
                            minimap: { enabled: false },
                            wordWrap: 'on',
                            fontSize: 12,
                            lineHeight: 18,
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            scrollBeyondLastLine: false,
                            renderLineHighlight: 'line',
                            lineNumbers: 'on',
                            glyphMargin: false,
                            folding: true,
                            guides: { indentation: true, bracketPairs: true },
                            matchBrackets: 'always',
                            lineDecorationsWidth: 4,
                            lineNumbersMinChars: 3,
                            padding: { top: 12, bottom: 12 },
                        } }) }) }), showDiagnostics && diagnostics.length > 0 && (_jsxs("div", { style: { flexShrink: 0, maxHeight: 180, overflowY: 'auto', borderTop: '1px solid #E2E8F0' }, className: "bg-white", children: [(() => {
                        const score = computeQualityScore(diagnostics);
                        const scoreColor = score >= 80 ? '#059669' : score >= 50 ? '#D97706' : '#DC2626';
                        return (_jsxs("div", { style: {
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '5px 10px', fontSize: 11,
                                borderBottom: '1px solid #F1F5F9', color: '#64748B',
                            }, children: [_jsx(Star, { size: 12, color: scoreColor, fill: scoreColor }), _jsxs("span", { style: { fontWeight: 600, color: scoreColor }, children: [score, "/100"] }), _jsx("span", { style: { color: '#94A3B8' }, children: "Model quality" }), _jsxs("span", { style: { marginLeft: 'auto', fontSize: 10, color: '#94A3B8' }, children: [diagnostics.filter(d => d.severity === 'error').length, " err \u00B7 ", diagnostics.filter(d => d.severity === 'warning').length, " warn"] })] }));
                    })(), diagnostics.map((d, i) => {
                        const isErr = d.severity === 'error';
                        const isWarn = d.severity === 'warning';
                        return (_jsxs("div", { role: "button", tabIndex: 0, onClick: () => {
                                if (d.source && editorRef.current) {
                                    editorRef.current.revealLineInCenter(d.source.startLine);
                                    editorRef.current.setPosition({ lineNumber: d.source.startLine, column: d.source.startColumn ?? 1 });
                                    editorRef.current.focus();
                                }
                            }, onKeyDown: (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    if (d.source && editorRef.current) {
                                        editorRef.current.revealLineInCenter(d.source.startLine);
                                        editorRef.current.setPosition({ lineNumber: d.source.startLine, column: d.source.startColumn ?? 1 });
                                        editorRef.current.focus();
                                    }
                                }
                            }, style: {
                                display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%',
                                padding: '5px 10px', textAlign: 'left', background: isErr ? '#FEF2F2' : isWarn ? '#FFFBEB' : '#F8FAFC',
                                border: 'none',
                                borderBottom: '1px solid #F1F5F9', cursor: d.source ? 'pointer' : 'default',
                                userSelect: 'text',
                            }, children: [_jsx("span", { style: { flexShrink: 0, marginTop: 1, color: isErr ? '#DC2626' : isWarn ? '#D97706' : '#64748B' }, children: isErr ? _jsx(AlertCircle, { size: 11 }) : isWarn ? _jsx(AlertTriangle, { size: 11 }) : _jsx(Info, { size: 11 }) }), _jsx("span", { style: { flex: 1, userSelect: 'text', fontSize: 12, lineHeight: 1.5, color: '#1F2937' }, children: d.message }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }, children: [d.fix && (_jsxs("button", { onClick: (e) => {
                                                e.stopPropagation();
                                                if (editorRef.current && d.source) {
                                                    const model = editorRef.current.getModel();
                                                    if (!model)
                                                        return;
                                                    const lineText = model.getLineContent(d.source.startLine);
                                                    const fixed = lineText.replace(/->/g, '>');
                                                    const range = new monacoRef.current.Range(d.source.startLine, 1, d.source.startLine, lineText.length + 1);
                                                    // Use executeEdits instead of pushEditOperations — it
                                                    // properly integrates with Monaco's undo stack and
                                                    // triggers the onDidChangeContent event naturally.
                                                    editorRef.current.executeEdits('pml-fix', [
                                                        { range, text: fixed, forceMoveMarkers: true },
                                                    ]);
                                                    // No need to call onChange manually — Monaco's
                                                    // onDidChangeContent handler fires automatically,
                                                    // which triggers the editor's onChange callback.
                                                }
                                            }, title: d.fix.label, style: {
                                                display: 'flex', alignItems: 'center', gap: 3,
                                                padding: '2px 6px', borderRadius: 4, border: '1px solid #E5E7EB',
                                                background: '#fff', color: '#059669', fontSize: 11, fontWeight: 600,
                                                cursor: 'pointer', whiteSpace: 'nowrap',
                                            }, onMouseEnter: e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.borderColor = '#A7F3D0'; }, onMouseLeave: e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E5E7EB'; }, children: [_jsx(Wrench, { size: 10 }), d.fix.label] })), d.source && (_jsxs("span", { style: {
                                                flexShrink: 0, fontVariantNumeric: 'tabular-nums', userSelect: 'text',
                                                fontSize: 10, color: '#94A3B8',
                                            }, children: ["Ln ", d.source.startLine] }))] })] }, i));
                    })] })), (() => {
                const errors = diagnostics.filter(d => d.severity === 'error').length;
                const warnings = diagnostics.filter(d => d.severity === 'warning').length;
                const qualityScore = computeQualityScore(diagnostics);
                const badgeColor = errors > 0 ? '#EF4444' : warnings > 0 ? '#F59E0B' : qualityScore >= 80 ? '#059669' : '#F59E0B';
                const badgeLabel = errors > 0 ? `${errors} error${errors > 1 ? 's' : ''}` : warnings > 0 ? `${warnings} warning${warnings > 1 ? 's' : ''}` : `${qualityScore}/100`;
                return (_jsxs("div", { style: {
                        flexShrink: 0, height: 22, display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', padding: '0 10px',
                        borderTop: '1px solid #E2E8F0', background: '#F8FAFC',
                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsxs("button", { onClick: () => setShowDiagnostics(s => !s), style: { display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }, children: [_jsx("span", { style: { width: 6, height: 6, borderRadius: '50%', background: badgeColor, flexShrink: 0 } }), _jsx("span", { style: { fontSize: 10, color: errors > 0 ? '#EF4444' : warnings > 0 ? '#F59E0B' : '#64748B', fontWeight: 500 }, children: badgeLabel }), diagnostics.length > 0 && (_jsx(ChevronUp, { size: 9, style: { color: '#94A3B8', transform: showDiagnostics ? 'none' : 'rotate(180deg)', transition: 'transform 0.15s' } }))] }), diagnostics.length > 0 && qualityScore < 100 && (_jsxs("span", { style: { fontSize: 10, color: '#94A3B8' }, children: ["Quality: ", _jsxs("span", { style: { fontWeight: 600, color: qualityScore >= 80 ? '#059669' : qualityScore >= 50 ? '#D97706' : '#DC2626' }, children: [qualityScore, "/100"] })] }))] }), _jsxs("span", { style: { fontSize: 10, color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }, children: ["Ln ", cursorPos.line, ", Col ", cursorPos.col] })] }));
            })()] }));
});
