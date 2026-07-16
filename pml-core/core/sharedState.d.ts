export declare const SHARED_STORAGE_KEY = "pml_dsl_shared_state";
export declare const SHARED_STATE_SCHEMA_VERSION = 1;
export interface SharedState {
    schemaVersion: number;
    themeOverrides: Record<string, any>;
    layoutSettingsOverrides: Record<string, any>;
    patternTable: any[];
    routingRules: any[];
}
/**
 * Validates and normalizes untrusted JSON at the localStorage boundary.
 * Never throws: any malformed field falls back to its empty default rather
 * than propagating a bad shape into the settings-merge pipeline downstream
 * (createLayoutSettings/deepMerge assume well-typed input, not raw JSON).
 */
export declare function parseSharedState(raw: unknown): SharedState | null;
export declare function readSharedState(): SharedState | null;
export declare function writeSharedState(state: Omit<SharedState, 'schemaVersion'>): void;
export declare function onSharedStateChange(callback: (state: SharedState) => void): () => void;
//# sourceMappingURL=sharedState.d.ts.map