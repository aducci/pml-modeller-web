import React, { useCallback, useMemo } from 'react';
import { DEFAULT_PROCESS_THEME } from 'pml-core';
import type { EdgeLabelAnchor, EdgeLabelSide } from 'pml-core';
import { Field, Section, Num, Slider, ColorInput, ResetBtn, Select } from './controls';

const NODE_TYPES: [string, string][] = [
  ['task', 'Task'],
  ['event', 'Event'],
  ['gateway', 'Gateway / Decision'],
  ['subprocess', 'Subprocess'],
  ['parallel', 'Parallel gateway'],
];

const ANCHOR_OPTIONS = [
  { value: 'start', label: 'Start' },
  { value: 'mid', label: 'Mid' },
  { value: 'end', label: 'End' },
  { value: 'elbow-1', label: 'Elbow 1' },
  { value: 'elbow-2', label: 'Elbow 2' },
  { value: 'elbow-3', label: 'Elbow 3' },
];

const SIDE_OPTIONS = [
  { value: 'above', label: 'Above' },
  { value: 'center', label: 'Center' },
  { value: 'below', label: 'Below' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

const ROUTING_TYPES: [string, string][] = [
  ['defaults', 'Defaults'],
  ['STH', 'Straight Horizontal'],
  ['STV', 'Straight Vertical'],
  ['SEH', 'Single Elbow H'],
  ['SEV', 'Single Elbow V'],
  ['DEH', 'Double Elbow H'],
  ['DEN', 'Double Elbow Near-Exit H'],
  ['DEF', 'Double Elbow Far-Exit H'],
  ['DEV', 'Double Elbow V'],
  ['DBL', 'Double Elbow Bottom→Left'],
  ['TEH', 'Triple Elbow H'],
  ['TEV', 'Triple Elbow V'],
  ['SLP', 'Self Loop'],
  ['POH', 'Parallel Offset H'],
  ['POV', 'Parallel Offset V'],
  ['AOT', 'Auto Orthogonal'],
];

function mergeDeep(base: any, overrides: any): any {
  if (!overrides) return base;
  const result: any = { ...base };
  for (const key of Object.keys(overrides)) {
    if (typeof overrides[key] === 'object' && overrides[key] !== null && !Array.isArray(overrides[key]) && typeof base[key] === 'object') {
      result[key] = mergeDeep(base[key], overrides[key]);
    } else {
      result[key] = overrides[key];
    }
  }
  return result;
}

function setPath(obj: any, path: string[], value: any): any {
  if (path.length === 0) return value;
  const [head, ...tail] = path;
  return { ...obj, [head]: setPath(obj[head] ?? {}, tail, value) };
}

interface Props {
  overrides: Record<string, any>;
  onChange: (overrides: Record<string, any>) => void;
}

export const ThemePanel: React.FC<Props> = ({ overrides, onChange }) => {
  const theme = useMemo(() => mergeDeep(DEFAULT_PROCESS_THEME, overrides), [overrides]);

  const set_ = useCallback((path: string[], value: any) => {
    onChange(setPath(overrides, path, value));
  }, [overrides, onChange]);

  const resetAll = () => onChange({});

  const elemColor = (type: string, field: string) =>
    theme.elementStyles[type]?.appearance?.[field] ?? '#000000';
  const setElemColor = (type: string, field: string, v: string) =>
    set_(['elementStyles', type, 'appearance', field], v);

  const perType = (theme.edgeLabelPositions?.perType ?? {}) as Record<string, any>;
  const defaultPerType = (DEFAULT_PROCESS_THEME.edgeLabelPositions.perType ?? {}) as Record<string, any>;

  const compactNumStyle: React.CSSProperties = { width: 64 };
  const compactSelectStyle: React.CSSProperties = { height: 26, padding: '0 4px', fontSize: 11, border: '1px solid #D1D5DB', borderRadius: 4, background: '#FAFAFA', color: '#111827', cursor: 'pointer', outline: 'none', appearance: 'auto', minWidth: 72 };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>Theme & Appearance</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
            Editing: <span style={{ fontWeight: 500, color: '#374151' }}>{DEFAULT_PROCESS_THEME.name}</span> — session only
          </div>
        </div>
        <ResetBtn onClick={resetAll} />
      </div>

      {/* ── Node Styles ───────────────────────────────────── */}
      <Section title="Nodes">
        <div style={{ display: 'grid', gap: 6 }}>
          {NODE_TYPES.map(([type, label]) => (
            <div key={type} style={{ display: 'grid', gridTemplateColumns: '22px 1fr 72px 72px 72px', gap: 8, alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #F3F4F6' }}>
              <span
                style={{
                  display: 'inline-block', width: 16, height: 16, borderRadius: type === 'event' || type === 'parallel' ? '50%' : type === 'gateway' ? 0 : 3,
                  background: elemColor(type, 'fill'), border: `1px solid ${elemColor(type, 'stroke')}`,
                  transform: type === 'gateway' ? 'rotate(45deg)' : 'none', flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{label}</span>
              <ColorInput value={elemColor(type, 'fill')} onChange={v => setElemColor(type, 'fill', v)} />
              <ColorInput value={elemColor(type, 'stroke')} onChange={v => setElemColor(type, 'stroke', v)} />
              <ColorInput value={elemColor(type, 'label')} onChange={v => setElemColor(type, 'label', v)} />
            </div>
          ))}
        </div>
      </Section>

      {/* ── Edge Styles ───────────────────────────────────── */}
      <Section title="Edges">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <Field label="Default stroke" hint="Same-lane flows"><ColorInput value={theme.edges.default?.stroke ?? '#888780'} onChange={v => set_(['edges', 'default', 'stroke'], v)} /></Field>
            <Field label="Cross-lane stroke"><ColorInput value={theme.edges.crossLane?.stroke ?? '#B4B2A9'} onChange={v => set_(['edges', 'crossLane', 'stroke'], v)} /></Field>
            <Field label="Loopback stroke"><ColorInput value={theme.edges.loopback?.stroke ?? '#BA7517'} onChange={v => set_(['edges', 'loopback', 'stroke'], v)} /></Field>
            <Field label="Selected stroke"><ColorInput value={theme.edges.selected?.stroke ?? '#378ADD'} onChange={v => set_(['edges', 'selected', 'stroke'], v)} /></Field>
            <Field label="Arrowhead"><ColorInput value={theme.edges.marker?.fill ?? '#888780'} onChange={v => set_(['edges', 'marker', 'fill'], v)} /></Field>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <Field label="Label text" hint="Condition text colour"><ColorInput value={theme.edges.label?.fill ?? '#5F5E5A'} onChange={v => set_(['edges', 'label', 'fill'], v)} /></Field>
            <Field label="Label halo" hint="Text halo colour"><ColorInput value={theme.edges.label?.haloColor ?? '#F7F6F2'} onChange={v => set_(['edges', 'label', 'haloColor'], v)} /></Field>
            <Field label="Edge width" hint="Default stroke width"><Num value={theme.edges.default?.strokeWidth ?? 1.5} onChange={v => set_(['edges', 'default', 'strokeWidth'], v)} min={0.5} max={5} step={0.5} unit="px" width={56} /></Field>
            <Field label="Halo width" hint="Halo stroke width"><Num value={theme.edges.halo?.default?.width ?? 4} onChange={v => set_(['edges', 'halo', 'default', 'width'], v)} min={0} max={12} unit="px" width={56} /></Field>
          </div>
        </div>
      </Section>

      {/* ── Edge Label Sizing ───────────────────────────────── */}
      <Section title="Edge Label Sizing">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <Field label="Char width" hint="Estimated px per character"><Num value={theme.edges.label?.charWidthPx ?? 7} onChange={v => set_(['edges', 'label', 'charWidthPx'], v)} min={4} max={14} step={0.5} unit="px" width={56} /></Field>
            <Field label="Padding" hint="Horizontal padding inside label"><Num value={theme.edges.label?.paddingX ?? 14} onChange={v => set_(['edges', 'label', 'paddingX'], v)} min={4} max={40} unit="px" width={56} /></Field>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <Field label="Min width" hint="Minimum label container width"><Num value={theme.edges.label?.minWidth ?? 56} onChange={v => set_(['edges', 'label', 'minWidth'], v)} min={24} max={200} unit="px" width={56} /></Field>
            <Field label="Max width" hint="Maximum label container width"><Num value={theme.edges.label?.maxWidth ?? 200} onChange={v => set_(['edges', 'label', 'maxWidth'], v)} min={56} max={400} unit="px" width={56} /></Field>
          </div>
        </div>
      </Section>

      {/* ── Edge Label Placement ───────────────────────────── */}
      <Section title="Edge Label Placement">
        <div style={{ marginBottom: 10, fontSize: 11, color: '#6B7280' }}>
          Where labels sit relative to the routed path, per routing type.
        </div>
        <div style={{ overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: 6 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11, minWidth: 860 }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <th rowSpan={2} style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid #E5E7EB', color: '#374151', fontWeight: 600, minWidth: 110 }}>Routing</th>
                <th colSpan={3} style={{ textAlign: 'center', padding: '6px 4px', borderBottom: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB', color: '#6366F1', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Primary</th>
                <th colSpan={3} style={{ textAlign: 'center', padding: '6px 4px', borderBottom: '1px solid #E5E7EB', color: '#9CA3AF', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Secondary</th>
              </tr>
              <tr style={{ background: '#F9FAFB' }}>
                <th style={{ padding: '4px 2px', borderBottom: '1px solid #E5E7EB', color: '#9CA3AF', fontWeight: 500, fontSize: 9, textTransform: 'uppercase' }}>Anchor</th>
                <th style={{ padding: '4px 2px', borderBottom: '1px solid #E5E7EB', color: '#9CA3AF', fontWeight: 500, fontSize: 9, textTransform: 'uppercase' }}>Side</th>
                <th style={{ padding: '4px 2px', borderBottom: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB', color: '#9CA3AF', fontWeight: 500, fontSize: 9, textTransform: 'uppercase' }}>Offset</th>
                <th style={{ padding: '4px 2px', borderBottom: '1px solid #E5E7EB', color: '#9CA3AF', fontWeight: 500, fontSize: 9, textTransform: 'uppercase' }}>Anchor</th>
                <th style={{ padding: '4px 2px', borderBottom: '1px solid #E5E7EB', color: '#9CA3AF', fontWeight: 500, fontSize: 9, textTransform: 'uppercase' }}>Side</th>
                <th style={{ padding: '4px 2px', borderBottom: '1px solid #E5E7EB', color: '#9CA3AF', fontWeight: 500, fontSize: 9, textTransform: 'uppercase' }}>Offset</th>
              </tr>
            </thead>
            <tbody>
              {ROUTING_TYPES.map(([code, label]) => {
                const isDefault = code === 'defaults';
                const placement = isDefault
                  ? theme.edgeLabelPositions?.defaults
                  : perType[code];
                const basePlacement = isDefault
                  ? DEFAULT_PROCESS_THEME.edgeLabelPositions.defaults
                  : defaultPerType[code] ?? DEFAULT_PROCESS_THEME.edgeLabelPositions.defaults;
                const anchor = placement?.anchor ?? basePlacement.anchor;
                const side = placement?.side ?? basePlacement.side;
                const offset = placement?.offsetPx ?? basePlacement.offsetPx;
                const pathPrefix = isDefault ? ['edgeLabelPositions', 'defaults'] : ['edgeLabelPositions', 'perType', code];

                return (
                  <tr key={code} style={{ background: isDefault ? '#F5F3FF' : 'transparent' }}>
                    <td style={{ padding: '3px 10px', borderBottom: '1px solid #F3F4F6', fontWeight: isDefault ? 600 : 400, color: '#374151', whiteSpace: 'nowrap' }}>{label}</td>
                    <td style={{ padding: '1px 2px', borderBottom: '1px solid #F3F4F6', borderRight: '1px solid #F3F4F6' }}>
                      <Select value={anchor} options={ANCHOR_OPTIONS} onChange={v => set_([...pathPrefix, 'anchor'], v)} style={compactSelectStyle} />
                    </td>
                    <td style={{ padding: '1px 2px', borderBottom: '1px solid #F3F4F6', borderRight: '1px solid #E5E7EB' }}>
                      <Select value={side} options={SIDE_OPTIONS} onChange={v => set_([...pathPrefix, 'side'], v)} style={compactSelectStyle} />
                    </td>
                    <td style={{ padding: '1px 2px', borderBottom: '1px solid #F3F4F6', borderRight: '1px solid #E5E7EB' }}>
                      <Num value={offset} onChange={v => set_([...pathPrefix, 'offsetPx'], v)} min={-40} max={80} step={1} unit="px" width={52} />
                    </td>
                    <td style={{ padding: '1px 2px', borderBottom: '1px solid #F3F4F6', borderRight: '1px solid #F3F4F6' }}>
                      <Select value={placement?.secondaryAnchor ?? basePlacement?.secondaryAnchor ?? 'mid'} options={ANCHOR_OPTIONS} onChange={v => set_([...pathPrefix, 'secondaryAnchor'], v)} style={compactSelectStyle} />
                    </td>
                    <td style={{ padding: '1px 2px', borderBottom: '1px solid #F3F4F6', borderRight: '1px solid #E5E7EB' }}>
                      <Select value={placement?.secondarySide ?? basePlacement?.secondarySide ?? 'center'} options={SIDE_OPTIONS} onChange={v => set_([...pathPrefix, 'secondarySide'], v)} style={compactSelectStyle} />
                    </td>
                    <td style={{ padding: '1px 2px', borderBottom: '1px solid #F3F4F6' }}>
                      <Num value={placement?.secondaryOffsetPx ?? basePlacement?.secondaryOffsetPx ?? 0} onChange={v => set_([...pathPrefix, 'secondaryOffsetPx'], v)} min={-40} max={80} step={1} unit="px" width={52} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Swimlanes & Curtains ────────────────────────────── */}
      <Section title="Swimlanes & Boundaries">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <Field label="Lane body"><ColorInput value={theme.lanes.bodyFill} onChange={v => set_(['lanes', 'bodyFill'], v)} /></Field>
            <Field label="Lane header"><ColorInput value={theme.lanes.headerFill} onChange={v => set_(['lanes', 'headerFill'], v)} /></Field>
            <Field label="Border"><ColorInput value={theme.lanes.borderColor} onChange={v => set_(['lanes', 'borderColor'], v)} /></Field>
            <Field label="Label"><ColorInput value={theme.lanes.labelColor} onChange={v => set_(['lanes', 'labelColor'], v)} /></Field>
            <Field label="Border width" hint="px"><Num value={theme.lanes.borderWidth} onChange={v => set_(['lanes', 'borderWidth'], v)} min={0.5} max={4} step={0.5} unit="px" width={56} /></Field>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {(['inbound', 'outbound'] as const).map(side => (
              <div key={side} style={{ padding: '8px 10px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: side === 'inbound' ? '#185FA5' : '#A32D2D', marginBottom: 6 }}>
                  {side === 'inbound' ? '← IN' : 'OUT →'}
                </div>
                <div style={{ display: 'grid', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>Fill</span>
                    <ColorInput value={theme.curtains[side].fill} onChange={v => set_(['curtains', side, 'fill'], v)} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>Stroke</span>
                    <ColorInput value={theme.curtains[side].stroke} onChange={v => set_(['curtains', side, 'stroke'], v)} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>Label</span>
                    <ColorInput value={theme.curtains[side].labelColor} onChange={v => set_(['curtains', side, 'labelColor'], v)} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>Opacity</span>
                    <Slider
                      value={theme.curtains[side].fillOpacity}
                      onChange={v => set_(['curtains', side, 'fillOpacity'], v)}
                      min={0} max={1} step={0.05}
                      format={v => `${Math.round(v * 100)}%`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Typography ─────────────────────────────────────── */}
      <Section title="Typography">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {([
            ['laneHeader', 'Lane header'],
            ['nodeLabel', 'Node label'],
            ['edgeLabel', 'Edge label'],
            ['curtainLabel', 'Curtain label'],
          ] as [string, string][]).map(([key, label]) => (
            <Field key={key} label={label} hint="px">
              <Num
                value={theme.typography[key]?.fontSizePx ?? 10}
                onChange={v => set_(['typography', key, 'fontSizePx'], v)}
                min={6} max={20} unit="px" width={56}
              />
            </Field>
          ))}
        </div>
      </Section>

      {/* ── Canvas Tokens ──────────────────────────────────── */}
      <Section title="Canvas">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="Header height" hint="px"><Num value={theme.canvasTokens.laneHeaderHeight} onChange={v => set_(['canvasTokens', 'laneHeaderHeight'], v)} min={12} max={60} unit="px" width={56} /></Field>
          <Field label="Curtain width" hint="px"><Num value={theme.canvasTokens.baseCurtainWidth} onChange={v => set_(['canvasTokens', 'baseCurtainWidth'], v)} min={40} max={200} unit="px" width={56} /></Field>
          <Field label="Curtain padding" hint="px"><Num value={theme.canvasTokens.curtainPadding} onChange={v => set_(['canvasTokens', 'curtainPadding'], v)} min={8} max={80} unit="px" width={56} /></Field>
          <Field label="Bounds padding" hint="px"><Num value={theme.canvasTokens.visualBoundsPadding} onChange={v => set_(['canvasTokens', 'visualBoundsPadding'], v)} min={0} max={60} unit="px" width={56} /></Field>
          <Field label="Label container" hint="px"><Num value={theme.canvasTokens.labelContainerWidth} onChange={v => set_(['canvasTokens', 'labelContainerWidth'], v)} min={40} max={240} unit="px" width={56} /></Field>
        </div>
      </Section>
    </div>
  );
};
