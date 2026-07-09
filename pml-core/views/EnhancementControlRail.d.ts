import React from 'react';
type ConnectorStyle = 'uniform' | 'keyFlow' | 'flowTypes';
type Props = {
    laneViewMode: 'swimlane' | 'none' | 'by-app';
    modelSpacing: 'Natural' | 'Compact';
    connectorStyle: ConnectorStyle;
    propertiesPaneOn: boolean;
    onSetLaneViewMode: (mode: 'swimlane' | 'none' | 'by-app') => void;
    onSetModelSpacing: (mode: 'Natural' | 'Compact') => void;
    onSetConnectorStyle: (style: ConnectorStyle) => void;
    onTogglePropertiesPane: () => void;
};
export declare const EnhancementControlRail: React.FC<Props>;
export {};
//# sourceMappingURL=EnhancementControlRail.d.ts.map