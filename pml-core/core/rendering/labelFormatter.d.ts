import type { ProcessTextStyle } from '../styling/styleSchema';
export interface LabelFormatOptions {
    availableWidthPx?: number;
    charWidthPx?: number;
}
export interface FormattedLabel {
    lines: string[];
    truncated: boolean;
}
export declare function formatLabel(text: string, style: ProcessTextStyle, options?: LabelFormatOptions): FormattedLabel;
export declare function toLetterSpacing(tracking?: 'normal' | 'wide' | 'wider'): string | undefined;
//# sourceMappingURL=labelFormatter.d.ts.map