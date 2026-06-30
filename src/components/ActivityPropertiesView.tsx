import React, { useState } from 'react';
import { X, FileText, Info, Trash2, ExternalLink } from 'lucide-react';
import { SelectedElement } from 'pml-core';
import { PML_METADATA_PROPERTIES } from 'pml-core';

export interface ActivityPropertiesViewProps {
  selectedElement: SelectedElement;
  elementData?: any | null;
  onClose: () => void;
  onUpdateNode?: (nodeId: string, property: 'label' | 'metadata', value: string | Record<string, any>) => void;
  onRevealSource?: (line: number) => void;
}

export const ActivityPropertiesView: React.FC<ActivityPropertiesViewProps> = ({
  selectedElement,
  elementData,
  onClose,
  onUpdateNode,
  onRevealSource,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    identity: true,
    metadata: true,
  });
  
  const node = elementData;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLabelChange = (newLabel: string) => {
    if (onUpdateNode && node) {
      onUpdateNode(selectedElement.id, 'label', newLabel);
    }
  };

  const handleMetadataChange = (key: string, value: string) => {
    if (onUpdateNode && node) {
      const metadata = node.metadata || {};
      const newMetadata = { ...metadata, [key]: value };
      onUpdateNode(selectedElement.id, 'metadata', newMetadata);
    }
  };

  const handleAddMetadata = (key: string) => {
    if (onUpdateNode && node) {
      const metadata = node.metadata || {};
      const newMetadata = { ...metadata, [key]: '' };
      onUpdateNode(selectedElement.id, 'metadata', newMetadata);
    }
  };

  const handleRemoveMetadata = (key: string) => {
    if (onUpdateNode && node) {
      const metadata = node.metadata || {};
      const newMetadata = { ...metadata };
      delete newMetadata[key];
      onUpdateNode(selectedElement.id, 'metadata', newMetadata);
    }
  };

  const getExistingMetadata = (): [string, any][] => {
    if (!node?.metadata) return [];
    return Object.entries(node.metadata).filter(([k]) => k !== 'tentative' && k !== 'status') as [string, any][];
  };

  const getAvailableMetadataKeys = () => {
    const existingKeys = new Set(node?.metadata ? Object.keys(node.metadata).filter(k => k !== 'tentative' && k !== 'status') : []);
    return PML_METADATA_PROPERTIES.filter(p => !existingKeys.has(p.key));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 h-9 border-b border-slate-200 bg-slate-50 shrink-0">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Activity Properties
        </h3>
        <button
          onClick={onClose}
          title="Close"
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex flex-col flex-1 min-h-0 overflow-auto">
        {!node ? (
          <div className="p-4 text-xs text-slate-400">No activity data available.</div>
        ) : (
          <>
            <Section 
              title="Identity" 
              icon={<FileText size={12} />}
              expanded={expandedSections.identity}
              onToggle={() => toggleSection('identity')}
            >
              <EditableRow label="Type" value={node.type} readOnly />
              <EditableRow label="ID" value={node.id} readOnly monospace />
              <EditableRow label="Label" value={node.label} onChange={handleLabelChange} />
            </Section>

            <Section 
              title="Metadata" 
              icon={<Info size={12} />}
              expanded={expandedSections.metadata}
              onToggle={() => toggleSection('metadata')}
            >
              <div className="px-3 pb-2">
                {getExistingMetadata().map(([key, value]) => {
                  const displayValue = Array.isArray(value) 
                    ? (value as any[]).map(v => v.date || JSON.stringify(v)).join(', ')
                    : String(value);
                  
                  return (
                    <div key={key} className="flex items-start gap-2 py-1.5 border-b border-slate-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <label className="block text-[10px] font-medium text-slate-500 mb-0.5">{key}</label>
                        <input
                          type="text"
                          value={displayValue}
                          onChange={e => handleMetadataChange(key, e.target.value)}
                          placeholder={`Enter ${key}...`}
                          className="w-full text-xs px-2 py-1 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-400"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveMetadata(key)}
                        className="p-0.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors mt-1"
                        title={`Remove ${key}`}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  );
                })}
                
                {getAvailableMetadataKeys().length > 0 && (
                  <div className="pt-2">
                    <select 
                      onChange={e => {
                        if (e.target.value) {
                          handleAddMetadata(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full text-xs px-2 py-1 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-400"
                      defaultValue=""
                    >
                      <option value="">Add property...</option>
                      {getAvailableMetadataKeys().map(p => (
                        <option key={p.key} value={p.key}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </Section>

            {node.sourceRange && (
              <div className="px-3 pt-2 border-t border-slate-200 mt-2">
                <button
                  onClick={() => onRevealSource?.(node.sourceRange!.startLine)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded px-2 py-1 transition-colors"
                >
                  <ExternalLink size={11} />
                  Reveal in PML
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function Section({ 
  title, 
  icon, 
  children, 
  expanded, 
  onToggle 
}: { 
  title: string; 
  icon?: React.ReactNode;
  children: React.ReactNode; 
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-slate-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="text-slate-400">{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 flex-1">{title}</span>
        <div className="text-slate-400">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </div>
      </button>
      {expanded && children}
    </div>
  );
}

function EditableRow({ 
  label, 
  value, 
  onChange, 
  readOnly,
  monospace 
}: { 
  label: string; 
  value: string; 
  onChange?: (v: string) => void;
  readOnly?: boolean;
  monospace?: boolean;
}) {
  return (
    <div className="flex items-start justify-between px-3 py-2 border-b border-slate-100 last:border-0 gap-3">
      <span className="text-[11px] text-slate-500 flex-shrink-0 pt-1">{label}</span>
      {readOnly ? (
        <span className={`text-[11px] text-slate-700 text-right ${monospace ? 'font-mono' : ''}`}>
          {value}
        </span>
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange?.(e.target.value)}
          className={`flex-1 text-xs px-2 py-0.5 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-400 text-right ${monospace ? 'font-mono' : ''}`}
        />
      )}
    </div>
  );
}

function ChevronDown({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>;
}

function ChevronRight({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 6 15 12 9 18" /></svg>;
}