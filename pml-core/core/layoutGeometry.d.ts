/**
 * Layout Geometry Helpers
 *
 * Shared geometry primitives for distance calculation, overlap,
 * point-to-rect operations, and route-label placement.
 */
import { Rect, Point, Bounds, RailPosition, RailOffset, LayoutNode, Lane } from './processLayout/layoutTypes';
export declare function rectBounds(rect: Rect): Bounds;
/** Inverse of rectBounds — convert an accumulator Bounds back to a Rect at a function boundary. */
export declare function boundsToRect(bounds: Bounds): Rect;
/**
 * A node's box as a Rect. Use this instead of hand-assembling
 * `{x: node.x, y: node.y, width: node.width, height: node.height}` — that literal
 * assembly is what caused geometry helpers to get bypassed throughout routing/rendering,
 * AND it silently gets the box wrong: unlike Rect and Lane, LayoutNode.x/y is the node's
 * CENTER point, not its top-left corner (see coordinateAssignment.ts, where node.x is
 * assigned a column *center* x). nodeRect() does the center→top-left conversion so callers
 * never have to know or re-derive that convention. Nodes not yet positioned (x/y undefined,
 * pre-B-geometry) get an origin-anchored box.
 */
export declare function nodeRect(node: Pick<LayoutNode, 'x' | 'y' | 'width' | 'height'>): Rect;
/** A lane's box as a Rect. Lane.x/y is already top-left (unlike LayoutNode.x/y), so this is a direct copy. */
export declare function laneRect(lane: Pick<Lane, 'x' | 'y' | 'width' | 'height'>): Rect;
export declare function rectsOverlap(r1: Rect, r2: Rect): boolean;
export declare function rectIntersection(r1: Rect, r2: Rect): Rect | null;
export declare function rectMerge(r1: Rect, r2: Rect): Rect;
export declare function rectCenter(rect: Rect): Point;
/** Midpoint of two points — use instead of inline `(a.x+b.x)/2, (a.y+b.y)/2`. */
export declare function midpoint(a: Point, b: Point): Point;
/** Midpoint of two scalars — the single-axis form of midpoint(), for when you have two numbers, not two Points. */
export declare function avg(a: number, b: number): number;
export declare function distance(p1: Point, p2: Point): number;
export declare function pointToRectDistance(point: Point, rect: Rect): number;
export declare function pointInRect(point: Point, rect: Rect): boolean;
export interface Anchors {
    top: Point;
    bottom: Point;
    left: Point;
    right: Point;
    center: Point;
}
export declare function rectAnchors(rect: Rect): Anchors;
export declare function getAnchorByPosition(anchors: Anchors, position: 'top' | 'bottom' | 'left' | 'right' | 'center'): Point;
export declare function expandRect(rect: Rect, margin: number): Rect;
export declare function shrinkRect(rect: Rect, margin: number): Rect;
export interface Segment {
    start: Point;
    end: Point;
}
export declare function segmentLength(seg: Segment): number;
export declare function pointToSegmentDistance(point: Point, seg: Segment): number;
export declare function polylineLength(points: Point[]): number;
export declare function polylineBounds(points: Point[]): Bounds;
/**
 * True when a routed polyline has no actual bend — either it's just the two
 * endpoints, or every waypoint happens to share the same x or y. A routing
 * algorithm can be selected for its ability to route around obstacles in the
 * general case (e.g. "h-first" for a decision's fan-out) while still
 * producing a bend-free result for a specific edge whose endpoints happen to
 * align; callers that classify or label a route by its resulting shape (not
 * by which algorithm ran) should check this instead of trusting the
 * algorithm's own label.
 */
export declare function isStraightPolyline(points: Point[]): boolean;
/**
 * True when segment (a1→a2) and segment (b1→b2) properly cross.
 * Collinear/touching endpoints are treated as non-intersecting for routing purposes.
 */
export declare function segmentsIntersect(a1: Point, a2: Point, b1: Point, b2: Point): boolean;
/** True when any segment of polyline a crosses any segment of polyline b. */
export declare function polylinesCross(a: Point[], b: Point[]): boolean;
/** Counts pairwise crossings across a set of polylines. */
export declare function countPolylineCrossings(polys: Point[][]): number;
export declare function elbowPath(start: Point, end: Point, elbowX?: number, elbowY?: number): Point[];
export declare function vElbowPath(start: Point, end: Point, midX?: number, midY?: number): Point[];
export declare function isPointAboveRect(point: Point, rect: Rect): boolean;
export declare function isPointBelowRect(point: Point, rect: Rect): boolean;
export declare function isPointLeftOfRect(point: Point, rect: Rect): boolean;
export declare function isPointRightOfRect(point: Point, rect: Rect): boolean;
export declare function rectAbove(r1: Rect, r2: Rect): boolean;
export declare function rectBelow(r1: Rect, r2: Rect): boolean;
export declare function rectLeftOf(r1: Rect, r2: Rect): boolean;
export declare function rectRightOf(r1: Rect, r2: Rect): boolean;
/**
 * Converts a channel tier into a RailPosition with deterministic metadata.
 * Maps the numeric channel system to physical rail offsets:
 *   0 = PRIMARY (center rail)
 *   -1, -2, -3 = TOP_1, TOP_2, TOP_3 (escape rails above primary)
 *   +1, +2, +3 = BOTTOM_1, BOTTOM_2, BOTTOM_3 (escape rails below primary)
 */
export declare function resolveRailFromChannel(channel: number, railSpacingY?: number): RailPosition;
/**
 * Builds a complete rail offset bundle for edge routing.
 * Given source and target channel tiers, returns waypoint adjustments
 * and escape mode information for loopback handling.
 */
export declare function buildRailOffset(sourceChannel: number, targetChannel: number, isLoopback: boolean, railSpacingY?: number): RailOffset;
/**
 * Computes the deterministic rail tier for an edge based on scenario and channel.
 * Returns the recommended channel tier for routing with proper escape semantics.
 */
export declare function determineRailTier(isLoopback: boolean, isSameLane: boolean, currentChannel: number, laneCount: number): number;
//# sourceMappingURL=layoutGeometry.d.ts.map