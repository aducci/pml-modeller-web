// Grouping strategies — one implementation per laneMode ('standard', 'virtual', 'byApp').
// This is the single place new grouping modes get added. Every other stage
// (ranking, lane geometry, lane consensus, diagnostics) consumes the resolved
// GroupingStrategy off LayoutState instead of branching on laneMode itself.
import { UNASSIGNED_APP_LANE_ID } from './layoutTypes';
function actorGroupKeyOf(node) {
    return node.actor;
}
function appGroupKeyOf(node) {
    const apps = node.metadata?.app;
    return Array.isArray(apps) && apps.length > 0 ? apps[0] : UNASSIGNED_APP_LANE_ID;
}
function buildActorLanes(state) {
    const settings = state.settings;
    const laneY = settings.spacing.laneGapTop;
    const actorSet = new Set();
    for (const node of state.nodes) {
        if (node.actor)
            actorSet.add(node.actor);
    }
    const sortedActors = Array.from(actorSet).sort((a, b) => a.localeCompare(b));
    const lanes = sortedActors.map((actorId) => ({
        id: actorId,
        actorId,
        label: actorId,
        x: 0,
        y: laneY,
        width: settings.canvas.width,
        height: settings.sizing.minLaneHeight,
        activeChannels: [0],
        channelDensityMode: settings.routing.channelDensityMode,
    }));
    if (lanes.length === 0) {
        lanes.push({
            id: 'default',
            actorId: 'default',
            label: 'Default',
            x: 0,
            y: laneY,
            width: settings.canvas.width,
            height: settings.sizing.minLaneHeight,
            activeChannels: [0],
            channelDensityMode: settings.routing.channelDensityMode,
        });
    }
    return lanes;
}
function buildAppLanes(state, graph) {
    const settings = state.settings;
    const laneY = settings.spacing.laneGapTop;
    // Group lanes by each node's first `app` reference instead of its actor. Nodes with
    // no `app` reference fall into a shared "Unassigned" lane rather than being dropped.
    const appLabelById = new Map();
    for (const entry of graph.catalogs?.app_registry ?? []) {
        appLabelById.set(entry.id, entry.description || entry.id);
    }
    const appIds = new Set();
    let hasUnassigned = false;
    for (const node of state.nodes) {
        const primaryApp = appGroupKeyOf(node);
        if (primaryApp && primaryApp !== UNASSIGNED_APP_LANE_ID)
            appIds.add(primaryApp);
        else
            hasUnassigned = true;
    }
    const sortedAppIds = Array.from(appIds).sort((a, b) => a.localeCompare(b));
    const lanes = sortedAppIds.map((appId) => ({
        id: appId,
        actorId: appId,
        label: appLabelById.get(appId) ?? appId,
        x: 0,
        y: laneY,
        width: settings.canvas.width,
        height: settings.sizing.minLaneHeight,
        activeChannels: [0],
        channelDensityMode: settings.routing.channelDensityMode,
    }));
    if (hasUnassigned || lanes.length === 0) {
        lanes.push({
            id: UNASSIGNED_APP_LANE_ID,
            actorId: UNASSIGNED_APP_LANE_ID,
            label: 'Unassigned',
            x: 0,
            y: laneY,
            width: settings.canvas.width,
            height: settings.sizing.minLaneHeight,
            activeChannels: [0],
            channelDensityMode: settings.routing.channelDensityMode,
        });
    }
    return lanes;
}
const swimlaneStrategy = {
    id: 'standard',
    groupKeyOf: actorGroupKeyOf,
    buildLanes: (state) => buildActorLanes(state),
    convergenceAdvice: 'adding explicit actor assignments to reduce lane ambiguity',
};
const noneStrategy = {
    id: 'virtual',
    // 'virtual' still groups by actor before normalizeForVirtualLanes collapses the
    // lane stack for rendering — the cross-lane penalty and consensus stages run
    // pre-collapse, so they need the same grouping key as 'standard'.
    groupKeyOf: actorGroupKeyOf,
    buildLanes: (state) => buildActorLanes(state),
    convergenceAdvice: 'reducing diagram density',
};
const byAppStrategy = {
    id: 'byApp',
    groupKeyOf: appGroupKeyOf,
    buildLanes: (state, graph) => buildAppLanes(state, graph),
    unassignedLaneId: UNASSIGNED_APP_LANE_ID,
    convergenceAdvice: 'adding explicit app references to reduce lane ambiguity',
};
const strategiesByMode = {
    standard: swimlaneStrategy,
    virtual: noneStrategy,
    byApp: byAppStrategy,
};
export function resolveGroupingStrategy(laneMode) {
    return strategiesByMode[laneMode];
}
