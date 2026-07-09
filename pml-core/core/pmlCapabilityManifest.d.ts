export interface PmlCapabilityManifest {
    parser: {
        processHeaderLevelNameValueChain: boolean;
        processHeaderVersionStatus: boolean;
        actorScopedBlocks: boolean;
        eventVerboseShorthand: boolean;
        taskTrailingArrow: boolean;
        decisionIfElseSugar: boolean;
        enumRouteSupport: boolean;
        parallelGateway: boolean;
        flowKeyBlock: boolean;
        contextYamlBlock: boolean;
    };
    editor: {
        typedDiagnostics: boolean;
        strictLooseModeToggle: boolean;
        snippetsForPhase1: boolean;
    };
}
/**
 * Single source of truth for parser/editor feature capabilities.
 * Keep this in sync with implementation and spec status notes.
 */
export declare const PML_CAPABILITY_MANIFEST: PmlCapabilityManifest;
//# sourceMappingURL=pmlCapabilityManifest.d.ts.map