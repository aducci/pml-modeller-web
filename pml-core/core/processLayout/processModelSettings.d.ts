/**
 * Process Model Settings Controller
 *
 * Single source of truth for all user-facing settings in the process model
 * workspace. Converts them into the layout engine's LayoutSettings contract.
 *
 * Rule: every setting that a user can toggle lives in ProcessModelUserSettings.
 * Nothing outside this file should construct partial LayoutSettings overrides
 * from raw booleans or strings scattered across component state.
 */
import { DeepPartial, LayoutDensityMode, LayoutSettings, ActivitySizingMode } from './layoutTypes';
export interface ProcessModelUserSettings {
    densityMode: LayoutDensityMode;
    activitySizingMode: ActivitySizingMode;
    themePresetId: string;
    visibilityMode: 'default' | 'guided' | 'focus' | 'full';
    horizontalConnectionsOnly: boolean;
}
export declare const DEFAULT_PROCESS_MODEL_USER_SETTINGS: ProcessModelUserSettings;
/**
 * Converts user-facing settings and the live canvas dimensions into the
 * partial LayoutSettings overrides that computeProcessLayout() accepts.
 * This is the only place that translation happens.
 */
export declare function buildLayoutSettingsOverrides(userSettings: ProcessModelUserSettings, canvas: {
    width: number;
    height: number;
}): DeepPartial<LayoutSettings>;
//# sourceMappingURL=processModelSettings.d.ts.map