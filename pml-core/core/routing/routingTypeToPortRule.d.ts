/**
 * Routing Type → Port Assignment Rule
 *
 * Single source of truth mapping every RoutingTypeCode to the PortAssignmentRule
 * that realises it in the engine. This is the bridge between the admin rules
 * table (which speaks in canonical type codes) and the port resolver (which
 * speaks in PortAssignmentRule).
 *
 * deriveRoutingTypeCode() in routingDiagnostics.ts is the inverse of this
 * table — given resolved ports + bendType it returns the code. That function
 * is display-only; this table is the authoritative forward direction.
 */
import { PortAssignmentRule } from '../processLayout/layoutTypes';
import { RoutingTypeCode } from './routingRuleDefinition';
/**
 * Returns the PortAssignmentRule for a given routing type code.
 * Returns null for codes that should not override engine defaults (AOT).
 */
export declare function codeToPortRule(code: RoutingTypeCode): PortAssignmentRule | null;
//# sourceMappingURL=routingTypeToPortRule.d.ts.map