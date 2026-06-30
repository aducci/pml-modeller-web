/**
 * RoutingRulesPanel — admin UI for the routing rule mapping table.
 *
 * Each rule maps (sourceType × targetType × laneConfig) to a primary routing
 * type plus ordered alternates with activation conditions.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { RoutingRulesController } from 'pml-core';
import {
  RoutingRuleDefinition,
  RuleNodeType,
  RuleLaneConfig,
  RoutingTypeCode,
  AlternateCondition,
  AlternateRouting,
} from 'pml-core';

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------

const NODE_TYPE_OPTIONS: { value: RuleNodeType; label: string }[] = [
  { value: '*', label: 'Any type' },
  { value: 'task', label: 'Task' },
  { value: 'event', label: 'Event' },
  { value: 'gateway', label: 'Gateway' },
  { value: 'annotation', label: 'Annotation' },
  { value: 'subprocess', label: 'Sub-process' },
];

const LANE_CONFIG_OPTIONS: { value: RuleLaneConfig; label: string }[] = [
  { value: '*', label: 'Any' },
  { value: 'same-lane', label: 'Same lane' },
  { value: 'cross-lane-downward', label: 'Cross-lane ↓' },
  { value: 'cross-lane-upward', label: 'Cross-lane ↑' },
  { value: 'loopback', label: 'Loopback' },
  { value: 'self-loop', label: 'Self loop' },
];

const ROUTING_TYPE_OPTIONS: { value: RoutingTypeCode; label: string; group: string }[] = [
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

const CONDITION_OPTIONS: { value: AlternateCondition; label: string; description: string }[] = [
  { value: 'compact-mode', label: 'Compact mode', description: 'When layout density = compact' },
  { value: 'path-blocked', label: 'Path blocked', description: 'Primary path intersects a node' },
  { value: 'parallel-offset', label: 'Parallel offset', description: 'Another connection occupies same path' },
  { value: 'always', label: 'Always (fallback)', description: 'Unconditional last resort' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  controller: RoutingRulesController;
  rules: RoutingRuleDefinition[];
}

export const RoutingRulesPanel: React.FC<Props> = ({ controller, rules }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Routing Rules</h2>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0', lineHeight: 1.5, maxWidth: 560 }}>
            Maps <strong>source type × target type × lane configuration</strong> to a preferred routing type
            with ordered alternates. Rules are evaluated highest-priority-first; first match wins.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => {
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
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#fff', background: '#6366F1', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontWeight: 500 }}
          >
            <Plus size={13} /> Add rule
          </button>
          <button
            onClick={() => controller.resetToDefaults()}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7280', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </div>

      {/* Rules table */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '28px 32px 130px 130px 140px 110px 1fr 60px',
          padding: '8px 12px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB',
          alignItems: 'center', gap: 8,
        }}>
          <span />
          <span style={thStyle}>Pri</span>
          <span style={thStyle}>Source</span>
          <span style={thStyle}>Target</span>
          <span style={thStyle}>Lane config</span>
          <span style={thStyle}>Primary type</span>
          <span style={thStyle}>Alternates</span>
          <span style={thStyle}>On</span>
        </div>

        {rules.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>
            No rules defined. Click "Add rule" to create one.
          </div>
        )}

        {rules.map((rule, idx) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            isExpanded={expandedId === rule.id}
            onToggle={() => setExpandedId(prev => prev === rule.id ? null : rule.id)}
            onMoveUp={idx > 0 ? () => controller.reorder(idx, idx - 1) : undefined}
            onMoveDown={idx < rules.length - 1 ? () => controller.reorder(idx, idx + 1) : undefined}
            onUpdate={patch => controller.updateRule(rule.id, patch)}
            onUpdateMatch={match => controller.updateMatch(rule.id, match)}
            onSetPrimary={type => controller.setPrimary(rule.id, type)}
            onSetAlternates={alts => controller.setAlternates(rule.id, alts)}
            onAddAlternate={alt => controller.addAlternate(rule.id, alt)}
            onRemoveAlternate={i => controller.removeAlternate(rule.id, i)}
            onToggleEnabled={() => controller.toggleEnabled(rule.id)}
            onDelete={() => controller.deleteRule(rule.id)}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 20, padding: '12px 16px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 8 }}>
          Alternate conditions
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {CONDITION_OPTIONS.map(c => (
            <div key={c.value} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 3, padding: '1px 5px', fontWeight: 500 }}>
                {c.label}
              </span>
              <span style={{ fontSize: 11, color: '#6B7280' }}>{c.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Rule row
// ---------------------------------------------------------------------------

interface RuleRowProps {
  rule: RoutingRuleDefinition;
  isExpanded: boolean;
  onToggle: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onUpdate: (patch: Partial<Omit<RoutingRuleDefinition, 'id'>>) => void;
  onUpdateMatch: (match: Partial<RoutingRuleDefinition['match']>) => void;
  onSetPrimary: (type: RoutingTypeCode) => void;
  onSetAlternates: (alts: AlternateRouting[]) => void;
  onAddAlternate: (alt: AlternateRouting) => void;
  onRemoveAlternate: (index: number) => void;
  onToggleEnabled: () => void;
  onDelete: () => void;
}

function RuleRow({
  rule, isExpanded, onToggle,
  onMoveUp, onMoveDown,
  onUpdate, onUpdateMatch, onSetPrimary,
  onSetAlternates, onAddAlternate, onRemoveAlternate,
  onToggleEnabled, onDelete,
}: RuleRowProps) {
  const label = LANE_CONFIG_OPTIONS.find(o => o.value === rule.match.laneConfig)?.label ?? rule.match.laneConfig;

  return (
    <>
      {/* Summary row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '28px 32px 130px 130px 140px 110px 1fr 60px',
          padding: '9px 12px',
          borderBottom: isExpanded ? 'none' : '1px solid #F3F4F6',
          background: isExpanded ? '#FAFAFA' : rule.enabled ? '#fff' : '#FAFAFA',
          alignItems: 'center', gap: 8,
          opacity: rule.enabled ? 1 : 0.55,
          cursor: 'pointer',
        }}
        onClick={onToggle}
        onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
        onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = rule.enabled ? '#fff' : '#FAFAFA'; }}
      >
        {/* Expand toggle */}
        <span style={{ color: '#9CA3AF' }}>
          {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>

        {/* Priority number */}
        <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', textAlign: 'center' }}>
          {rule.priority}
        </span>

        {/* Source type */}
        <NodeTypeBadge value={rule.match.sourceType} />

        {/* Target type */}
        <NodeTypeBadge value={rule.match.targetType} />

        {/* Lane config */}
        <span style={{
          fontSize: 11, padding: '2px 6px', borderRadius: 3, display: 'inline-flex', alignItems: 'center',
          background: '#F3F4F6',
          color: '#6B7280',
          border: `1px solid #E5E7EB`,
          fontWeight: 500, whiteSpace: 'nowrap',
        }}>
          {label}
        </span>

        {/* Primary type */}
        <RoutingTypeBadge code={rule.primary} size="sm" />

        {/* Alternates summary */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {rule.alternates.length === 0
            ? <span style={{ fontSize: 10, color: '#D1D5DB' }}>none</span>
            : rule.alternates.map((alt, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <RoutingTypeBadge code={alt.type} size="xs" />
                <ConditionBadge condition={alt.condition} />
              </span>
            ))
          }
        </div>

        {/* Enabled toggle */}
        <div style={{ display: 'flex', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
          <Toggle checked={rule.enabled} onChange={onToggleEnabled} />
        </div>
      </div>

      {/* Expanded edit panel */}
      {isExpanded && (
        <div
          style={{ padding: '0 12px 16px', borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 12 }}>

            {/* Left: match criteria */}
            <div>
              <SectionHead>Match criteria</SectionHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <FieldRow label="Label">
                  <input
                    value={rule.label}
                    onChange={e => onUpdate({ label: e.target.value })}
                    style={inputStyle}
                    placeholder="Rule label"
                  />
                </FieldRow>
                <FieldRow label="Description">
                  <input
                    value={rule.description}
                    onChange={e => onUpdate({ description: e.target.value })}
                    style={inputStyle}
                    placeholder="Optional description"
                  />
                </FieldRow>
                <FieldRow label="Source type">
                  <select
                    value={rule.match.sourceType}
                    onChange={e => onUpdateMatch({ sourceType: e.target.value as RuleNodeType })}
                    style={selectStyle}
                  >
                    {NODE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FieldRow>
                <FieldRow label="Target type">
                  <select
                    value={rule.match.targetType}
                    onChange={e => onUpdateMatch({ targetType: e.target.value as RuleNodeType })}
                    style={selectStyle}
                  >
                    {NODE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FieldRow>
                <FieldRow label="Lane config">
                  <select
                    value={rule.match.laneConfig}
                    onChange={e => onUpdateMatch({ laneConfig: e.target.value as RuleLaneConfig })}
                    style={selectStyle}
                  >
                    {LANE_CONFIG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FieldRow>
                <FieldRow label="Priority">
                  <input
                    type="number"
                    value={rule.priority}
                    onChange={e => onUpdate({ priority: Number(e.target.value) })}
                    style={{ ...inputStyle, width: 80 }}
                    min={0}
                    max={999}
                  />
                </FieldRow>
              </div>
            </div>

            {/* Right: routing types */}
            <div>
              <SectionHead>Routing types</SectionHead>

              {/* Primary */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 5, fontWeight: 500 }}>Primary</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    value={rule.primary}
                    onChange={e => onSetPrimary(e.target.value as RoutingTypeCode)}
                    style={selectStyle}
                  >
                    {groupedTypeOptions()}
                  </select>
                  <RoutingTypeBadge code={rule.primary} size="sm" />
                </div>
                <p style={{ fontSize: 10, color: '#9CA3AF', margin: '4px 0 0', lineHeight: 1.4 }}>
                  Used when no alternate condition is active.
                </p>
              </div>

              {/* Alternates */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>Alternates</div>
                  <AddAlternateButton onAdd={onAddAlternate} />
                </div>

                {rule.alternates.length === 0 ? (
                  <div style={{ fontSize: 11, color: '#D1D5DB', padding: '8px 0' }}>No alternates defined.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {rule.alternates.map((alt, i) => (
                      <AlternateRow
                        key={i}
                        alt={alt}
                        onUpdate={patch => {
                          onSetAlternates(rule.alternates.map((a, j) => j === i ? { ...a, ...patch } : a));
                        }}
                        onRemove={() => onRemoveAlternate(i)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {onMoveUp && (
                <button onClick={onMoveUp} style={miniBtn}>↑ Move up</button>
              )}
              {onMoveDown && (
                <button onClick={onMoveDown} style={miniBtn}>↓ Move down</button>
              )}
            </div>
            <button
              onClick={onDelete}
              style={{ ...miniBtn, color: '#DC2626', borderColor: '#FECACA', background: '#FEF2F2', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Trash2 size={11} /> Delete rule
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// AlternateRow — inline editor for a single alternate
// ---------------------------------------------------------------------------

interface AlternateRowProps {
  alt: AlternateRouting;
  onUpdate: (patch: Partial<AlternateRouting>) => void;
  onRemove: () => void;
}

function AlternateRow({ alt, onUpdate, onRemove }: AlternateRowProps) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 140px auto',
      gap: 8, alignItems: 'center',
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: '7px 10px',
    }}>
      {/* Type */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <select
          value={alt.type}
          onChange={e => onUpdate({ type: e.target.value as RoutingTypeCode })}
          style={{ ...selectStyle, fontSize: 11 }}
        >
          {groupedTypeOptions()}
        </select>
        <RoutingTypeBadge code={alt.type} size="xs" />
      </div>

      {/* Condition */}
      <select
        value={alt.condition}
        onChange={e => onUpdate({ condition: e.target.value as AlternateCondition })}
        style={{ ...selectStyle, fontSize: 11 }}
      >
        {CONDITION_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>

      {/* Remove */}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2, display: 'flex' }}>
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AddAlternateButton
// ---------------------------------------------------------------------------

function AddAlternateButton({ onAdd }: { onAdd: (alt: AlternateRouting) => void }) {
  return (
    <button
      onClick={() => onAdd({ type: 'DEH', condition: 'compact-mode', priority: 1 })}
      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6366F1', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}
    >
      <Plus size={11} /> Add alternate
    </button>
  );
}

// ---------------------------------------------------------------------------
// Small shared components
// ---------------------------------------------------------------------------

function RoutingTypeBadge({ code, size }: { code: RoutingTypeCode; size: 'sm' | 'xs' }) {
  const fs = size === 'xs' ? 10 : 11;
  return (
    <span style={{
      fontFamily: 'monospace', fontWeight: 600, fontSize: fs,
      background: '#F3F4F6', color: '#374151',
      border: '1px solid #E5E7EB', borderRadius: 3,
      padding: size === 'xs' ? '0px 3px' : '1px 4px',
      whiteSpace: 'nowrap',
    }}>
      {code}
    </span>
  );
}

function NodeTypeBadge({ value }: { value: string }) {
  const isWild = value === '*';
  return (
    <span style={{
      fontSize: 11, padding: '2px 6px', borderRadius: 3,
      background: isWild ? '#F3F4F6' : '#F0FDF4',
      color: isWild ? '#9CA3AF' : '#166534',
      border: `1px solid ${isWild ? '#E5E7EB' : '#BBF7D0'}`,
      fontWeight: 500,
    }}>
      {isWild ? 'Any' : value}
    </span>
  );
}

function ConditionBadge({ condition }: { condition: AlternateCondition }) {
  return (
    <span style={{
      fontSize: 9, padding: '1px 4px', borderRadius: 3,
      background: '#F3F4F6', color: '#6B7280',
      border: '1px solid #E5E7EB',
      fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      {condition === 'compact-mode' ? 'compact'
        : condition === 'path-blocked' ? 'blocked'
        : condition === 'parallel-offset' ? 'parallel'
        : 'fallback'}
    </span>
  );
}


function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 32, height: 18, borderRadius: 9, border: 'none', cursor: 'pointer',
        background: checked ? '#6366F1' : '#D1D5DB',
        position: 'relative', transition: 'background 0.15s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: checked ? 16 : 2,
        width: 14, height: 14, borderRadius: '50%', background: '#fff',
        transition: 'left 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 8 }}>
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: '#6B7280' }}>{label}</span>
      {children}
    </div>
  );
}

function groupedTypeOptions() {
  const groups = [...new Set(ROUTING_TYPE_OPTIONS.map(o => o.group))];
  return groups.map(g => (
    <optgroup key={g} label={g}>
      {ROUTING_TYPE_OPTIONS.filter(o => o.group === g).map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </optgroup>
  ));
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const thStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF',
};

const inputStyle: React.CSSProperties = {
  width: '100%', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 5,
  padding: '4px 8px', outline: 'none', background: '#fff', color: '#374151',
};

const selectStyle: React.CSSProperties = {
  width: '100%', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 5,
  padding: '4px 8px', outline: 'none', background: '#fff', color: '#374151', cursor: 'pointer',
};

const miniBtn: React.CSSProperties = {
  fontSize: 11, padding: '4px 8px', borderRadius: 5, cursor: 'pointer',
  background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#6B7280',
};
