/**
 * RoutingTypesPanel — admin reference for all 14 canonical connection routing types.
 */
import React from 'react';
export interface RoutingTypeDef {
    code: string;
    fullName: string;
    group: string;
    bends: number;
    sourceAnchor: string;
    targetAnchor: string;
    skew: boolean;
    isDashed: boolean;
    miniPoints: [number, number][];
    trigger: string;
    codeMapping: {
        bendType: string;
        scenarioPattern: string;
        elbowYPolicy: string;
    };
    notes?: string;
}
interface Props {
    layoutResult?: any;
}
export declare const RoutingTypesPanel: React.FC<Props>;
export {};
//# sourceMappingURL=RoutingTypesPanel.d.ts.map