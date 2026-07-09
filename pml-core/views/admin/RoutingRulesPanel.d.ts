/**
 * RoutingRulesPanel — admin UI for the routing rule mapping table.
 *
 * Each rule maps (sourceType × targetType × laneConfig) to a primary routing
 * type plus ordered alternates with activation conditions.
 */
import React from 'react';
import { RoutingRulesController } from '../../controllers/RoutingRulesController';
import { RoutingRuleDefinition } from '../../core/routing/routingRuleDefinition';
interface Props {
    controller: RoutingRulesController;
    rules: RoutingRuleDefinition[];
}
export declare const RoutingRulesPanel: React.FC<Props>;
export {};
//# sourceMappingURL=RoutingRulesPanel.d.ts.map