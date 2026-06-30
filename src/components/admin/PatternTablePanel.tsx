/**
 * PatternTablePanel — admin UI for the first-class routing pattern table.
 *
 * Table view: one row per pattern in priority order.
 * Expand a row to edit detect criteria and flow parameters inline.
 * Changes go directly to PatternTableController → live layout preview.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { PatternTableController } from 'pml-core';
import { PatternDefinition, DetectCriteria } from 'pml-core';

interface Props {
  controller: PatternTableController;
  table: PatternDefinition[];
}

export const PatternTablePanel: React.FC<Props> = ({ controller, table }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Routing Patterns</h2>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>
            Evaluated in priority order — first match wins. Drag to reorder; edit detect & flow criteria inline.
          </p>
        </div>
        <button
          onClick={() => controller.resetToDefaults()}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7280', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}
        >
          <RotateCcw size={12} /> Reset all
        </button>
      </div>

      <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '32px 48px 1fr 200px 80px', padding: '8px 12px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
          <span />
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>Pri</span>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>Pattern</span>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>Detect criteria</span>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', textAlign: 'center' }}>Enabled</span>
        </div>

        {table.map((pattern, idx) => (
          <PatternRow
            key={pattern.id}
            pattern={pattern}
            isExpanded={expanded === pattern.id}
            onToggle={() => toggle(pattern.id)}
            onUpdate={(patch) => controller.updatePattern(pattern.id, patch)}
            onMoveUp={idx > 0 ? () => controller.reorder(idx, idx - 1) : undefined}
            onMoveDown={idx < table.length - 1 ? () => controller.reorder(idx, idx + 1) : undefined}
            isLast={idx === table.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Pattern row ──────────────────────────────────────────────────────────────

interface RowProps {
  pattern: PatternDefinition;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<PatternDefinition>) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isLast: boolean;
}

const PatternRow: React.FC<RowProps> = ({ pattern, isExpanded, onToggle, onUpdate, onMoveUp, onMoveDown, isLast }) => {
  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid #F3F4F6' }}>
      {/* Summary row */}
      <div
        style={{
          display: 'grid', gridTemplateColumns: '32px 48px 1fr 200px 80px',
          padding: '10px 12px', cursor: 'pointer', alignItems: 'center',
          background: isExpanded ? '#F5F3FF' : 'white',
        }}
        onClick={onToggle}
      >
        <span style={{ color: '#9CA3AF' }}>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
<span style={{
           fontSize: 11, fontWeight: 500, padding: '1px 5px', borderRadius: 3,
           background: '#F3F4F6',
           color: '#6B7280',
           textAlign: 'center',
           opacity: pattern.enabled ? 1 : 0.4,
         }}>
           {pattern.priority}
         </span>
        <div style={{ opacity: pattern.enabled ? 1 : 0.45 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{pattern.label}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{pattern.id}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {detectChips(pattern.detect).map((chip, i) => (
<span key={i} style={{
               fontSize: 10, padding: '2px 5px', borderRadius: 3,
               background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB',
               opacity: pattern.enabled ? 1 : 0.4,
             }}>
               {chip}
             </span>
          ))}
        </div>
        <div style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
          <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={pattern.enabled}
              onChange={(e) => onUpdate({ enabled: e.target.checked })}
              style={{ width: 16, height: 16, accentColor: '#6366F1', cursor: 'pointer' }}
            />
          </label>
        </div>
      </div>

      {/* Expanded editor */}
      {isExpanded && (
        <PatternEditor
          pattern={pattern}
          onUpdate={onUpdate}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      )}
    </div>
  );
};

// ─── Pattern editor ───────────────────────────────────────────────────────────

const PatternEditor: React.FC<{ pattern: PatternDefinition; onUpdate: (patch: Partial<PatternDefinition>) => void; onMoveUp?: () => void; onMoveDown?: () => void }> = ({ pattern, onUpdate, onMoveUp, onMoveDown }) => {
  const d = pattern.detect;
  const f = pattern.flow;

  return (
    <div style={{ padding: '0 12px 16px 44px', background: '#FAFAF9', borderTop: '1px solid #F3F4F6' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, marginTop: 12 }}>
        {onMoveUp && (
          <button onClick={onMoveUp} style={btnStyle}>↑ Move up</button>
        )}
        {onMoveDown && (
          <button onClick={onMoveDown} style={btnStyle}>↓ Move down</button>
        )}
        <input
          type="number"
          value={pattern.priority}
          onChange={(e) => onUpdate({ priority: Number(e.target.value) })}
          style={{ width: 64, fontSize: 12, padding: '3px 6px', border: '1px solid #D1D5DB', borderRadius: 5, textAlign: 'center' }}
          title="Priority"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Detect criteria */}
        <div>
          <SectionHead>Detect criteria</SectionHead>
          <DetectField label="Source is boundary" value={d.sourceIsBoundary} onChange={(v) => onUpdate({ detect: { ...d, sourceIsBoundary: v } })} />
          <DetectField label="Target is boundary" value={d.targetIsBoundary} onChange={(v) => onUpdate({ detect: { ...d, targetIsBoundary: v } })} />
          <DetectField label="Same lane" value={d.sameLane} onChange={(v) => onUpdate({ detect: { ...d, sameLane: v } })} />
          <DetectField label="Is loopback" value={d.isLoopback} onChange={(v) => onUpdate({ detect: { ...d, isLoopback: v } })} />
          <DetectSelectField
            label="Loopback side"
            value={d.loopbackSide ?? ''}
            options={['', 'top', 'bottom']}
            onChange={(v) => onUpdate({ detect: { ...d, loopbackSide: v ? (v as 'top' | 'bottom') : undefined } })}
          />
          <DetectSelectField
            label="Lane direction"
            value={d.laneDirection ?? ''}
            options={['', 'downward', 'upward']}
            onChange={(v) => onUpdate({ detect: { ...d, laneDirection: v ? (v as 'upward' | 'downward') : undefined } })}
          />
          <DetectNumField
            label="Source out-degree >"
            value={d.sourceOutDegreeGt}
            onChange={(v) => onUpdate({ detect: { ...d, sourceOutDegreeGt: v } })}
          />
          <DetectNumField
            label="Target in-degree >"
            value={d.targetInDegreeGt}
            onChange={(v) => onUpdate({ detect: { ...d, targetInDegreeGt: v } })}
          />
          <DetectField label="All targets in source lane" value={d.allTargetsInSourceLane} onChange={(v) => onUpdate({ detect: { ...d, allTargetsInSourceLane: v } })} />
          <DetectNumField
            label="DeltaY ratio >"
            value={d.deltaYRatioGt}
            onChange={(v) => onUpdate({ detect: { ...d, deltaYRatioGt: v } })}
          />
        </div>

        {/* Flow parameters */}
        <div>
          <SectionHead>Flow parameters</SectionHead>
          <FlowReadonlyRow label="Scenario key" value={f.scenarioKey} />
          <FlowReadonlyRow label="First segment" value={f.firstSegmentDirection ?? '—'} />
          <FlowReadonlyRow label="Elbow Y policy" value={f.elbowYPolicy ?? '—'} />
          <FlowNumField
            label="Exit buffer px"
            value={f.exitBufferPx ?? 12}
            onChange={(v) => onUpdate({ flow: { ...f, exitBufferPx: v } })}
          />
          <FlowNumField
            label="Entry buffer px"
            value={f.entryBufferPx ?? 12}
            onChange={(v) => onUpdate({ flow: { ...f, entryBufferPx: v } })}
          />
          <FlowReadonlyRow label="Source ports" value={f.sourcePortPriority.map((p) => `${p.side}(${p.hardness[0]})`).join(', ')} />
          <FlowReadonlyRow label="Target ports" value={f.targetPortPriority.map((p) => `${p.side}(${p.hardness[0]})`).join(', ')} />
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>
        {pattern.description}
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 8 }}>
    {children}
  </div>
);

const DetectField: React.FC<{ label: string; value: boolean | undefined; onChange: (v: boolean | undefined) => void }> = ({ label, value, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
    <span style={{ fontSize: 12, color: '#374151' }}>{label}</span>
    <select
      value={value === undefined ? '' : String(value)}
      onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value === 'true')}
      style={selectStyle}
    >
      <option value="">any</option>
      <option value="true">true</option>
      <option value="false">false</option>
    </select>
  </div>
);

const DetectSelectField: React.FC<{ label: string; value: string; options: string[]; onChange: (v: string) => void }> = ({ label, value, options, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
    <span style={{ fontSize: 12, color: '#374151' }}>{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle}>
      {options.map((o) => <option key={o} value={o}>{o || 'any'}</option>)}
    </select>
  </div>
);

const DetectNumField: React.FC<{ label: string; value: number | undefined; onChange: (v: number | undefined) => void }> = ({ label, value, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
    <span style={{ fontSize: 12, color: '#374151' }}>{label}</span>
    <input
      type="number"
      value={value ?? ''}
      placeholder="—"
      onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      style={{ ...selectStyle, width: 64, textAlign: 'right' }}
    />
  </div>
);

const FlowReadonlyRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
    <span style={{ fontSize: 12, color: '#374151' }}>{label}</span>
    <span style={{ fontSize: 11, color: '#6366F1', fontFamily: 'monospace' }}>{value}</span>
  </div>
);

const FlowNumField: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
    <span style={{ fontSize: 12, color: '#374151' }}>{label}</span>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ ...selectStyle, width: 64, textAlign: 'right' }}
    />
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectChips(d: DetectCriteria): string[] {
  const chips: string[] = [];
  if (d.sourceIsBoundary !== undefined) chips.push(`src.boundary=${d.sourceIsBoundary}`);
  if (d.targetIsBoundary !== undefined) chips.push(`tgt.boundary=${d.targetIsBoundary}`);
  if (d.sameLane !== undefined) chips.push(`sameLane=${d.sameLane}`);
  if (d.isLoopback !== undefined) chips.push(`loopback=${d.isLoopback}`);
  if (d.loopbackSide !== undefined) chips.push(`side=${d.loopbackSide}`);
  if (d.laneDirection !== undefined) chips.push(`dir=${d.laneDirection}`);
  if (d.sourceNodeTypes !== undefined) chips.push(`src∈[${d.sourceNodeTypes.join(',')}]`);
  if (d.sourceOutDegreeGt !== undefined) chips.push(`outDeg>${d.sourceOutDegreeGt}`);
  if (d.targetInDegreeGt !== undefined) chips.push(`inDeg>${d.targetInDegreeGt}`);
  if (d.allTargetsInSourceLane !== undefined) chips.push(`allTgtSameLane=${d.allTargetsInSourceLane}`);
  if (d.deltaYRatioGt !== undefined) chips.push(`ΔY>${d.deltaYRatioGt}`);
  return chips;
}

const selectStyle: React.CSSProperties = {
  fontSize: 11, padding: '2px 4px', border: '1px solid #D1D5DB',
  borderRadius: 4, background: 'white', color: '#374151',
};

const btnStyle: React.CSSProperties = {
  fontSize: 11, padding: '3px 8px', border: '1px solid #D1D5DB',
  borderRadius: 5, background: 'white', color: '#374151', cursor: 'pointer',
};
