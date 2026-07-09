/**
 * Theme presets for process model rendering.
 *
 * Presets are declarative overlays resolved against the active layout settings.
 * All presets must populate every surface in ProcessThemeSchema so that the
 * midnight-ops dark test confirms no remaining hardcodes in the renderer.
 */
import { LayoutSettings } from '../processLayout/layoutTypes';
import { ProcessThemeSchema } from './styleSchema';
export interface ProcessThemePreset {
    id: string;
    name: string;
    description: string;
    resolve: (settings: LayoutSettings) => ProcessThemeSchema;
}
export declare const PROCESS_THEME_PRESETS: ProcessThemePreset[];
export declare function resolveThemePresetById(settings: LayoutSettings, presetId: string): ProcessThemeSchema;
//# sourceMappingURL=themePresets.d.ts.map