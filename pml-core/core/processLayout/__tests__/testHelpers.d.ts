/**
 * Test helpers for layout pipeline tests.
 * Provides PML fixtures, a run helper, and snapshot serialization.
 */
import { LayoutResult } from '../layoutTypes';
export declare const PML_FIXTURES: Record<string, string>;
export interface LayoutSnapshot {
    fingerprint: string;
    nodes: Array<{
        id: string;
        x: number;
        y: number;
        laneId: string;
    }>;
    edges: Array<{
        id: string;
        scenario: string;
        waypointCount: number;
        channel: number;
    }>;
    lanes: Array<{
        id: string;
        y: number;
        height: number;
    }>;
}
export declare function runLayout(pml: string): LayoutResult;
export declare function runLayoutWithSettings(pml: string, settings: Record<string, any>): LayoutResult;
export declare function toSnapshot(result: LayoutResult): LayoutSnapshot;
//# sourceMappingURL=testHelpers.d.ts.map