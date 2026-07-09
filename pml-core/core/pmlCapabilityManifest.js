/**
 * Single source of truth for parser/editor feature capabilities.
 * Keep this in sync with implementation and spec status notes.
 */
export const PML_CAPABILITY_MANIFEST = {
    parser: {
        processHeaderLevelNameValueChain: true,
        processHeaderVersionStatus: true,
        actorScopedBlocks: true,
        eventVerboseShorthand: true,
        taskTrailingArrow: true,
        decisionIfElseSugar: true,
        enumRouteSupport: true,
        parallelGateway: false,
        flowKeyBlock: true,
        contextYamlBlock: true,
    },
    editor: {
        typedDiagnostics: true,
        strictLooseModeToggle: false,
        snippetsForPhase1: false,
    },
};
