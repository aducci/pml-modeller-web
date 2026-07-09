import { RoutingRuleDefinition, AlternateRouting, RoutingRuleMatch, RoutingTypeCode } from '../core/routing/routingRuleDefinition';
type Listener = (rules: RoutingRuleDefinition[]) => void;
export declare class RoutingRulesController {
    private rules;
    private listeners;
    constructor(initial?: RoutingRuleDefinition[]);
    getTable(): RoutingRuleDefinition[];
    subscribe(fn: Listener): () => void;
    private emit;
    private commit;
    updateRule(id: string, patch: Partial<Omit<RoutingRuleDefinition, 'id'>>): void;
    updateMatch(id: string, match: Partial<RoutingRuleMatch>): void;
    setPrimary(id: string, primary: RoutingTypeCode): void;
    setAlternates(id: string, alternates: AlternateRouting[]): void;
    addAlternate(id: string, alt: AlternateRouting): void;
    removeAlternate(id: string, altIndex: number): void;
    toggleEnabled(id: string): void;
    reorder(fromIndex: number, toIndex: number): void;
    addRule(rule: RoutingRuleDefinition): void;
    deleteRule(id: string): void;
    resetToDefaults(): void;
    setTable(rules: RoutingRuleDefinition[]): void;
    private save;
    private load;
}
export {};
//# sourceMappingURL=RoutingRulesController.d.ts.map