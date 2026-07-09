import React from 'react';
interface FieldProps {
    label: string;
    hint?: string;
    children: React.ReactNode;
}
export declare const Field: React.FC<FieldProps>;
export declare const Section: React.FC<{
    title: string;
    children: React.ReactNode;
}>;
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