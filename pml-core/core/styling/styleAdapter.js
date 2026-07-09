/**
 * Read-only adapter that builds a theme from layout settings.
 *
 * canvasConfig.colors is deprecated — the adapter no longer reads colors from
 * it. All defaults come from DEFAULT_PROCESS_THEME. canvasTokens are still
 * sourced from canvasConfig for backward compatibility with spacing overrides.
 */
import { DEFAULT_PROCESS_THEME } from './defaultProcessTheme';
function mergeElementStyle(base, override) {
    if (!override) {
        return base;
    }
    return {
        ...base,
        ...override,
        appearance: { ...base.appearance, ...override.appearance },
        text: { ...base.text, ...override.text },
        infoPolicy: { ...base.infoPolicy, ...override.infoPolicy },
        interaction: { ...base.interaction, ...override.interaction },
    };
}
/**
 * Builds a theme object from layout settings.
 * Colors always come from DEFAULT_PROCESS_THEME (canvasConfig.colors is
 * deprecated and ignored). Canvas layout tokens are still pulled from
 * canvasConfig so spacing overrides continue to work.
 */
export function resolveThemeFromLayoutSettings(settings, options) {
    const theme = {
        ...DEFAULT_PROCESS_THEME,
        id: options?.id ?? DEFAULT_PROCESS_THEME.id,
        name: options?.name ?? DEFAULT_PROCESS_THEME.name,
        description: options?.description ?? DEFAULT_PROCESS_THEME.description,
        canvasTokens: {
            laneHeaderHeight: settings.canvasConfig.laneHeaderHeight,
            baseCurtainWidth: settings.canvasConfig.baseCurtainWidth,
            curtainPadding: settings.canvasConfig.curtainPadding,
            visualBoundsPadding: settings.canvasConfig.visualBoundsPadding,
            labelContainerWidth: settings.canvasConfig.labelContainerWidth,
        },
    };
    const overrides = options?.elementOverrides;
    if (!overrides) {
        return theme;
    }
    const patchedElementStyles = {
        ...theme.elementStyles,
    };
    const keys = Object.keys(overrides);
    for (const key of keys) {
        patchedElementStyles[key] = mergeElementStyle(patchedElementStyles[key], overrides[key]);
    }
    return {
        ...theme,
        elementStyles: patchedElementStyles,
    };
}
