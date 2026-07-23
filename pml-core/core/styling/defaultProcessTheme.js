/**
 * Default theme — "Blueprint Minimal" visual language.
 *
 * Near-monochromatic node fills; shape/weight carries semantic meaning;
 * color is reserved for state changes and the loopback accent only.
 */
import { createLayoutSettings } from '../processLayout/layoutTypes';
// Canvas token defaults are owned by createLayoutSettings() in layoutTypes.ts.
// This reference keeps both definitions in sync without manual duplication.
const _layoutDefaults = createLayoutSettings().canvasConfig;
export const DEFAULT_PROCESS_THEME = {
    id: 'standard-light',
    name: 'Standard Light',
    description: 'Blueprint Minimal — warm blue-gray family, structure over color.',
    elementStyles: {
        event: {
            shape: 'circle',
            appearance: { fill: '#E6F1FB', stroke: '#378ADD', label: '#0C447C', strokeWidth: 1 },
            text: { fontSizePx: 10, weight: 500, maxLines: 3, wrap: 'clamp' },
            labelPlacement: 'auto',
            infoPolicy: { primaryField: 'label', placement: 'hidden' },
            interaction: { selectedStroke: '#378ADD', selectedStrokeWidth: 2.5 },
        },
        // `decision` and `route` resolve to `gateway` via getElementStyle() —
        // these entries exist so spreads in presets still compile.
        decision: {
            shape: 'diamond',
            appearance: { fill: '#D3D1C7', stroke: '#5F5E5A', label: '#2C2C2A', strokeWidth: 1 },
            text: { fontSizePx: 10, weight: 500, maxLines: 2, wrap: 'clamp' },
            labelPlacement: 'auto',
            infoPolicy: { primaryField: 'label', placement: 'hidden' },
            interaction: { selectedStroke: '#378ADD', selectedStrokeWidth: 2.5 },
        },
        /* 'route' removed in v2.7 — use 'decision' with gatewayKind instead */
        // Canonical gateway token — decision + route both resolve here.
        gateway: {
            shape: 'diamond',
            appearance: { fill: '#D3D1C7', stroke: '#5F5E5A', label: '#2C2C2A', strokeWidth: 1 },
            text: { fontSizePx: 10, weight: 500, maxLines: 2, wrap: 'clamp' },
            labelPlacement: 'auto',
            infoPolicy: { primaryField: 'label', placement: 'hidden' },
            interaction: { selectedStroke: '#378ADD', selectedStrokeWidth: 2.5 },
        },
        subprocess: {
            shape: 'rounded-rect',
            appearance: {
                fill: '#E6F1FB',
                stroke: '#378ADD',
                label: '#0C447C',
                strokeWidth: 1,
                strokeDasharray: '5 3',
                cornerRadiusPx: 6,
            },
            text: { fontSizePx: 10, weight: 500, maxLines: 2, wrap: 'clamp' },
            labelPlacement: 'inside',
            infoPolicy: {
                primaryField: 'label',
                placement: 'hidden',
            },
            interaction: { selectedStroke: '#378ADD', selectedStrokeWidth: 2.5 },
        },
        task: {
            shape: 'rounded-rect',
            appearance: { fill: '#F1EFE8', stroke: '#888780', label: '#2C2C2A', strokeWidth: 1, cornerRadiusPx: 6 },
            text: { fontSizePx: 10, weight: 500, maxLines: 3, wrap: 'clamp' },
            labelPlacement: 'inside',
            infoPolicy: {
                primaryField: 'label',
                placement: 'hidden',
            },
            interaction: { selectedStroke: '#378ADD', selectedStrokeWidth: 2.5 },
        },
        unknown: {
            shape: 'rounded-rect',
            appearance: { fill: '#F1EFE8', stroke: '#D3D1C7', label: '#888780', strokeWidth: 1, cornerRadiusPx: 6 },
            text: { fontSizePx: 11, weight: 500, maxLines: 2, wrap: 'clamp' },
            labelPlacement: 'inside',
            infoPolicy: { primaryField: 'label', placement: 'bottom-inside', secondaryFields: ['type'] },
            interaction: { selectedStroke: '#378ADD', selectedStrokeWidth: 2.5 },
        },
    },
    edges: {
        default: {
            stroke: '#888780',
            strokeWidth: 1.5,
        },
        crossLane: {
            stroke: '#B4B2A9',
            strokeWidth: 1.5,
            strokeDasharray: '5 3',
        },
        loopback: {
            stroke: '#BA7517',
            strokeWidth: 2,
        },
        message: {
            stroke: '#6B4FBB',
            strokeWidth: 1.5,
            strokeDasharray: '6 4',
        },
        selected: {
            stroke: '#378ADD',
            strokeWidth: 2.5,
        },
        halo: {
            default: { color: '#ffffff', width: 4 },
            selected: { color: '#B5D4F4', width: 5 },
        },
        marker: {
            fill: '#888780',
            openStroke: '#6B4FBB',
        },
        label: {
            fill: '#5F5E5A',
            background: '#1a1f2e',
            border: 'rgba(255,255,255,0.15)',
            fontSize: 10,
            fontWeight: 400,
            haloColor: '#F7F6F2',
            haloWidth: 1,
            charWidthPx: 7,
            paddingX: 14,
            minWidth: 56,
            maxWidth: 200,
        },
    },
    edgeLabelPositions: {
        defaults: { anchor: 'mid', offset: { x: 0, y: -8 }, mirrorAxis: 'none' },
        perType: {
            STH: { anchor: 'mid', offset: { x: 0, y: -8 }, mirrorAxis: 'none' },
            STV: { anchor: 'mid', offset: { x: 8, y: 0 }, mirrorAxis: 'none' },
            // mirrorAxis: 'vertical'/'horizontal' flips the offset onto whichever
            // side its own local elbow direction implies (above/below for a
            // horizontal-bend routing type, left/right for a vertical-bend one),
            // instead of every edge of this routing type sharing one fixed side.
            // That's what makes a decision's "up" branch and "down" branch land
            // on opposite, correctly-mirrored sides of their own lines without
            // any awareness of each other. See edgeLabelPositioning.ts's applyMirror().
            SEH: { anchor: 'elbow-1', offset: { x: 0, y: -8 }, mirrorAxis: 'vertical' },
            SEV: { anchor: 'elbow-1', offset: { x: 8, y: 0 }, mirrorAxis: 'horizontal' },
            DEH: { anchor: 'elbow-1', offset: { x: 0, y: -8 }, mirrorAxis: 'vertical' },
            DEN: { anchor: 'elbow-1', offset: { x: 0, y: -8 }, mirrorAxis: 'vertical' },
            DEF: { anchor: 'elbow-2', offset: { x: 0, y: -8 }, mirrorAxis: 'vertical' },
            DEV: { anchor: 'elbow-1', offset: { x: 8, y: 0 }, mirrorAxis: 'horizontal' },
            // DBL (boundary drop-out) intentionally stays fixed below: it's a
            // single always-downward escape route, not one of a mirrored pair.
            DBL: { anchor: 'elbow-1', offset: { x: 0, y: 8 }, mirrorAxis: 'none' },
            TEH: { anchor: 'elbow-2', offset: { x: 0, y: -10 }, mirrorAxis: 'vertical' },
            TEV: { anchor: 'elbow-2', offset: { x: 10, y: 0 }, mirrorAxis: 'horizontal' },
            SLP: { anchor: 'mid', offset: { x: 0, y: -10 }, mirrorAxis: 'none' },
            POH: { anchor: 'elbow-1', offset: { x: 0, y: -8 }, mirrorAxis: 'vertical' },
            POV: { anchor: 'elbow-1', offset: { x: 8, y: 0 }, mirrorAxis: 'horizontal' },
            AOT: { anchor: 'mid', offset: { x: 0, y: 0 }, mirrorAxis: 'none' },
        },
    },
    lanes: {
        bodyFill: '#FCFCFA',
        headerFill: '#F8F7F4',
        borderColor: '#E5E3DF',
        borderWidth: 1,
        selectedBorderColor: '#6366F1',
        selectedBorderWidth: 2,
        headerSelectedColor: '#6366F1',
        labelColor: '#6B7280',
        cornerRadiusPx: 0,
        headerFontWeight: 500,
        headerLabelOpacity: 0.65,
    },
    curtains: {
        inbound: {
            fill: '#F8F7F4',
            fillOpacity: 0.40,
            stroke: '#D1CDE8',
            strokeWidth: 1,
            labelColor: '#6B7280',
        },
        outbound: {
            fill: '#F8F7F4',
            fillOpacity: 0.40,
            stroke: '#E8D1CD',
            strokeWidth: 1,
            labelColor: '#6B7280',
        },
    },
    typography: {
        laneHeader: { fontSizePx: 11, weight: 500, tracking: 'wide' },
        nodeLabel: { fontSizePx: 11, weight: 500 },
        edgeLabel: { fontSizePx: 10, weight: 400 },
        curtainLabel: { fontSizePx: 9, weight: 500, uppercase: true, tracking: 'wider' },
    },
    canvasTokens: {
        laneHeaderHeight: _layoutDefaults.laneHeaderHeight,
        baseCurtainWidth: _layoutDefaults.baseCurtainWidth,
        curtainPadding: _layoutDefaults.curtainPadding,
        visualBoundsPadding: _layoutDefaults.visualBoundsPadding,
        labelContainerWidth: _layoutDefaults.labelContainerWidth,
    },
    // Shadow defaults on (matches the appearance every diagram already has);
    // gradient defaults off (a new opt-in look, not a behavior change).
    nodeEffects: {
        shadow: true,
        gradient: false,
    },
};
