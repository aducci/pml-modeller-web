/**
 * Theme presets for process model rendering.
 *
 * Presets are declarative overlays resolved against the active layout settings.
 * All presets must populate every surface in ProcessThemeSchema so that the
 * midnight-ops dark test confirms no remaining hardcodes in the renderer.
 */
import { resolveThemeFromLayoutSettings } from './styleAdapter';
export const PROCESS_THEME_PRESETS = [
    {
        id: 'standard-light',
        name: 'Standard Light',
        description: 'Blueprint Minimal — warm blue-gray family, structure over color.',
        resolve: (settings) => resolveThemeFromLayoutSettings(settings, {
            id: 'standard-light',
            name: 'Standard Light',
            description: 'Blueprint Minimal — warm blue-gray family, structure over color.',
        }),
    },
    {
        id: 'compact-ops',
        name: 'Compact Ops',
        description: 'Tighter typography for dense operational views.',
        resolve: (settings) => resolveThemeFromLayoutSettings(settings, {
            id: 'compact-ops',
            name: 'Compact Ops',
            description: 'Tighter typography for dense operational views.',
            elementOverrides: {
                task: { text: { fontSizePx: 10, weight: 500 } },
                subprocess: { text: { fontSizePx: 10, weight: 500 } },
                gateway: { text: { fontSizePx: 9, weight: 500 } },
                // Keep decision alias in sync so spreads still compile.
                decision: { text: { fontSizePx: 9, weight: 500 } },
                event: { text: { fontSizePx: 9, weight: 500 } },
            },
        }),
    },
    {
        id: 'high-contrast',
        name: 'High Contrast',
        description: 'Deeper fills and strokes for stronger readability.',
        resolve: (settings) => {
            const base = resolveThemeFromLayoutSettings(settings, {
                id: 'high-contrast',
                name: 'High Contrast',
                description: 'Deeper fills and strokes for stronger readability.',
            });
            return {
                ...base,
                elementStyles: {
                    ...base.elementStyles,
                    event: {
                        ...base.elementStyles.event,
                        appearance: { ...base.elementStyles.event.appearance, fill: '#BFD9F5', stroke: '#185FA5', labelHalo: '#BFD9F5' },
                    },
                    task: {
                        ...base.elementStyles.task,
                        appearance: { ...base.elementStyles.task.appearance, fill: '#E3E0D6', stroke: '#5F5E5A', labelHalo: '#E3E0D6' },
                    },
                    gateway: {
                        ...base.elementStyles.gateway,
                        appearance: { ...base.elementStyles.gateway.appearance, fill: '#C2C0B6', stroke: '#3E3D3A', labelHalo: '#C2C0B6' },
                    },
                    decision: {
                        ...base.elementStyles.decision,
                        appearance: { ...base.elementStyles.decision.appearance, fill: '#C2C0B6', stroke: '#3E3D3A', labelHalo: '#C2C0B6' },
                    },
                    subprocess: {
                        ...base.elementStyles.subprocess,
                        appearance: { ...base.elementStyles.subprocess.appearance, fill: '#BFD9F5', stroke: '#185FA5', labelHalo: '#BFD9F5' },
                    },
                    // Previously missing entirely (unlike the Midnight preset, which
                    // does override this) — an 'unknown'-type node stayed at the
                    // default theme's muted colors, inconsistent with every other
                    // element type in this preset.
                    unknown: {
                        ...base.elementStyles.unknown,
                        appearance: { ...base.elementStyles.unknown.appearance, fill: '#E3E0D6', stroke: '#5F5E5A', labelHalo: '#E3E0D6' },
                    },
                },
                edges: {
                    ...base.edges,
                    default: { ...base.edges.default, stroke: '#5F5E5A' },
                    crossLane: { ...base.edges.crossLane, stroke: '#888780' },
                    loopback: { ...base.edges.loopback, stroke: '#9A5F10' },
                },
                lanes: {
                    bodyFill: '#FDFDFB',
                    headerFill: '#F8F7F4',
                    borderColor: '#D8D6D0',
                    borderWidth: 1,
                    selectedBorderColor: '#6366F1',
                    selectedBorderWidth: 2,
                    headerSelectedColor: '#6366F1',
                    labelColor: '#5F5E5A',
                    cornerRadiusPx: 0,
                    headerFontWeight: 500,
                    headerLabelOpacity: 0.7,
                },
            };
        },
    },
    {
        id: 'midnight-ops',
        name: 'Midnight',
        description: 'Dark canvas for low-light operational environments.',
        resolve: (settings) => {
            const base = resolveThemeFromLayoutSettings(settings, {
                id: 'midnight-ops',
                name: 'Midnight',
                description: 'Dark canvas for low-light operational environments.',
            });
            return {
                ...base,
                elementStyles: {
                    ...base.elementStyles,
                    event: {
                        ...base.elementStyles.event,
                        appearance: { ...base.elementStyles.event.appearance, fill: '#0C447C', stroke: '#85B7EB', label: '#B5D4F4', labelHalo: '#0C447C', strokeWidth: 1 },
                    },
                    task: {
                        ...base.elementStyles.task,
                        appearance: { ...base.elementStyles.task.appearance, fill: '#2C2C2A', stroke: '#888780', label: '#D3D1C7', labelHalo: '#2C2C2A', strokeWidth: 1 },
                    },
                    gateway: {
                        ...base.elementStyles.gateway,
                        appearance: { ...base.elementStyles.gateway.appearance, fill: '#444441', stroke: '#888780', label: '#B4B2A9', labelHalo: '#444441', strokeWidth: 1 },
                    },
                    decision: {
                        ...base.elementStyles.decision,
                        appearance: { ...base.elementStyles.decision.appearance, fill: '#444441', stroke: '#888780', label: '#B4B2A9', labelHalo: '#444441', strokeWidth: 1 },
                    },
                    subprocess: {
                        ...base.elementStyles.subprocess,
                        appearance: {
                            ...base.elementStyles.subprocess.appearance,
                            fill: '#0C447C',
                            stroke: '#85B7EB',
                            label: '#B5D4F4',
                            labelHalo: '#0C447C',
                            strokeWidth: 1,
                            strokeDasharray: '5 3',
                        },
                    },
                    unknown: {
                        ...base.elementStyles.unknown,
                        appearance: { ...base.elementStyles.unknown.appearance, fill: '#2C2C2A', stroke: '#5F5E5A', label: '#888780', labelHalo: '#2C2C2A', strokeWidth: 1 },
                    },
                },
                lanes: {
                    bodyFill: '#0f172a',
                    headerFill: '#141928',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    selectedBorderColor: '#818CF8',
                    selectedBorderWidth: 2,
                    headerSelectedColor: '#818CF8',
                    labelColor: '#A1A1AA',
                    cornerRadiusPx: 0,
                    headerFontWeight: 500,
                    headerLabelOpacity: 0.65,
                },
                curtains: {
                    inbound: {
                        fill: '#0C447C',
                        fillOpacity: 0.12,
                        stroke: '#378ADD',
                        strokeWidth: 1,
                        labelColor: '#85B7EB',
                    },
                    outbound: {
                        fill: '#791F1F',
                        fillOpacity: 0.12,
                        stroke: '#E24B4A',
                        strokeWidth: 1,
                        labelColor: '#F09595',
                    },
                },
                edges: {
                    default: { stroke: '#85B7EB', strokeWidth: 1.5 },
                    crossLane: { stroke: '#5F5E5A', strokeWidth: 1.5, strokeDasharray: '5 3' },
                    loopback: { stroke: '#EF9F27', strokeWidth: 2 },
                    message: { stroke: '#B48EF0', strokeWidth: 1.5, strokeDasharray: '6 4' },
                    selected: { stroke: '#85B7EB', strokeWidth: 2.5 },
                    halo: {
                        default: { color: '#1a1f2e', width: 4 },
                        selected: { color: '#0C447C', width: 5 },
                    },
                    marker: { fill: '#85B7EB', openStroke: '#B48EF0' },
                    label: {
                        fill: '#888780',
                        background: '#1a1f2e',
                        border: 'rgba(255,255,255,0.15)',
                        fontSize: 10,
                        fontWeight: 400,
                        haloColor: '#1a1f2e',
                        haloWidth: 1,
                        charWidthPx: 7,
                        paddingX: 14,
                        minWidth: 56,
                        maxWidth: 200,
                    },
                },
                typography: {
                    laneHeader: { fontSizePx: 11, weight: 500, tracking: 'wide' },
                    nodeLabel: { fontSizePx: 11, weight: 500 },
                    edgeLabel: { fontSizePx: 10, weight: 400 },
                    curtainLabel: { fontSizePx: 9, weight: 500, uppercase: true, tracking: 'wider' },
                },
            };
        },
    },
];
export function resolveThemePresetById(settings, presetId) {
    const preset = PROCESS_THEME_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) {
        return PROCESS_THEME_PRESETS[0].resolve(settings);
    }
    return preset.resolve(settings);
}
