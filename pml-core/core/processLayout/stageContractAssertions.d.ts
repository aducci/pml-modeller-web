import { LayoutEdge, LayoutNode } from './layoutTypes';
export interface StageContractReport {
    errors: string[];
    warnings: string[];
}
export declare function assertCoordinateStageContracts(nodes: LayoutNode[]): StageContractReport;
export declare function assertChannelStageContracts(edges: LayoutEdge[], channelOverrides: Record<string, number>): StageContractReport;
export declare function assertRoutingStageContractsWithNodes(edges: LayoutEdge[], nodes: LayoutNode[]): StageContractReport;
export declare function appendStageReport(target: {
    errors: string[];
    warnings: string[];
}, report: StageContractReport): void;
//# sourceMappingURL=stageContractAssertions.d.ts.map