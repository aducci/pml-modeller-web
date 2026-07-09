export function buildRouteWhyPacket(scenario, portResolution, geometry, elbowYPolicy, patternFamily) {
    const downgrades = [];
    if (portResolution.sourceDowngradeReason)
        downgrades.push(portResolution.sourceDowngradeReason);
    if (portResolution.targetDowngradeReason)
        downgrades.push(portResolution.targetDowngradeReason);
    portResolution.lockedViolations.forEach((v) => downgrades.push(`locked-violation:${v}`));
    const constraintsApplied = [...scenario.appliedPolicies];
    if (geometry.hardSideContractCorrected)
        constraintsApplied.push('hard-side-contract-corrected');
    if (scenario.flowLayerBias.downgradeLockedPorts)
        constraintsApplied.push('flow-layer-locked-port-downgrade');
    return {
        scenarioKey: scenario.scenarioKey,
        patternFamily: patternFamily ?? scenario.scenarioKey,
        selectedPatternId: geometry.bendType,
        crossLaneGeometryMode: geometry.selectedGeometryMode,
        ports: {
            sourceRequested: portResolution.sourceRequested,
            sourceSelected: portResolution.sourceSelected,
            targetRequested: portResolution.targetRequested,
            targetSelected: portResolution.targetSelected,
        },
        elbowYPolicy,
        constraintsApplied,
        downgrades,
    };
}
// ---------------------------------------------------------------------------
// RoutingDiagnosticsV2 — full provenance (spec Section 15)
// ---------------------------------------------------------------------------
export function buildRoutingDiagnosticsV2(scenario, portResolution, geometry, rule, channel) {
    const elbowY = resolveElbowYFromGeometry(geometry, portResolution);
    const portDowngradeOccurred = Boolean(portResolution.sourceDowngradeReason) ||
        Boolean(portResolution.targetDowngradeReason) ||
        portResolution.lockedViolations.length > 0;
    const confidence = computeConfidence(scenario, portResolution, geometry, rule);
    const diag = {
        scenarioKey: scenario.scenarioKey,
        flowLayer: scenario.flowLayer,
        semanticRole: scenario.semanticRole,
        routeIntent: scenario.routeIntent,
        portAssignment: {
            sourcePortSelected: portResolution.sourceSelected,
            sourcePortRequested: portResolution.sourceRequested,
            sourceDowngradeReason: portResolution.sourceDowngradeReason,
            targetPortSelected: portResolution.targetSelected,
            targetPortRequested: portResolution.targetRequested,
            targetDowngradeReason: portResolution.targetDowngradeReason,
        },
        crossLaneGeometry: geometry.selectedGeometryMode
            ? {
                selectedMode: geometry.selectedGeometryMode,
                modeCandidates: rule.geometryModePreference ?? [],
                xCenterDeltaPx: scenario.crossLaneContext?.xCenterDeltaPx ?? 0,
                alignmentThresholdPx: rule.straightDownAlignmentThresholdPx ?? 20,
                verticalStraightEligible: false,
            }
            : undefined,
        elbowYResolved: elbowY,
        elbowYPolicy: rule.elbowYPolicy,
        // Populated by applyBundleResultToDiagnostics after world evaluation
        spatialAdjustmentsTested: [],
        evaluatedBundleCandidates: [],
        selectedWorldId: undefined,
        confidence,
    };
    return diag;
}
/** Merges world evaluation results into an existing diagnostics object (mutates in place). */
export function applyBundleResultToDiagnostics(diag, bundleResult) {
    diag.selectedWorldId = bundleResult.selectedWorldId;
    diag.optimizationWindowId = bundleResult.windowId;
    diag.evaluatedBundleCandidates = bundleResult.candidateScores.map((s) => ({
        candidateId: s.candidateId,
        geometryScore: s.geometry,
        perceptualScore: s.perceptual,
        coherenceScore: s.coherence,
        semanticFitScore: s.semanticFit,
    }));
}
// ---------------------------------------------------------------------------
// Provenance string builder (compact log line)
// ---------------------------------------------------------------------------
export function buildProvenanceString(why, channel, extraTokens) {
    const tokens = [
        `scenario=${why.scenarioKey}`,
        `channel=${channel}`,
        `portRule=${why.scenarioKey}`,
        `ports=${why.ports.sourceRequested}->${why.ports.sourceSelected}|${why.ports.targetRequested}->${why.ports.targetSelected}`,
        why.downgrades.length > 0 ? `downgrades=${why.downgrades.join(',')}` : '',
        `pattern=${why.selectedPatternId}`,
        `policies=${why.constraintsApplied.join(',') || 'none'}`,
        `elbowY=${why.elbowYPolicy}`,
        why.crossLaneGeometryMode ? `geoMode=${why.crossLaneGeometryMode}` : '',
        ...(extraTokens ?? []),
    ].filter(Boolean);
    return tokens.join(' | ');
}
// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function resolveElbowYFromGeometry(geometry, portResolution) {
    const waypoints = geometry.waypoints;
    if (waypoints.length === 0)
        return 0;
    // The "elbow Y" is the Y coordinate of the last waypoint before the target
    // (the horizontal approach segment terminus).
    const lastBend = waypoints[waypoints.length - 2];
    return lastBend?.y ?? waypoints[waypoints.length - 1]?.y ?? 0;
}
function computeConfidence(scenario, portResolution, geometry, rule) {
    const portDowngradeOccurred = Boolean(portResolution.sourceDowngradeReason) ||
        Boolean(portResolution.targetDowngradeReason) ||
        portResolution.lockedViolations.length > 0;
    // Scenario confidence: 1.0 if scenario is well-known, lower for fallback key
    const scenarioConfidence = rule.scenarioKey === scenario.scenarioKey ? 1.0 : 0.6;
    // Pattern fit: explicit options are deterministic; penalize only port downgrades.
    const patternFitConfidence = portDowngradeOccurred ? 0.8 : 1.0;
    // Spatial compromise: 0 = no compromise; updated by applyBundleResultToDiagnostics
    const spatialCompromiseLevel = geometry.hardSideContractCorrected ? 0.3 : 0.0;
    // Flow layer honored: true if the flow layer bias was respected
    const flowLayerHonored = !(scenario.flowLayerBias.downgradeLockedPorts && portResolution.lockedViolations.length > 0);
    return {
        scenarioConfidence,
        patternFitConfidence,
        spatialCompromiseLevel,
        portDowngradeOccurred,
        elbowYPolicyApplied: rule.elbowYPolicy,
        flowLayerHonored,
    };
}
export function deriveRoutingTypeCode(bendType, sourcePort, targetPort, elbowYPolicy, scenarioKey, channel, isSelfLoop) {
    if (isSelfLoop) {
        return { code: 'SLP', label: 'Self Loop', skew: '', bendCount: 3, isDashed: false };
    }
    // Only true loopback cycles are back-routes. cross-lane-upward is forward flow.
    const isBackRoute = scenarioKey.includes('loopback');
    if (bendType === 'straight') {
        if (sourcePort === 'right' && targetPort === 'left')
            return { code: 'STH', label: 'Straight Horizontal', skew: '', bendCount: 0, isDashed: false };
        if (sourcePort === 'bottom' && targetPort === 'top')
            return { code: 'STV', label: 'Straight Vertical', skew: '', bendCount: 0, isDashed: false };
    }
    const skew = elbowYPolicy === 'matchSourceConnectionY' ? 'near'
        : elbowYPolicy === 'matchTargetConnectionY' ? 'far'
            : 'mid';
    if (bendType === 'h-first')
        return { code: 'SEH', label: 'Single Elbow Horizontal', skew, bendCount: 1, isDashed: false };
    if (bendType === 'v-first')
        return { code: 'SEV', label: 'Single Elbow Vertical', skew, bendCount: 1, isDashed: false };
    if (bendType === 'h-v-h') {
        if (isBackRoute)
            return { code: 'TEH', label: 'Triple Elbow Horizontal', skew: '', bendCount: 3, isDashed: true };
        if (channel !== 0)
            return { code: 'POH', label: 'Parallel Offset Horizontal', skew: `offset:${channel}`, bendCount: 2, isDashed: false };
        if (skew === 'near')
            return { code: 'DEN', label: 'Double Elbow Near-Exit H', skew, bendCount: 2, isDashed: false };
        if (skew === 'far')
            return { code: 'DEF', label: 'Double Elbow Far-Exit H', skew, bendCount: 2, isDashed: false };
        return { code: 'DEH', label: 'Double Elbow Horizontal', skew, bendCount: 2, isDashed: false };
    }
    if (bendType === 'v-h-v') {
        if (isBackRoute)
            return { code: 'TEV', label: 'Triple Elbow Vertical', skew: '', bendCount: 3, isDashed: true };
        if (channel !== 0)
            return { code: 'POV', label: 'Parallel Offset Vertical', skew: `offset:${channel}`, bendCount: 2, isDashed: false };
        if (sourcePort === 'bottom' && targetPort === 'left')
            return { code: 'DBL', label: 'Double Elbow Bottom-to-Left', skew, bendCount: 2, isDashed: false };
        return { code: 'DEV', label: 'Double Elbow Vertical', skew, bendCount: 2, isDashed: false };
    }
    return { code: 'AOT', label: 'Auto Orthogonal', skew: '', bendCount: -1, isDashed: false };
}
