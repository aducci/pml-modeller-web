import type { ProcessTextStyle } from '../styling/styleSchema';
interface LabelFormatOptions {
    availableWidthPx?: number;
    charWidthPx?: number;
}
interface FormattedLabel {
    lines: string[];
    truncated: boolean;
}
export declare function formatLabel(text: string, style: ProcessTextStyle, options?: LabelFormatOptions): FormattedLabel;
export declare function toLetterSpacing(tracking?: 'normal' | 'wide' | 'wider'): string | undefined;
export {};
//# sourceMappingURL=labelFormatter.d.ts.map