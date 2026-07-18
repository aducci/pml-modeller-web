/**
 * Geometry Realizer — Single controller for Layer C waypoint generation.
 *
 * Converts port assignment + elbow Y policy + cross-lane geometry mode
 * into concrete waypoints. Uses nodeGeometry.ts for typed anchor points.
 *
 * IP-1: All 5 ElbowYPolicy variants + all 6 CrossLaneGeometryMode variants.
 */
import { rectAnchors, midpoint } from '../layoutGeometry';
import { calculateNodeGeometry } from './nodeGeometry';
import { routeCrossLaneDownFromBottomToLeft, routeCrossLaneDownFromRightToLeft, routeCrossLaneUpFromRightToLeft, routeCrossLaneUpFromTopToLeft, routeStandardHorizontalFirst, routeStandardVerticalFirst, routeVerticalFirstLeftEntry, } from './routingPrimitives';
// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
export function realizeWaypoints(portResolution, scenario, source, target, rule, context, channel, laneTopBufferPx, selectedGeometryMode) {
    const sourceGeom = calculateNodeGeometry(source);
    const targetGeom = calculateNodeGeometry(target);
    // Loopback waypoints manage their own channel-based rail spacing
    // (buildLoopbackWaypoints's railOffset) — anchors stay exactly centered
    // on the port for that path. Every other path fans multiple same-side,
    // same-direction edges apart at the anchor itself (see resolveAnchorPoint's
    // offset param): without this, two edges leaving the same node on the
    // same side collapse onto an identical first segment — not a crossing
    // (nothing to detect/nudge downstream), a literal coincident overlap,
    // since every edge on a given side previously anchored to that side's one
    // exact center point regardless of how many edges shared it.
    const anchorOffset = scenario.isLoopback ? 0 : channel * ANCHOR_FAN_OUT_PX;
    const srcAnchor = resolveAnchorPoint(sourceGeom.bounds, portResolution.sourceSelected, anchorOffset);
    const tgtAnchor = resolveAnchorPoint(targetGeom.bounds, portResolution.targetSelected, anchorOffset);
    if (scenario.isLoopback && scenario.isSameLane) {
        return buildLoopbackWaypoints(sourceGeom.bounds, targetGeom.bounds, srcAnchor, tgtAnchor, portResolution.sourceSelected, portResolution.targetSelected, channel);
    }
    if (selectedGeometryMode) {
        return buildCrossLaneWaypoints(srcAnchor, tgtAnchor, portResolution.sourceSelected, portResolution.targetSelected, rule, scenario, selectedGeometryMode, channel, context, laneTopBufferPx);
    }
    return buildStandardWaypoints(srcAnchor, tgtAnchor, portResolution.sourceSelected, portResolution.targetSelected, rule, channel, context);
}
// Small perpendicular nudge per channel unit — enough to visually separate
// same-source/same-side edges (a node's ports each have exactly one anchor
// point regardless of edge count), far smaller than node dimensions or
// inter-channel spacing elsewhere (e.g. loopback's 20px rail spacing), so it
// never competes with those for meaning. channel is 0 for the vast majority
// of edges (see channelAllocation.ts), so this is a no-op for them.
const ANCHOR_FAN_OUT_PX = 5;
// ---------------------------------------------------------------------------
// Standard (same-lane and non-modal cross-lane) waypoints
// ---------------------------------------------------------------------------
function buildStandardWaypoints(srcAnchor, tgtAnchor, srcSide, tgtSide, rule, channel, context) {
    const elbowY = resolveElbowY(rule.elbowYPolicy, srcAnchor, tgtAnchor, channel, rule.elbowYFixedValue);
    let waypoints;
    let bendType;
    const preferVerticalFromSource = srcSide === 'top' || srcSide === 'bottom';
    const useLeftEntry = tgtSide === 'left' && preferVerticalFromSource;
    if (useLeftEntry) {
        waypoints = routeVerticalFirstLeftEntry({ src: srcAnchor, tgt: tgtAnchor }, {
            exitBufferPx: rule.exitBufferPx,
            entryBufferPx: rule.entryBufferPx,
            bridgeY: elbowY,
        });
        bendType = 'v-h-v';
    }
    else if (rule.firstSegmentDirection === 'vertical-first' || preferVerticalFromSource) {
        // V-first: exit vertical -> bridge horizontal at elbowY -> drop to target
        waypoints = routeStandardVerticalFirst({ src: srcAnchor, tgt: tgtAnchor }, elbowY);
        bendType = 'v-first';
    }
    else {
        // H-first: keep existing shape semantics, but build via shared primitive.
        const useMidpointBridgeY = rule.elbowYPolicy === 'midpointY';
        // When source exits from a left curtain zone (inbound event → first in-lane
        // node) the geometric midX lands outside the lane boundary. Override the
        // elbow to land a small gap inside the lane start instead.
        let overrideBridgeX;
        if (!useMidpointBridgeY && context) {
            const laneX = context.sourceLane?.x;
            const laneRight = context.targetLane
                ? context.targetLane.x + context.targetLane.width
                : undefined;
            if (laneX !== undefined && srcAnchor.x < laneX) {
                // Clamp so the bridge never crowds the target's entry approach.
                const rawOverrideX = laneX + rule.exitBufferPx;
                overrideBridgeX = Math.min(rawOverrideX, tgtAnchor.x - rule.entryBufferPx);
            }
            else if (laneRight !== undefined && tgtAnchor.x > laneRight) {
                overrideBridgeX = laneRight - rule.exitBufferPx;
            }
        }
        // Enforce minimum exit segment from source and minimum entry segment to target.
        // The curtain-zone override can produce an elbow that is only a few pixels
        // past the source anchor (e.g. overrideBridgeX = laneRight - exitBufferPx
        // where laneRight is very close to srcAnchor.x). Clamp to guarantee the
        // rendered first segment is never shorter than exitBufferPx.
        const minBridgeX = srcAnchor.x + rule.exitBufferPx;
        const maxBridgeX = tgtAnchor.x - (rule.entryBufferPx ?? 0);
        if (overrideBridgeX !== undefined) {
            // Clamp the override: respect both the source exit and target entry minima.
            overrideBridgeX = Math.min(Math.max(overrideBridgeX, minBridgeX), Math.max(minBridgeX, maxBridgeX));
        }
        else if (!useMidpointBridgeY) {
            // Natural midpoint: force an override if midpoint itself is closer than exitBufferPx.
            const naturalMidX = midpoint(srcAnchor, tgtAnchor).x;
            if (naturalMidX < minBridgeX) {
                overrideBridgeX = Math.min(minBridgeX, Math.max(minBridgeX, maxBridgeX));
            }
        }
        waypoints = routeStandardHorizontalFirst({ src: srcAnchor, tgt: tgtAnchor }, elbowY, useMidpointBridgeY, overrideBridgeX);
        bendType = useMidpointBridgeY ? 'h-v-h' : 'h-first';
    }
    const contract = enforceHardSideContract(srcAnchor, tgtAnchor, waypoints);
    validateOrthogonalWaypoints(contract.waypoints, srcSide);
    return {
        waypoints: contract.waypoints,
        bendType,
        sourceAnchor: { side: srcSide, ...srcAnchor },
        targetAnchor: { side: tgtSide, ...tgtAnchor },
        hardSideContractCorrected: contract.corrected,
        description: `${srcSide}→${tgtSide} via ${bendType}`,
    };
}
// ---------------------------------------------------------------------------
// Cross-lane geometry modes
// ---------------------------------------------------------------------------
function buildCrossLaneWaypoints(srcAnchor, tgtAnchor, srcSide, tgtSide, rule, scenario, mode, channel, context, laneTopBufferPx) {
    let waypoints;
    let bendType;
    switch (mode) {
        case 'cross-down-r_to_l-buffer-rail-rise': {
            const targetLane = context.targetLane;
            if (!targetLane) {
                throw new Error('cross-lane-downward preferred pattern missing target lane in routing context');
            }
            waypoints = routeCrossLaneDownFromRightToLeft({ src: srcAnchor, tgt: tgtAnchor }, targetLane, {
                exitBufferPx: rule.exitBufferPx,
                entryBufferPx: rule.entryBufferPx,
                laneTopBufferPx,
            });
            bendType = 'h-v-h';
            break;
        }
        case 'cross-down-b_to_l-buffer-rail-rise': {
            const targetLane = context.targetLane;
            if (!targetLane) {
                throw new Error('cross-lane-downward alternate pattern missing target lane in routing context');
            }
            waypoints = routeCrossLaneDownFromBottomToLeft({ src: srcAnchor, tgt: tgtAnchor }, targetLane, {
                exitBufferPx: rule.exitBufferPx,
                entryBufferPx: rule.entryBufferPx,
                laneTopBufferPx,
            });
            bendType = 'v-h-v';
            break;
        }
        case 'cross-up-r_to_l-buffer-rail-drop': {
            const targetLane = context.targetLane;
            if (!targetLane) {
                throw new Error('cross-lane-upward preferred pattern missing target lane in routing context');
            }
            waypoints = routeCrossLaneUpFromRightToLeft({ src: srcAnchor, tgt: tgtAnchor }, targetLane, {
                exitBufferPx: rule.exitBufferPx,
                entryBufferPx: rule.entryBufferPx,
                laneTopBufferPx,
            }, context.sourceLane);
            bendType = 'h-v-h';
            break;
        }
        case 'cross-up-r_to_l-top-exit': {
            const targetLane = context.targetLane;
            if (!targetLane) {
                throw new Error('cross-lane-upward alternate pattern missing target lane in routing context');
            }
            waypoints = routeCrossLaneUpFromTopToLeft({ src: srcAnchor, tgt: tgtAnchor }, targetLane, {
                exitBufferPx: rule.exitBufferPx,
                entryBufferPx: rule.entryBufferPx,
                laneTopBufferPx,
            }, context.sourceLane);
            bendType = 'v-h-v';
            break;
        }
        default: {
            throw new Error(`Unsupported cross-lane geometry mode: ${mode}`);
        }
    }
    const contract = enforceHardSideContract(srcAnchor, tgtAnchor, waypoints);
    validateOrthogonalWaypoints(contract.waypoints, srcSide);
    return {
        waypoints: contract.waypoints,
        bendType,
        sourceAnchor: { side: srcSide, ...srcAnchor },
        targetAnchor: { side: tgtSide, ...tgtAnchor },
        hardSideContractCorrected: contract.corrected,
        selectedGeometryMode: mode,
        description: `${srcSide}→${tgtSide} [${mode}]`,
    };
}
// ---------------------------------------------------------------------------
// Loopback waypoints
// ---------------------------------------------------------------------------
function buildLoopbackWaypoints(srcBounds, tgtBounds, srcAnchor, tgtAnchor, srcSide, tgtSide, channel) {
    const tier = Math.max(1, Math.abs(channel));
    const railOffset = tier * 20;
    const lowerRailY = Math.max(srcBounds.y + srcBounds.height, tgtBounds.y + tgtBounds.height) + railOffset;
    const upperRailY = Math.min(srcBounds.y, tgtBounds.y) - railOffset;
    let waypoints;
    let bendType = 'v-first';
    if (srcSide === 'bottom' && tgtSide === 'bottom') {
        waypoints = [
            srcAnchor,
            { x: srcAnchor.x, y: lowerRailY },
            { x: tgtAnchor.x, y: lowerRailY },
            tgtAnchor,
        ];
    }
    else if (srcSide === 'top' && tgtSide === 'top') {
        waypoints = [
            srcAnchor,
            { x: srcAnchor.x, y: upperRailY },
            { x: tgtAnchor.x, y: upperRailY },
            tgtAnchor,
        ];
    }
    else {
        const midY = midpoint(srcAnchor, tgtAnchor).y;
        waypoints = [
            srcAnchor,
            { x: srcAnchor.x, y: midY },
            { x: tgtAnchor.x, y: midY },
            tgtAnchor,
        ];
        bendType = 'h-first';
    }
    const contract = enforceHardSideContract(srcAnchor, tgtAnchor, waypoints);
    validateOrthogonalWaypoints(contract.waypoints, srcSide);
    return {
        waypoints: contract.waypoints,
        bendType,
        sourceAnchor: { side: srcSide, ...srcAnchor },
        targetAnchor: { side: tgtSide, ...tgtAnchor },
        hardSideContractCorrected: contract.corrected,
        description: `${srcSide}→${tgtSide} [loopback]`,
    };
}
// ---------------------------------------------------------------------------
// Elbow Y policy — all 5 variants (spec Section 6.3)
// ---------------------------------------------------------------------------
function resolveElbowY(policy, srcAnchor, tgtAnchor, channel, fixedValue) {
    switch (policy) {
        case 'matchTargetConnectionY':
            return tgtAnchor.y;
        case 'matchSourceConnectionY':
            return srcAnchor.y;
        case 'midpointY':
            return midpoint(srcAnchor, tgtAnchor).y;
        case 'channelY': {
            // Channel Y: source Y offset by channel-based rail spacing.
            const railSpacingY = 20;
            return srcAnchor.y + channel * railSpacingY;
        }
        case 'fixed':
            return fixedValue ?? midpoint(srcAnchor, tgtAnchor).y;
        default:
            return tgtAnchor.y;
    }
}
// ---------------------------------------------------------------------------
// Anchor resolution and hard-side contract
// ---------------------------------------------------------------------------
/**
 * `offset` nudges the anchor along the side's perpendicular axis (x for
 * top/bottom, y for left/right) — used to fan out multiple edges sharing
 * the same (node, side), which otherwise all resolve to this one exact
 * center point regardless of how many edges touch that side.
 */
function resolveAnchorPoint(bounds, side, offset = 0) {
    const base = rectAnchors(bounds)[side];
    if (offset === 0)
        return base;
    return (side === 'top' || side === 'bottom')
        ? { x: base.x + offset, y: base.y }
        : { x: base.x, y: base.y + offset };
}
/**
 * Validates the route's first/last waypoint against the exact anchor points
 * the caller resolved (and used to build the route) — not re-derived from
 * bounds+side here, so any per-edge offset baked into those anchors (see
 * resolveAnchorPoint's offset param) is honored instead of being snapped
 * back to a bare, unoffset center point.
 */
function enforceHardSideContract(expectedSrc, expectedTgt, waypoints) {
    if (waypoints.length < 2)
        return { waypoints, corrected: false };
    const corrected = [...waypoints];
    let changed = false;
    if (corrected[0].x !== expectedSrc.x || corrected[0].y !== expectedSrc.y) {
        corrected[0] = expectedSrc;
        changed = true;
    }
    const last = corrected.length - 1;
    if (corrected[last].x !== expectedTgt.x || corrected[last].y !== expectedTgt.y) {
        corrected[last] = expectedTgt;
        changed = true;
    }
    return { waypoints: corrected, corrected: changed };
}
function validateOrthogonalWaypoints(waypoints, srcSide, maxBends = 4) {
    if (waypoints.length < 2)
        return;
    const p0 = waypoints[0];
    const p1 = waypoints[1];
    const isHorizontal = p0.y === p1.y;
    const isVertical = p0.x === p1.x;
    if ((srcSide === 'left' || srcSide === 'right') && !isHorizontal) {
        throw new Error('Invalid first segment: expected horizontal from left/right port');
    }
    if ((srcSide === 'top' || srcSide === 'bottom') && !isVertical) {
        throw new Error('Invalid first segment: expected vertical from top/bottom port');
    }
    let bends = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
        const a = waypoints[i];
        const b = waypoints[i + 1];
        const horizontal = a.y === b.y;
        const vertical = a.x === b.x;
        if (!horizontal && !vertical) {
            throw new Error('Invalid route: non-orthogonal segment detected');
        }
        if (i > 0) {
            const prev = waypoints[i - 1];
            const prevHorizontal = prev.y === a.y;
            const prevVertical = prev.x === a.x;
            if ((prevHorizontal && vertical) || (prevVertical && horizontal)) {
                bends += 1;
            }
        }
    }
    if (bends > maxBends) {
        throw new Error(`Invalid route: bend count ${bends} exceeds limit ${maxBends}`);
    }
}
