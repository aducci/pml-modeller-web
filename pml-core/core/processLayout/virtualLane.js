// Virtual-lane normalization: collapses all lanes into a single virtual lane
// so the layout/routing engines operate without lateral separation.
export function isVirtualLaneMode(settings) {
    return settings.layout.laneMode === 'virtual';
}
export function normalizeForVirtualLanes(state) {
    const virtualId = '__virtual__';
    state.lanes = [
        {
            id: virtualId,
            actorId: '__virtual__',
            label: 'Virtual',
            x: 0,
            y: state.settings.spacing.laneGapTop,
            width: state.settings.canvas.width,
            height: state.settings.sizing.minLaneHeight,
            activeChannels: [0],
            channelDensityMode: state.settings.routing.channelDensityMode,
        },
    ];
    for (const node of state.nodes) {
        node.laneId = virtualId;
    }
    return state;
}
