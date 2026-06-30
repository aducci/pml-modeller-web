import React, { useCallback, useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import Editor from '@monaco-editor/react';
import { FolderOpen, ChevronDown, Save, AlertCircle, AlertTriangle, Info, ChevronUp } from 'lucide-react';
import { ProcessDiagnostic } from 'pml-core';

export interface PmlEditorRef {
  revealLine: (line: number) => void;
}

export interface PmlEditorViewProps {
  content: string;
  onChange: (content: string) => void;
  diagnostics?: ProcessDiagnostic[];
}

function toDisplayName(filename: string): string {
  const base = filename.split('/').pop()?.replace(/\.pml$/, '') ?? filename;
  return base.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface FileGroup { folder: string; files: string[] }

function groupFiles(files: string[]): FileGroup[] {
  const map = new Map<string, string[]>();
  for (const f of files) {
    const parts = f.split('/');
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
    if (!map.has(folder)) map.set(folder, []);
    map.get(folder)!.push(f);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([folder, fs]) => ({ folder, files: fs.sort((a, b) => a.localeCompare(b)) }));
}

export const PmlEditorView = forwardRef<PmlEditorRef | null, PmlEditorViewProps>(({ content, onChange, diagnostics = [] }, ref) => {
  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const currentFileRef = useRef<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useImperativeHandle(ref, () => ({
    revealLine(line: number) {
      if (editorRef.current) {
        editorRef.current.revealLineInCenter(line);
        editorRef.current.setPosition({ lineNumber: line, column: 1 });
        editorRef.current.focus();
      }
    }
  }));

  useEffect(() => {
    if (!showDropdown) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showDropdown]);


  useEffect(() => {
    if (!monacoRef.current || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    const monaco = monacoRef.current;
    const markers = diagnostics
      .filter(d => d.source)
      .map(d => {
        let severity = monaco.MarkerSeverity.Error;
        if (d.severity === 'warning') severity = monaco.MarkerSeverity.Warning;
        if (d.severity === 'info') severity = monaco.MarkerSeverity.Info;
        
        return {
          severity,
          message: d.message,
          startLineNumber: d.source!.startLine,
          startColumn: d.source!.startColumn,
          endLineNumber: d.source!.endLine,
          endColumn: d.source!.endColumn,
        };
      });
      
    monaco.editor.setModelMarkers(model, 'pml', markers);
  }, [diagnostics, content]);

  const fetchFiles = async () => {
    try {
      const res = await fetch('/processes/index.json');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch {
      // no file index
    }
    setShowDropdown(true);
  };

  const saveFile = async () => {
    const file = currentFileRef.current;
    const text = editorRef.current?.getValue() ?? '';
    if (!file) return;
    await fetch(`/processes/${encodeURIComponent(file)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: text,
    });
  };

  const loadFile = async (filename: string) => {
    try {
      const res = await fetch(`/processes/${filename}`);
      if (res.ok) {
        onChange(await res.text());
        setCurrentFile(filename);
        currentFileRef.current = filename;
        setShowDropdown(false);
      }
    } catch {
      // ignore
    }
  };

  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((e: any) => {
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
        }).catch(() => {});
      } else {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'process.pml';
        a.click();
        URL.revokeObjectURL(url);
      }
    });

    if (!monaco.languages.getLanguages().some((lang: any) => lang.id === 'pml')) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}
      className="bg-[#FAFAFA] border-r border-slate-200">

      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 36, flexShrink: 0 }}
        className="px-3 bg-slate-50 border-b border-slate-200">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 select-none">
          PML Editor
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {currentFile && (
            <button
              onClick={saveFile}
              title="Save (Ctrl+S)"
              className="flex items-center px-2 py-1 rounded text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <Save size={13} />
            </button>
          )}
          <div style={{ position: 'relative' }}>
          <button
            ref={buttonRef}
            onClick={() => showDropdown ? setShowDropdown(false) : fetchFiles()}
            title="Open process file"
            className="flex items-center gap-1 px-2 py-1 rounded text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors text-xs"
          >
            <FolderOpen size={13} />
            <ChevronDown size={10} />
          </button>

          {showDropdown && (
            <div
              ref={dropdownRef}
              style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 50, minWidth: 220 }}
              className="bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden"
            >
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100">
                Processes
              </div>
              {files.length === 0 && (
                <div className="px-3 py-3 text-xs text-slate-400 italic">No files found</div>
              )}
              {groupFiles(files).map(({ folder, files: groupedFiles }) => (
                <div key={folder || '__root__'}>
                  {folder && (
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100 border-t border-slate-100 mt-0.5 first:mt-0">
                      {folder}
                    </div>
                  )}
                  {groupedFiles.map(f => (
                    <button
                      key={f}
                      onClick={() => loadFile(f)}
                      className="w-full text-left px-3 py-1.5 text-[13px] text-slate-700 hover:bg-blue-50 hover:text-blue-700 border-b border-slate-50 last:border-0 transition-colors"
                    >
                      {toDisplayName(f)}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Monaco surface — absolute inner wrapper ensures pixel sizing */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Editor
            height="100%"
            language="pml"
            value={content}
            onChange={(v) => onChange(v ?? '')}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              wordWrap: 'on',
              fontSize: 13,
              lineHeight: 20,
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
            }}
          />
        </div>
      </div>

      {/* Diagnostics panel — expands above status bar */}
      {showDiagnostics && diagnostics.length > 0 && (
        <div style={{ flexShrink: 0, maxHeight: 180, overflowY: 'auto', borderTop: '1px solid #E2E8F0' }}
          className="bg-white">
          {diagnostics.map((d, i) => {
            const isErr = d.severity === 'error';
            const isWarn = d.severity === 'warning';
            return (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (d.source && editorRef.current) {
                    editorRef.current.revealLineInCenter(d.source.startLine);
                    editorRef.current.setPosition({ lineNumber: d.source.startLine, column: d.source.startColumn ?? 1 });
                    editorRef.current.focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (d.source && editorRef.current) {
                      editorRef.current.revealLineInCenter(d.source.startLine);
                      editorRef.current.setPosition({ lineNumber: d.source.startLine, column: d.source.startColumn ?? 1 });
                      editorRef.current.focus();
                    }
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%',
                  padding: '5px 10px', textAlign: 'left', background: 'none', border: 'none',
                  borderBottom: '1px solid #F1F5F9', cursor: d.source ? 'pointer' : 'default',
                  userSelect: 'text',
                }}
                className={`text-xs ${isErr ? 'text-red-600 hover:bg-red-50' : isWarn ? 'text-amber-600 hover:bg-amber-50' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <span style={{ flexShrink: 0, marginTop: 1 }}>
                  {isErr ? <AlertCircle size={11} /> : isWarn ? <AlertTriangle size={11} /> : <Info size={11} />}
                </span>
                <span style={{ flex: 1, userSelect: 'text' }}>{d.message}</span>
                {d.source && (
                  <span style={{ flexShrink: 0, opacity: 0.55, fontVariantNumeric: 'tabular-nums', userSelect: 'text' }}>
                    Ln {d.source.startLine}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Status bar */}
      {(() => {
        const errors = diagnostics.filter(d => d.severity === 'error').length;
        const warnings = diagnostics.filter(d => d.severity === 'warning').length;
        const badgeColor = errors > 0 ? '#EF4444' : warnings > 0 ? '#F59E0B' : '#10B981';
        const badgeLabel = errors > 0 ? `${errors} error${errors > 1 ? 's' : ''}` : warnings > 0 ? `${warnings} warning${warnings > 1 ? 's' : ''}` : 'Valid';
        return (
          <div style={{
            flexShrink: 0, height: 22, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '0 10px',
            borderTop: '1px solid #E2E8F0', background: '#F8FAFC',
          }}>
            <button
              onClick={() => setShowDiagnostics(s => !s)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: badgeColor, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: errors > 0 ? '#EF4444' : warnings > 0 ? '#F59E0B' : '#64748B', fontWeight: 500 }}>
                {badgeLabel}
              </span>
              {diagnostics.length > 0 && (
                <ChevronUp size={9} style={{ color: '#94A3B8', transform: showDiagnostics ? 'none' : 'rotate(180deg)', transition: 'transform 0.15s' }} />
              )}
            </button>
            <span style={{ fontSize: 10, color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}>
              Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
          </div>
        );
      })()}
    </div>
  );
});
