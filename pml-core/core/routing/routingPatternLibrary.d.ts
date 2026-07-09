/**
 * Routing Pattern Library
 *
 * Canonical routing patterns for process-model edge layout.
 * Each pattern specifies hard side constraints and soft preferences,
 * plus waypoint generation logic.
 */
import { RoutingPattern } from '../processLayout/layoutTypes';
export declare const PATTERN_STRAIGHT_RIGHT: RoutingPattern;
export declare const PATTERN_ELBOW_RIGHT_DOWN: RoutingPattern;
export declare const PATTERN_ELBOW_RIGHT_UP: RoutingPattern;
export declare const PATTERN_ELBOW_BOTTOM_LEFT: RoutingPattern;
export declare const PATTERN_BOTTOM_CORRIDOR: RoutingPattern;
export declare const PATTERN_TOP_CORRIDOR: RoutingPattern;
export declare const PATTERN_REGISTRY: Record<string, RoutingPattern>;
export declare function getPattern(patternId: string): RoutingPattern | null;
//# sourceMappingURL=routingPatternLibrary.d.ts.map