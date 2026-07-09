/**
 * Layout Result Diagnostics
 *
 * Centralized diagnostics assembly for layout quality, boundary placement,
 * and routing provenance tracking.
 */
import { rectsOverlap, nodeRect } from '../layoutGeometry';
export function buildLayoutDiagnostics(state) {
    const routingSmellWarnings = detectRoutingSmells(state);
    const warnings = normalizeMessages([...state.diagnostics.warnings, ...routingSmellWarnings]);
    const errors = normalizeMessages(state.diagnostics.errors);
    const health = computeLayoutHealth(state);
    const suggestions = buildLayoutSuggestions(state, health);
    return {
        health,
        boundaryPlacementLogs: buildBoundaryLogs(state),
        routingProvenance: collectRoutingProvenance(state),
        routingMetrics: state.diagnostics.routingMetrics,
        convergenceMetrics: state.diagnostics.convergenceMetrics,
        stageHistory: [...state.stageHistory],
        currentStage: state.stageName,
        provenanceLog: [...state.provenanceLog],
        determinismFingerprint: computeDeterminismFingerprint(state),
        issues: buildIssues(warnings, errors),
        warnings,
        errors,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
}
function buildLayoutSuggestions(state, health) {
    const suggestions = [];
    const conv = state.diagnostics.convergenceMetrics;
    const metrics = state.diagnostics.routingMetrics;
    // Convergence: high edge crossing count → try barycenter slot ordering
    if (health.routingQuality < 0.6 && (metrics?.edgeCrossings ?? 0) > 2) {
        suggestions.push({
            category: 'routing',
            label: 'Reduce edge crossings',
            description: `${metrics?.edgeCrossings ?? 'Several'} edge crossings detected. Switching slot ordering to "barycenter" aligns stacked nodes to their neighbours, which often reduces crossings in dense diagrams.`,
            settingKey: 'layout.slotOrdering',
            suggestedValue: 'barycenter',
        });
    }
    // Degenerate elbows → try compact density mode
    if ((metrics?.degenerateElbows ?? 0) > 3) {
        suggestions.push({
            category: 'readability',
            label: 'Reduce degenerate elbows',
            description: `${metrics.degenerateElbows} degenerate elbows found. Switching to "compact" density mode folds sibling branches into shared depth columns, shortening route spans.`,
            settingKey: 'densityMode',
            suggestedValue: 'compact',
        });
    }
    // Many passes without convergence → diagram may be too dense
    if (conv && !conv.converged && conv.passCount > 1) {
        suggestions.push({
            category: 'structure',
            label: 'Layout did not converge',
            description: `The layout ran ${conv.passCount} passes without fully converging. Consider splitting this diagram into sub-processes or ${state.groupingStrategy.convergenceAdvice}.`,
        });
    }
    // High channel tier → many cross-lane edges competing for corridor space
    if ((metrics?.maxChannelTier ?? 0) > 3) {
        suggestions.push({
            category: 'routing',
            label: 'High channel tier',
            description: `Routing reached channel tier ${metrics.maxChannelTier}. Using the "annotation" key-flow strategy (add "key:" prefix to main flow edges in PML) guides routing priority and can reduce channel saturation.`,
            settingKey: 'layout.keyFlowStrategy',
            suggestedValue: 'annotation',
        });
    }
    // Node overlaps → spacing too tight
    if (health.overlappingNodes.length > 0) {
        suggestions.push({
            category: 'density',
            label: 'Node overlaps detected',
            description: `${health.overlappingNodes.length} pair(s) of nodes overlap. Increase nodeSpacingX / nodeSpacingY in layout settings, or switch to "spacious" density mode.`,
            settingKey: 'densityMode',
            suggestedValue: 'spacious',
        });
    }
    return suggestions;
}
function buildIssues(warnings, errors) {
    const warningIssues = warnings.map((message) => ({
        code: 'LAYOUT_WARNING',
        message,
        severity: 'warning',
    }));
    const errorIssues = errors.map((message) => ({
        code: 'LAYOUT_ERROR',
        message,
        severity: 'error',
    }));
    return [...warningIssues, ...errorIssues];
}
function detectRoutingSmells(state) {
    const warnings = [];
    const nodeById = new Map(state.nodes.map((node) => [node.id, node]));
    for (const edge of state.edges) {
        const routing = edge.routing;
        if (!routing) {
            continue;
        }
        const prefs = routing.preferences || {};
        const sourceNode = nodeById.get(edge.source);
        const targetNode = nodeById.get(edge.target);
        if (prefs.hardSideContractCorrected) {
            warnings.push(`Routing smell: ${edge.id} required hard-side contract correction.`);
        }
        if (routing.scenario === 'same-lane-loopback' && sourceNode?.y !== undefined && targetNode?.y !== undefined) {
            if (sourceNode.y > targetNode.y && routing.channel < 0) {
                warnings.push(`Routing smell: ${edge.id} is a lower-to-upper loopback but uses TOP channel ${routing.channel}.`);
            }
            if (sourceNode.y < targetNode.y && routing.channel > 0) {
                warnings.push(`Routing smell: ${edge.id} is an upper-to-lower loopback but uses BOTTOM channel ${routing.channel}.`);
            }
        }
        const normalizeSide = (side) => {
            if (!side)
                return undefined;
            return side === 'center-bottom' ? 'bottom' : side;
        };
        const sourcePort = normalizeSide(prefs.sourcePortSelected);
        const targetPort = normalizeSide(prefs.targetPortSelected);
        const sourceAnchor = normalizeSide(prefs.sourceAnchor);
        const targetAnchor = normalizeSide(prefs.targetAnchor);
        if (sourcePort && sourceAnchor && sourcePort !== sourceAnchor) {
            warnings.push(`Routing smell: ${edge.id} source port (${sourcePort}) differs from anchor (${sourceAnchor}).`);
        }
        if (targetPort && targetAnchor && targetPort !== targetAnchor) {
            warnings.push(`Routing smell: ${edge.id} target port (${targetPort}) differs from anchor (${targetAnchor}).`);
        }
    }
    return warnings;
}
function normalizeMessages(messages) {
    const unique = new Set();
    for (const message of messages) {
        const trimmed = message.trim();
        if (trimmed.length > 0) {
            unique.add(trimmed);
        }
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
}
function computeLayoutHealth(state) {
    const overlappingNodes = detectOverlaps(state.nodes);
    const routingQuality = estimateRoutingQuality(state);
    return {
        totalNodes: state.nodes.length,
        totalEdges: state.edges.length,
        cyclesDetected: state.diagnostics.health.cyclesDetected,
        unreachableNodes: state.diagnostics.health.unreachableNodes,
        overlappingNodes,
        routingQuality,
    };
}
function detectOverlaps(nodes) {
    const overlaps = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const n1 = nodes[i];
            const n2 = nodes[j];
            if (n1.x !== undefined &&
                n1.y !== undefined &&
                n2.x !== undefined &&
                n2.y !== undefined &&
                rectsOverlap(nodeRect(n1), nodeRect(n2))) {
                overlaps.push([n1.id, n2.id]);
            }
        }
    }
    return overlaps;
}
function estimateRoutingQuality(state) {
    if (state.diagnostics.routingMetrics) {
        const metrics = state.diagnostics.routingMetrics;
        const crossingPenalty = Math.min(1, metrics.edgeCrossings * 0.05);
        const degeneratePenalty = Math.min(1, metrics.degenerateElbows * 0.03);
        return Math.max(0, metrics.straightnessScore - crossingPenalty - degeneratePenalty);
    }
    // Quality score based on routing characteristics
    // Ranges from 0 (poor) to 1 (excellent)
    let totalBends = 0;
    let totalCrossings = 0;
    for (const edge of state.edges) {
        if (edge.routing?.waypoints) {
            totalBends += Math.max(0, edge.routing.waypoints.length - 2);
        }
    }
    // Simple heuristic: fewer bends = better quality
    const bendPenalty = Math.min(1, totalBends * 0.05);
    // Assume no crossing detection for now
    const crossingPenalty = 0;
    return 1 - (bendPenalty + crossingPenalty);
}
function buildBoundaryLogs(state) {
    const logs = state.nodes
        .filter((node) => node.x !== undefined && node.y !== undefined)
        .map((node) => ({
        nodeId: node.id,
        lane: node.laneId,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        channel: node.channel,
        timestamp: new Date().toISOString(),
    }))
        .sort((a, b) => {
        const laneA = a.lane || '';
        const laneB = b.lane || '';
        const laneCmp = laneA.localeCompare(laneB);
        if (laneCmp !== 0) {
            return laneCmp;
        }
        if (a.x !== b.x) {
            return a.x - b.x;
        }
        if (a.y !== b.y) {
            return a.y - b.y;
        }
        return a.nodeId.localeCompare(b.nodeId);
    });
    return logs;
}
function collectRoutingProvenance(state) {
    const provenance = state.edges
        .filter((edge) => edge.routing)
        .map((edge) => {
        const preferences = edge.routing?.preferences || {
            channel: edge.routing?.channel,
            corridorReason: edge.routing?.corridorReason,
        };
        const portTrace = {
            sourceRequested: preferences.sourcePortRequested,
            sourceSelected: preferences.sourcePortSelected,
            sourceDowngradeReason: preferences.sourceDowngradeReason,
            targetRequested: preferences.targetPortRequested,
            targetSelected: preferences.targetPortSelected,
            targetDowngradeReason: preferences.targetDowngradeReason,
            lockedPortViolations: preferences.lockedPortViolations,
            portRuleKey: preferences.portRuleKey,
            portRuleElbowYPolicy: preferences.portRuleElbowYPolicy,
            hardSideContractCorrected: preferences.hardSideContractCorrected,
        };
        const hasPortTrace = [
            portTrace.sourceRequested,
            portTrace.sourceSelected,
            portTrace.targetRequested,
            portTrace.targetSelected,
            portTrace.portRuleKey,
        ].some((value) => value !== undefined);
        return {
            edgeId: edge.id,
            scenario: edge.routing?.scenario || 'unknown',
            selectedPattern: edge.routing?.pattern || 'unknown',
            appliedPolicies: edge.routing?.policies || [],
            preferences,
            portTrace: hasPortTrace ? portTrace : undefined,
            reasoning: edge.routing?.provenance || edge.routing?.corridorReason || 'no provenance recorded',
        };
    })
        .sort((a, b) => a.edgeId.localeCompare(b.edgeId));
    return provenance;
}
function computeDeterminismFingerprint(state) {
    const parts = [
        ...state.stageHistory,
        ...state.nodes.slice().sort((a, b) => a.id.localeCompare(b.id)).map((node) => `${node.id}:${node.laneId || ''}:${node.channel ?? ''}:${node.x ?? ''}:${node.y ?? ''}`),
        ...state.edges.slice().sort((a, b) => a.id.localeCompare(b.id)).map((edge) => `${edge.id}:${edge.source}->${edge.target}:${edge.routing?.channel ?? ''}:${edge.routing?.pattern || ''}`),
    ].join('|');
    return hashString(parts);
}
function hashString(input) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (`0000000${(hash >>> 0).toString(16)}`).slice(-8);
}
