import React from 'react';
interface FieldProps {
    label: string;
    hint?: string;
    children: React.ReactNode;
    /**
     * Controls whether Field pins its content to the right edge (default) or
     * lets it sit right after the label. Superseded for color fields by
     * `reverseLayout` below, but still used as-is by Num/Select/Toggle fields.
     */
    align?: 'start' | 'end';
    /**
     * Puts the control column FIRST (left) and the label column SECOND
     * (right) — the opposite of Field's normal [label][control] order. Used
     * for every ColorInput field: a native <input type="color"> popup opens
     * anchored near its trigger's on-screen position, and the contextual
     * editor panel itself sits on one side of a split view — so simply
     * left/right-aligning content *inside* the control column wasn't enough
     * once the panel itself was near a screen edge. Reversing column order
     * (combined with putting the editor panel on the left side of the split,
     * see ThemePanel.tsx) keeps every swatch away from the true edge
     * regardless of viewport width.
     */
    reverseLayout?: boolean;
}
export declare const Field: React.FC<FieldProps>;
interface SectionProps {
    title: string;
    children: React.ReactNode;
    /** DOM id + scroll-margin, so a section can be scrolled into view (e.g.
     *  clicking an element in a live preview) without covering it behind a
     *  sticky header. */
    id?: string;
    /** Brief highlight ring shown right after being scrolled to via a preview
     *  click — cleared automatically, not a persistent "selected" state. */
    highlighted?: boolean;
}
export declare const Section: React.FC<SectionProps>;
interface NumProps {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    width?: number;
}
export declare const Num: React.FC<NumProps>;
interface SliderProps {
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step?: number;
    format?: (v: number) => string;
}
export declare const Slider: React.FC<SliderProps>;
interface ToggleProps {
    value: boolean;
    onChange: (v: boolean) => void;
}
export declare const Toggle: React.FC<ToggleProps>;
interface SelectProps<T extends string> {
    value: T;
    options: {
        value: T;
        label: string;
    }[];
    onChange: (v: T) => void;
    style?: React.CSSProperties;
}
export declare function Select<T extends string>({ value, options, onChange, style }: SelectProps<T>): React.JSX.Element;
interface ColorProps {
    value: string;
    onChange: (v: string) => void;
}
export declare const ColorInput: React.FC<ColorProps>;
export declare const ResetBtn: React.FC<{
    onClick: () => void;
}>;
export {};
//# sourceMappingURL=controls.d.ts.map