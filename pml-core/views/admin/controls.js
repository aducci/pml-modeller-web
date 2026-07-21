import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const Field = ({ label, hint, children }) => (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '8px 16px', padding: '7px 0', borderBottom: '1px solid #F1F0ED' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 12, fontWeight: 500, color: '#374151' }, children: label }), hint && _jsx("div", { style: { fontSize: 11, color: '#9CA3AF', marginTop: 1 }, children: hint })] }), _jsx("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }, children: children })] }));
export const Section = ({ title, children, id, highlighted }) => (_jsxs("div", { id: id, style: {
        marginBottom: 24, scrollMarginTop: 12, borderRadius: 8,
        outline: highlighted ? '2px solid #6366F1' : '2px solid transparent',
        outlineOffset: 4,
        transition: 'outline-color 0.2s',
    }, children: [_jsx("div", { style: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', padding: '4px 0 8px', borderBottom: '2px solid #E5E7EB', marginBottom: 4 }, children: title }), children] }));
export const Num = ({ value, onChange, min, max, step = 1, unit, width = 72 }) => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx("input", { type: "number", value: value, min: min, max: max, step: step, onChange: e => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v))
                    onChange(v);
            }, style: { width, height: 28, padding: '0 6px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 5, background: '#FAFAFA', color: '#111827', outline: 'none', textAlign: 'right' }, onFocus: e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.background = '#fff'; }, onBlur: e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.background = '#FAFAFA'; } }), unit && _jsx("span", { style: { fontSize: 11, color: '#9CA3AF' }, children: unit })] }));
export const Slider = ({ value, onChange, min, max, step = 1, format }) => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("input", { type: "range", value: value, min: min, max: max, step: step, onChange: e => onChange(parseFloat(e.target.value)), style: { width: 120, accentColor: '#6366F1', cursor: 'pointer' } }), _jsx("span", { style: { fontSize: 12, color: '#374151', fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'right' }, children: format ? format(value) : value })] }));
export const Toggle = ({ value, onChange }) => (_jsx("button", { onClick: () => onChange(!value), style: {
        position: 'relative', width: 36, height: 20, borderRadius: 10,
        background: value ? '#6366F1' : '#D1D5DB',
        border: 'none', cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0,
    }, children: _jsx("span", { style: {
            position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16,
            borderRadius: '50%', background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.15s',
        } }) }));
export function Select({ value, options, onChange, style }) {
    return (_jsx("select", { value: value, onChange: e => onChange(e.target.value), style: { height: 28, padding: '0 24px 0 8px', fontSize: 12, border: '1px solid #D1D5DB', borderRadius: 5, background: '#FAFAFA', color: '#111827', cursor: 'pointer', outline: 'none', appearance: 'auto', ...style }, children: options.map(o => _jsx("option", { value: o.value, children: o.label }, o.value)) }));
}
export const ColorInput = ({ value, onChange }) => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx("input", { type: "color", value: value, onChange: e => onChange(e.target.value), title: "Pick a color", style: { width: 24, height: 24, padding: 0, border: '1px solid #D1D5DB', borderRadius: 4, cursor: 'pointer', flexShrink: 0, background: 'none' } }), _jsx("input", { type: "text", value: value, onChange: e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value))
                onChange(e.target.value); }, style: { width: 72, height: 28, padding: '0 6px', fontSize: 11, fontFamily: 'monospace', border: '1px solid #D1D5DB', borderRadius: 5, background: '#FAFAFA', color: '#374151' } })] }));
// ─── Reset button ────────────────────────────────────────────────────────────
export const ResetBtn = ({ onClick }) => (_jsx("button", { onClick: onClick, style: { fontSize: 11, color: '#9CA3AF', background: 'none', border: '1px solid #E5E7EB', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }, onMouseEnter: e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FCA5A5'; }, onMouseLeave: e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#E5E7EB'; }, children: "Reset" }));
