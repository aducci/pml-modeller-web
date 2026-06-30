import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Pin, PinOff, X, Settings, RefreshCw } from 'lucide-react';
import { NormalizedActor } from 'pml-core';

export interface ViewSettingsPanelProps {
  isOpen: boolean;
  swimlanesOn: boolean;
  modelSpacing: 'Natural' | 'Compact';
  processInterfacesOn: boolean;
  curtainsOn: boolean;
  viewAsActor: string | null;
  pinnedActor: string | null;
  flowVisibility: {
    main: boolean;
    alternate: boolean;
    exception: boolean;
    termination: boolean;
  };
  actors: NormalizedActor[];
  onTogglePanel: () => void;
  onToggleSwimlanes: () => void;
  onSetModelSpacing: (mode: 'Natural' | 'Compact') => void;
  onToggleProcessInterfaces: () => void;
  onToggleCurtains: () => void;
  onSetViewAsActor: (actor: string | null) => void;
  onTogglePinActor: () => void;
  onSetFlowVisibility: (visibility: {
    main: boolean;
    alternate: boolean;
    exception: boolean;
    termination: boolean;
  }) => void;
  onCleanTextLayout?: () => void;
  hasUnsavedChanges?: boolean;
}

export const ViewSettingsPanel: React.FC<ViewSettingsPanelProps> = ({
  isOpen,
  swimlanesOn,
  modelSpacing,
  processInterfacesOn,
  curtainsOn,
  viewAsActor,
  pinnedActor,
  flowVisibility,
  actors,
  onTogglePanel,
  onToggleSwimlanes,
  onSetModelSpacing,
  onToggleProcessInterfaces,
  onToggleCurtains,
  onSetViewAsActor,
  onTogglePinActor,
  onSetFlowVisibility,
  onCleanTextLayout,
  hasUnsavedChanges,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // TODO: Implement cleanTextLayout in ProcessController - reformat PML to canonical form
  // When implemented, remove hasUnsavedChanges check and add undo support
  const handleCleanTextLayout = () => {
    // Placeholder: emit warning that this is not yet implemented
    console.warn('Clean text layout: implementation pending in ProcessController');
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onTogglePanel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onTogglePanel]);

  const actorOptions = [
    { value: null, label: 'All actors' },
    ...actors.map(a => ({ value: a.id, label: a.label || a.id })),
  ];

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: isOpen ? 238 : 24,
      background: '#fff',
      borderTop: '1.5px solid #6366F1',
      boxShadow: isOpen ? '0 -2px 12px rgba(0,0,0,0.08)' : 'none',
      transition: 'height 0.2s ease-out',
      zIndex: 30,
      overflow: 'hidden',
    }}>
      {/* Trigger Tab */}
      <button
        onClick={onTogglePanel}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 12px',
          height: 24,
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 11,
          color: '#64748B',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748B'; }}
      >
        <Settings size={12} />
        <span>View settings</span>
        {isOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>

      {/* Panel Content */}
      {isOpen && (
        <div ref={panelRef} style={{ padding: '12px 16px', height: 210, overflowY: 'auto' }}>
          {/* Group 1: Process Layout */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Process layout
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ToggleRow
                label="Swimlanes"
                checked={swimlanesOn}
                onChange={onToggleSwimlanes}
              />
              <DropdownRow
                label="Model spacing"
                value={modelSpacing}
                options={['Natural', 'Compact']}
                onChange={v => onSetModelSpacing(v as 'Natural' | 'Compact')}
              />
              {onCleanTextLayout && (
                <button
                  onClick={hasUnsavedChanges ? handleCleanTextLayout : onCleanTextLayout}
                  disabled={hasUnsavedChanges}
                  title={hasUnsavedChanges ? 'Save changes first or cancel to reformat (not implemented yet)' : 'Reformat PML source'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 8px',
                    fontSize: 12,
                    color: hasUnsavedChanges ? '#94A3B8' : '#334155',
                    background: hasUnsavedChanges ? '#F1F5F9' : '#fff',
                    border: '1px solid ' + (hasUnsavedChanges ? '#E2E8F0' : '#CBD5E1'),
                    borderRadius: 4,
                    cursor: hasUnsavedChanges ? 'not-allowed' : 'pointer',
                    opacity: hasUnsavedChanges ? 0.5 : 1,
                  }}
                >
                  <RefreshCw size={12} />
                  Clean text layout
                </button>
              )}
            </div>
          </div>

          {/* Group 2: Advanced Navigation */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Advanced navigation
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ToggleRow
                label="Process interfaces"
                checked={processInterfacesOn}
                onChange={onToggleProcessInterfaces}
              />
              <ToggleRow
                label="I/O curtains"
                checked={curtainsOn}
                onChange={onToggleCurtains}
              />
            </div>
          </div>

          {/* Group 3: Interactive */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Interactive
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#334155', width: 80 }}>View as</span>
                <select
                  value={viewAsActor ?? ''}
                  onChange={e => onSetViewAsActor(e.target.value || null)}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    fontSize: 12,
                    borderRadius: 4,
                    border: '1px solid #CBD5E1',
                    background: '#fff',
                    color: '#334155',
                  }}
                >
                  {actorOptions.map(opt => (
                    <option key={opt.value ?? 'all'} value={opt.value ?? ''}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={onTogglePinActor}
                  title={pinnedActor ? 'Unpin actor view' : 'Pin actor view to persist across diagrams'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    padding: 0,
                    border: 'none',
                    background: pinnedActor ? '#EEF2FF' : 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    color: pinnedActor ? '#6366F1' : '#94A3B8',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#6366F1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = pinnedActor ? '#EEF2FF' : 'none'; e.currentTarget.style.color = pinnedActor ? '#6366F1' : '#94A3B8'; }}
                >
                  {pinnedActor ? <Pin size={14} /> : <PinOff size={14} />}
                </button>
              </div>

              <FlowVisibilityChecklist
                visibility={flowVisibility}
                onChange={onSetFlowVisibility}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ToggleRow: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#334155' }}>
    <Switch checked={checked} onChange={onChange} />
    <span>{label}</span>
  </label>
);

const Switch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    style={{
      position: 'relative',
      width: 32,
      height: 18,
      borderRadius: 9,
      border: 'none',
      cursor: 'pointer',
      background: checked ? '#6366F1' : '#E2E8F0',
      transition: 'background 0.15s',
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: 2,
        left: checked ? 16 : 2,
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.15s',
      }}
    />
  </button>
);

const DropdownRow: React.FC<{ label: string; value: string; options: string[]; onChange: (v: string) => void }> = ({
  label, value, options, onChange,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ fontSize: 12, color: '#334155', width: 80 }}>{label}</span>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        flex: 1,
        padding: '4px 8px',
        fontSize: 12,
        borderRadius: 4,
        border: '1px solid #CBD5E1',
        background: '#fff',
        color: '#334155',
      }}
    >
      {options.map(opt => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const FlowVisibilityChecklist: React.FC<{
  visibility: { main: boolean; alternate: boolean; exception: boolean; termination: boolean };
  onChange: (v: { main: boolean; alternate: boolean; exception: boolean; termination: boolean }) => void;
}> = ({ visibility, onChange }) => {
  const flowTypes: Array<{ key: keyof typeof visibility; label: string; color: string }> = [
    { key: 'main', label: 'Main flow', color: '#2563EB' },
    { key: 'alternate', label: 'Alternate flow', color: '#16A34A' },
    { key: 'exception', label: 'Exception / error', color: '#DC2626' },
    { key: 'termination', label: 'Termination events', color: '#6B7280' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
      {flowTypes.map(ft => (
        <label key={ft.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: '#334155' }}>
          <input
            type="checkbox"
            checked={visibility[ft.key]}
            onChange={e => onChange({ ...visibility, [ft.key]: e.target.checked })}
            style={{ width: 14, height: 14, accentColor: ft.color }}
          />
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: ft.color,
              display: 'inline-block',
            }}
          />
          <span>{ft.label}</span>
        </label>
      ))}
    </div>
  );
};