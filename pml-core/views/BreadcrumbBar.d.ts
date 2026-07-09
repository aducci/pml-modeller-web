import React from 'react';
export interface BreadcrumbBarProps {
    trail: Array<{
        processName: string;
    }>;
    currentProcess: string;
    pinnedActor: string | null;
    processInterfacesOn: boolean;
    onNavigateTo: (index: number) => void;
    onUnpinActor: () => void;
}
export declare const BreadcrumbBar: React.FC<BreadcrumbBarProps>;
//# sourceMappingURL=BreadcrumbBar.d.ts.map