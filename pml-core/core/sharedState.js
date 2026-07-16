export const SHARED_STORAGE_KEY = 'pml_dsl_shared_state';
// Bump when SharedState's shape changes in a way that requires migrating
// previously-persisted localStorage payloads (see migrateSharedState below).
export const SHARED_STATE_SCHEMA_VERSION = 1;
const EMPTY_SHARED_STATE = {
    schemaVersion: SHARED_STATE_SCHEMA_VERSION,
    themeOverrides: {},
    layoutSettingsOverrides: {},
    patternTable: [],
    routingRules: [],
};
function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/**
 * Validates and normalizes untrusted JSON at the localStorage boundary.
 * Never throws: any malformed field falls back to its empty default rather
 * than propagating a bad shape into the settings-merge pipeline downstream
 * (createLayoutSettings/deepMerge assume well-typed input, not raw JSON).
 */
export function parseSharedState(raw) {
    if (!isPlainObject(raw))
        return null;
    // Future schema migrations key off this field. There's only ever been
    // version 1 so far, so out-of-range values are treated as unreadable
    // rather than guessed at.
    const schemaVersion = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 1;
    if (schemaVersion > SHARED_STATE_SCHEMA_VERSION)
        return null;
    return {
        schemaVersion: SHARED_STATE_SCHEMA_VERSION,
        themeOverrides: isPlainObject(raw.themeOverrides) ? raw.themeOverrides : {},
        layoutSettingsOverrides: isPlainObject(raw.layoutSettingsOverrides) ? raw.layoutSettingsOverrides : {},
        patternTable: Array.isArray(raw.patternTable) ? raw.patternTable : [],
        routingRules: Array.isArray(raw.routingRules) ? raw.routingRules : [],
    };
}
export function readSharedState() {
    try {
        const raw = localStorage.getItem(SHARED_STORAGE_KEY);
        if (!raw)
            return null;
        return parseSharedState(JSON.parse(raw));
    }
    catch {
        return null;
    }
}
export function writeSharedState(state) {
    try {
        const withVersion = { ...state, schemaVersion: SHARED_STATE_SCHEMA_VERSION };
        localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(withVersion));
    }
    catch {
        // storage full or unavailable
    }
}
export function onSharedStateChange(callback) {
    const handler = (e) => {
        if (e.key === SHARED_STORAGE_KEY && e.newValue) {
            try {
                const parsed = parseSharedState(JSON.parse(e.newValue));
                if (parsed)
                    callback(parsed);
            }
            catch {
                // ignore corrupt data
            }
        }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
}
