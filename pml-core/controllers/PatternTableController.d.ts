/**
 * PatternTableController — owns the live pattern table.
 *
 * Persists to localStorage so custom patterns survive page refresh.
 * Falls back to DEFAULT_PATTERN_TABLE on first load or parse failure.
 * Emits on every mutation so subscribers stay in sync.
 */
import { PatternDefinition } from '../core/routing/patternDefinition';
type Listener = (table: PatternDefinition[]) => void;
export declare class PatternTableController {
    private table;
    private listeners;
    constructor();
    getTable(): PatternDefinition[];
    subscribe(fn: Listener): () => void;
    updatePattern(id: string, patch: Partial<PatternDefinition>): void;
    setTable(table: PatternDefinition[]): void;
    resetToDefaults(): void;
    reorder(fromIndex: number, toIndex: number): void;
    private commit;
    private emit;
    private save;
    private load;
}
export {};
//# sourceMappingURL=PatternTableController.d.ts.map