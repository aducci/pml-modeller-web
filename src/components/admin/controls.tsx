import React from 'react';

// ─── Field wrapper ──────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}
export const Field: React.FC<FieldProps> = ({ label, hint, children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '8px 16px', padding: '7px 0', borderBottom: '1px solid #F1F0ED' }}>
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{label}</div>
      {hint && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{hint}</div>}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
      {children}
    </div>
  </div>
);

// ─── Section header ─────────────────────────────────────────────────────────
export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', padding: '4px 0 8px', borderBottom: '2px solid #E5E7EB', marginBottom: 4 }}>
      {title}
    </div>
    {children}
  </div>
);

// ─── Number input ───────────────────────────────────────────────────────────
interface NumProps { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string; width?: number; }
export const Num: React.FC<NumProps> = ({ value, onChange, min, max, step = 1, unit, width = 72 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <input
      type="number"
      value={value}
      min={min} max={max} step={step}
      onChange={e => {
        const v = parseFloat(e.target.value);
        if (!isNaN(v)) onChange(v);
      }}
      style={{ width, height: 28, padding: '0 6px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 5, background: '#FAFAFA', color: '#111827', outline: 'none', textAlign: 'right' }}
      onFocus={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.background = '#fff'; }}
      onBlur={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.background = '#FAFAFA'; }}
    />
    {unit && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{unit}</span>}
  </div>
);

// ─── Slider ─────────────────────────────────────────────────────────────────
interface SliderProps { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; format?: (v: number) => string; }
export const Slider: React.FC<SliderProps> = ({ value, onChange, min, max, step = 1, format }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <input
      type="range"
      value={value} min={min} max={max} step={step}
      onChange={e => onChange(parseFloat(e.target.value))}
      style={{ width: 120, accentColor: '#6366F1', cursor: 'pointer' }}
    />
    <span style={{ fontSize: 12, color: '#374151', fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'right' }}>
      {format ? format(value) : value}
    </span>
  </div>
);

// ─── Toggle ─────────────────────────────────────────────────────────────────
interface ToggleProps { value: boolean; onChange: (v: boolean) => void; }
export const Toggle: React.FC<ToggleProps> = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    style={{
      position: 'relative', width: 36, height: 20, borderRadius: 10,
      background: value ? '#6366F1' : '#D1D5DB',
      border: 'none', cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16,
      borderRadius: '50%', background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.15s',
    }} />
  </button>
);

// ─── Select ─────────────────────────────────────────────────────────────────
interface SelectProps<T extends string> { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; style?: React.CSSProperties; }
export function Select<T extends string>({ value, options, onChange, style }: SelectProps<T>) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as T)}
      style={{ height: 28, padding: '0 24px 0 8px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 5, background: '#FAFAFA', color: '#111827', cursor: 'pointer', outline: 'none', appearance: 'auto', ...style }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── Color swatch input ─────────────────────────────────────────────────────
interface ColorProps { value: string; onChange: (v: string) => void; }
export const ColorInput: React.FC<ColorProps> = ({ value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <div style={{ width: 20, height: 20, borderRadius: 4, background: value, border: '1px solid #D1D5DB', flexShrink: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ position: 'absolute', inset: '-4px', width: '200%', height: '200%', opacity: 0, cursor: 'pointer' }}
      />
    </div>
    <input
      type="text"
      value={value}
      onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value); }}
      style={{ width: 72, height: 28, padding: '0 6px', fontSize: 11, fontFamily: 'monospace', border: '1px solid #D1D5DB', borderRadius: 5, background: '#FAFAFA', color: '#374151' }}
    />
  </div>
);

// ─── Reset button ────────────────────────────────────────────────────────────
export const ResetBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{ fontSize: 11, color: '#9CA3AF', background: 'none', border: '1px solid #E5E7EB', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}
    onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
    onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
  >
    Reset
  </button>
);
