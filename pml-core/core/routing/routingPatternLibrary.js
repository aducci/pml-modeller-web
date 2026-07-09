/**
 * Routing Pattern Library
 *
 * Canonical routing patterns for process-model edge layout.
 * Each pattern specifies hard side constraints and soft preferences,
 * plus waypoint generation logic.
 */
import { rectAnchors } from '../layoutGeometry';
// ============================================================================
// PATTERN DEFINITIONS
// ============================================================================
export const PATTERN_STRAIGHT_RIGHT = {
    id: 'straight-right',
    name: 'Straight Right',
    sourceExitSide: 'right',
    targetEntrySide: 'left',
    bendCount: 0,
    crossingRisk: 0.2,
    spacingPreference: 1,
    generateWaypoints(src, tgt) {
        const srcAnchor = rectAnchors(src).right;
        const tgtAnchor = rectAnchors(tgt).left;
        return [srcAnchor, tgtAnchor];
    },
};
export const PATTERN_ELBOW_RIGHT_DOWN = {
    id: 'elbow-right-down',
    name: 'Elbow Right-Down',
    sourceExitSide: 'right',
    targetEntrySide: 'top',
    bendCount: 2,
    crossingRisk: 0.4,
    spacingPreference: 0.6,
    generateWaypoints(src, tgt) {
        const srcAnchor = rectAnchors(src).right;
        const tgtAnchor = rectAnchors(tgt).top;
        const midX = (srcAnchor.x + tgtAnchor.x) / 2;
        return [srcAnchor, { x: midX, y: srcAnchor.y }, { x: midX, y: tgtAnchor.y }, tgtAnchor];
    },
};
export const PATTERN_ELBOW_RIGHT_UP = {
    id: 'elbow-right-up',
    name: 'Elbow Right-Up',
    sourceExitSide: 'right',
    targetEntrySide: 'bottom',
    bendCount: 2,
    crossingRisk: 0.5,
    spacingPreference: 0.5,
    generateWaypoints(src, tgt) {
        const srcAnchor = rectAnchors(src).right;
        const tgtAnchor = rectAnchors(tgt).bottom;
        const midX = (srcAnchor.x + tgtAnchor.x) / 2;
        return [srcAnchor, { x: midX, y: srcAnchor.y }, { x: midX, y: tgtAnchor.y }, tgtAnchor];
    },
};
export const PATTERN_ELBOW_BOTTOM_LEFT = {
    id: 'elbow-bottom-left',
    name: 'Elbow Bottom-Left (Rejection)',
    sourceExitSide: 'bottom',
    targetEntrySide: 'left',
    bendCount: 1,
    crossingRisk: 0.3,
    spacingPreference: 0.8,
    generateWaypoints(src, tgt) {
        const srcAnchor = rectAnchors(src).bottom;
        const tgtAnchor = rectAnchors(tgt).left;
        const elbowY = (srcAnchor.y + tgtAnchor.y) / 2;
        return [srcAnchor, { x: srcAnchor.x, y: elbowY }, { x: tgtAnchor.x, y: elbowY }, tgtAnchor];
    },
};
export const PATTERN_BOTTOM_CORRIDOR = {
    id: 'bottom-corridor',
    name: 'Bottom Corridor Loopback',
    sourceExitSide: 'bottom',
    targetEntrySide: 'top',
    bendCount: 3,
    crossingRisk: 0.6,
    spacingPreference: 0.4,
    generateWaypoints(src, tgt, ctx) {
        const srcAnchor = rectAnchors(src).bottom;
        const tgtAnchor = rectAnchors(tgt).top;
        // Use corridor Y from context or fall back to midway
        const corridorY = (ctx.allLanes?.[ctx.allLanes.length - 1]?.y ?? src.y) + 100;
        const midX = (srcAnchor.x + tgtAnchor.x) / 2;
        return [
            srcAnchor,
            { x: srcAnchor.x, y: corridorY },
            { x: midX, y: corridorY },
            { x: tgtAnchor.x, y: corridorY },
            { x: tgtAnchor.x, y: tgtAnchor.y },
            tgtAnchor,
        ];
    },
};
export const PATTERN_TOP_CORRIDOR = {
    id: 'top-corridor',
    name: 'Top Corridor Forward Flow',
    sourceExitSide: 'top',
    targetEntrySide: 'bottom',
    bendCount: 3,
    crossingRisk: 0.7,
    spacingPreference: 0.3,
    generateWaypoints(src, tgt, ctx) {
        const srcAnchor = rectAnchors(src).top;
        const tgtAnchor = rectAnchors(tgt).bottom;
        // Use corridor Y from context or fall back to midway
        const corridorY = (ctx.allLanes?.[0]?.y ?? src.y) - 100;
        const midX = (srcAnchor.x + tgtAnchor.x) / 2;
        return [
            srcAnchor,
            { x: srcAnchor.x, y: corridorY },
            { x: midX, y: corridorY },
            { x: tgtAnchor.x, y: corridorY },
            { x: tgtAnchor.x, y: tgtAnchor.y },
            tgtAnchor,
        ];
    },
};
// Scenario classification has moved to routing/scenarioResolver.ts.
// ============================================================================
// PATTERN REGISTRY
// ============================================================================
export const PATTERN_REGISTRY = {
    'straight-right': PATTERN_STRAIGHT_RIGHT,
    'elbow-right-down': PATTERN_ELBOW_RIGHT_DOWN,
    'elbow-right-up': PATTERN_ELBOW_RIGHT_UP,
    'elbow-bottom-left': PATTERN_ELBOW_BOTTOM_LEFT,
    'bottom-corridor': PATTERN_BOTTOM_CORRIDOR,
    'top-corridor': PATTERN_TOP_CORRIDOR,
};
export function getPattern(patternId) {
    return PATTERN_REGISTRY[patternId] || null;
}
