/**
 * PatternTablePanel — admin UI for the first-class routing pattern table.
 *
 * Table view: one row per pattern in priority order.
 * Expand a row to edit detect criteria and flow parameters inline.
 * Changes go directly to PatternTableController → live layout preview.
 */
import React from 'react';
import { PatternTableController } from '../../controllers/PatternTableController';
import { PatternDefinition } from '../../core/routing/patternDefinition';
interface Props {
    controller: PatternTableController;
    table: PatternDefinition[];
}
export declare const PatternTablePanel: React.FC<Props>;
export {};
//# sourceMappingURL=PatternTablePanel.d.ts.map