/**
 * Read-only adapter that builds a theme from layout settings.
 *
 * canvasConfig.colors is deprecated — the adapter no longer reads colors from
 * it. All defaults come from DEFAULT_PROCESS_THEME. canvasTokens are still
 * sourced from canvasConfig for backward compatibility with spacing overrides.
 */
import { LayoutSettings } from '../processLayout/layoutTypes';
import { ProcessThemeSchema, ProcessElementType, ProcessElementStyleSchema } from './styleSchema';
export interface ResolveThemeOptions {
    id?: string;
    name?: string;
    description?: string;
    elementOverrides?: Partial<Record<ProcessElementType | 'unknown' | 'gateway', Partial<ProcessElementStyleSchema>>>;
}
/**
 * Builds a theme object from layout settings.
 * Colors always come from DEFAULT_PROCESS_THEME (canvasConfig.colors is
 * deprecated and ignored). Canvas layout tokens are still pulled from
 * canvasConfig so spacing overrides continue to work.
 */
export declare function resolveThemeFromLayoutSettings(settings: LayoutSettings, options?: ResolveThemeOptions): ProcessThemeSchema;
//# sourceMappingURL=styleAdapter.d.ts.map