/**
 * Generic deep-merge for "typed defaults + partial override" objects —
 * the shared shape behind LayoutSettings, ProcessThemeSchema overrides, etc.
 * Plain objects are merged key-by-key; arrays and primitives in overrides
 * replace the base value wholesale (arrays are not merged element-wise).
 */
function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function deepMerge(base, overrides) {
    if (overrides === undefined)
        return base;
    if (!isPlainObject(base) || !isPlainObject(overrides)) {
        return overrides;
    }
    const result = { ...base };
    for (const key of Object.keys(overrides)) {
        result[key] = deepMerge(base[key], overrides[key]);
    }
    return result;
}
