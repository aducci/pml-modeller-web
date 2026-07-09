import React from 'react';
import { ProcessController } from '../../controllers/ProcessController';
import { PatternTableController } from '../../controllers/PatternTableController';
import { RoutingRulesController } from '../../controllers/RoutingRulesController';
import { WorkspaceState } from '../../types';
interface Props {
    controller: ProcessController;
    patternTableController: PatternTableController;
    routingRulesController: RoutingRulesController;
    state: WorkspaceState;
    onBack: () => void;
}
export declare const AdminView: React.FC<Props>;
export {};
//# sourceMappingURL=AdminView.d.ts.map