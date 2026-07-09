/**
 * PatternTableController — owns the live pattern table.
 *
 * Persists to localStorage so custom patterns survive page refresh.
 * Falls back to DEFAULT_PATTERN_TABLE on first load or parse failure.
 * Emits on every mutation so subscribers stay in sync.
 */
import { DEFAULT_PATTERN_TABLE } from '../core/routing/patternDefinition';
const STORAGE_KEY = 'pml:patternTable:v1';
export class PatternTableController {
    constructor() {
        Object.defineProperty(this, "table", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "listeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        this.table = this.load();
    }
    getTable() {
        return this.table;
    }
    subscribe(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }
    updatePattern(id, patch) {
        this.table = this.table.map((p) => (p.id === id ? { ...p, ...patch } : p));
        this.commit();
    }
    setTable(table) {
        this.table = table;
        this.commit();
    }
    resetToDefaults() {
        this.table = DEFAULT_PATTERN_TABLE.map((p) => ({ ...p }));
        this.commit();
    }
    reorder(fromIndex, toIndex) {
        const next = [...this.table];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        // Reassign priorities to match visual order (highest first = index 0)
        const maxP = next.length * 10;
        this.table = next.map((p, i) => ({ ...p, priority: maxP - i * 10 }));
        this.commit();
    }
    commit() {
        this.save();
        this.emit();
    }
    emit() {
        for (const fn of this.listeners)
            fn(this.table);
    }
    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.table));
        }
        catch {
            // localStorage quota or SSR — silently ignore
        }
    }
    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0)
                    return parsed;
            }
        }
        catch {
            // Corrupt storage — fall through to defaults
        }
        return DEFAULT_PATTERN_TABLE.map((p) => ({ ...p }));
    }
}
