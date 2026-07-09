import { DEFAULT_ROUTING_RULES, } from '../core/routing/routingRuleDefinition';
const STORAGE_KEY = 'pml:routingRules:v1';
export class RoutingRulesController {
    constructor(initial) {
        Object.defineProperty(this, "rules", {
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
        const loaded = this.load();
        if (loaded) {
            this.rules = loaded;
        }
        else if (initial) {
            this.rules = structuredClone(initial);
        }
        else {
            this.rules = structuredClone(DEFAULT_ROUTING_RULES);
        }
    }
    getTable() {
        return this.rules;
    }
    subscribe(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }
    emit() {
        this.listeners.forEach(fn => fn(this.rules));
    }
    commit() {
        this.save();
        this.emit();
    }
    updateRule(id, patch) {
        this.rules = this.rules.map(r => r.id === id ? { ...r, ...patch } : r);
        this.commit();
    }
    updateMatch(id, match) {
        this.rules = this.rules.map(r => r.id === id ? { ...r, match: { ...r.match, ...match } } : r);
        this.commit();
    }
    setPrimary(id, primary) {
        this.rules = this.rules.map(r => r.id === id ? { ...r, primary } : r);
        this.commit();
    }
    setAlternates(id, alternates) {
        this.rules = this.rules.map(r => r.id === id ? { ...r, alternates } : r);
        this.commit();
    }
    addAlternate(id, alt) {
        this.rules = this.rules.map(r => {
            if (r.id !== id)
                return r;
            return { ...r, alternates: [...r.alternates, alt] };
        });
        this.commit();
    }
    removeAlternate(id, altIndex) {
        this.rules = this.rules.map(r => {
            if (r.id !== id)
                return r;
            return { ...r, alternates: r.alternates.filter((_, i) => i !== altIndex) };
        });
        this.commit();
    }
    toggleEnabled(id) {
        this.rules = this.rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
        this.commit();
    }
    reorder(fromIndex, toIndex) {
        const next = [...this.rules];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        // Reassign priorities to match visual order (highest priority = first row)
        this.rules = next.map((r, i) => ({ ...r, priority: (next.length - i) * 10 }));
        this.commit();
    }
    addRule(rule) {
        this.rules = [rule, ...this.rules];
        this.commit();
    }
    deleteRule(id) {
        this.rules = this.rules.filter(r => r.id !== id);
        this.commit();
    }
    resetToDefaults() {
        this.rules = structuredClone(DEFAULT_ROUTING_RULES);
        this.commit();
    }
    setTable(rules) {
        this.rules = structuredClone(rules);
        this.commit();
    }
    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.rules));
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
        return null;
    }
}
