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
export const DEFAULT_PROCESS_MODEL_USER_SETTINGS = {
    densityMode: 'standard',
    activitySizingMode: 'standard',
    themePresetId: 'standard-light',
    visibilityMode: 'default',
    horizontalConnectionsOnly: false,
};
// ---------------------------------------------------------------------------
// Mapping: user settings → engine overrides
// ---------------------------------------------------------------------------
/**
 * Converts user-facing settings and the live canvas dimensions into the
 * partial LayoutSettings overrides that computeProcessLayout() accepts.
 * This is the only place that translation happens.
 */
export function buildLayoutSettingsOverrides(userSettings, canvas) {
    return {
        canvas,
        densityMode: userSettings.densityMode,
        sizing: {
            activitySizingMode: userSettings.activitySizingMode,
        },
        routing: {
            visibilityMode: userSettings.visibilityMode,
            horizontalConnectionsOnly: userSettings.horizontalConnectionsOnly,
        },
    };
}
