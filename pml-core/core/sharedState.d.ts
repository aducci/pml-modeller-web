export declare const SHARED_STORAGE_KEY = "pml_dsl_shared_state";
export interface SharedState {
    themeOverrides: Record<string, any>;
    layoutSettingsOverrides: Record<string, any>;
    patternTable: any[];
    routingRules: any[];
}
export declare function readSharedState(): SharedState | null;
export declare function writeSharedState(state: SharedState): void;
export declare function onSharedStateChange(callback: (state: SharedState) => void): () => void;
//# sourceMappingURL=sharedState.d.ts.map