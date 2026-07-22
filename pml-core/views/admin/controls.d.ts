import React from 'react';
interface FieldProps {
    label: string;
    hint?: string;
    children: React.ReactNode;
    /**
     * Controls whether Field pins its content to the right edge (default) or
     * lets it sit right after the label. ColorInput fields in the theme
     * contextual panel (a narrow right-hand pane) use 'start' — right-aligned,
     * the color swatch landed at the true edge of the browser window, which is
     * what pushed the native color-picker popup off-screen.
     */
    align?: 'start' | 'end';
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