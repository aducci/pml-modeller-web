'use client';

import { useCallback, useEffect, useState } from 'react';
import { Power, PowerOff } from 'lucide-react';

interface RuleEntry {
  code: string;
  shape: string;
  category: string;
  enabled: boolean;
  isOverridden: boolean;
  updatedAt: string | null;
  updatedByUser: { name: string | null; email: string } | null;
}

const SHAPE_LABEL: Record<string, string> = {
  edgeCount: 'Edge count threshold',
  fieldMissing: 'Missing field',
  fieldArrayLength: 'Field array length',
  crossEndpointField: 'Cross-endpoint comparison',
};

/**
 * Admin "Validation Rules" tab — on/off control for each rule in pml-core's
 * rule-shape framework (contractGuards.ts's RuleConfig/DEFAULT_RULE_CONFIGS).
 * Phase one is enable/disable only; the ValidationRule.params JSON column
 * already supports per-field editing (threshold, predicate, message
 * template) for a future pass — this panel doesn't need to change shape
 * when that's added, only grow more inputs per row.
 */
export function ValidationRulesPanel() {
  const [rules, setRules] = useState<RuleEntry[] | null>(null);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch('/api/admin/validation-rules');
    if (!res.ok) {
      setError(`Failed to load (${res.status})`);
      return;
    }
    const data = await res.json();
    setRules(data.rules);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = useCallback(async (code: string, nextEnabled: boolean) => {
    setSavingCode(code);
    setError(null);
    try {
      const res = await fetch('/api/admin/validation-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, enabled: nextEnabled }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${res.status})`);
      }
      await load();
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSavingCode(null);
    }
  }, [load]);

  if (!rules) {
    return (
      <div style={{ padding: 24, color: '#9CA3AF', fontSize: 13 }}>
        {error ?? 'Loading validation rules...'}
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20, background: '#F9FAFB' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Validation Rules</div>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
          Turn individual Finding rules on or off. Disabled rules stop appearing on the canvas and are
          no longer surfaced to the AI as context. Wording for each rule is edited on the Finding Copy tab.
        </div>
      </div>

      {error && (
        <div style={{ padding: '8px 14px', marginBottom: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, color: '#DC2626', fontSize: 12 }}>
          {error}
        </div>
      )}

      {rules.map((rule) => (
        <div
          key={rule.code}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
            padding: '12px 14px', marginBottom: 8,
          }}
        >
          <button
            onClick={() => handleToggle(rule.code, !rule.enabled)}
            disabled={savingCode === rule.code}
            title={rule.enabled ? 'Click to disable this rule' : 'Click to enable this rule'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 6, flexShrink: 0,
              border: '1px solid', borderColor: rule.enabled ? '#A7F3D0' : '#E5E7EB',
              background: rule.enabled ? '#ECFDF5' : '#F9FAFB',
              color: rule.enabled ? '#059669' : '#9CA3AF',
              cursor: savingCode === rule.code ? 'not-allowed' : 'pointer',
            }}
          >
            {rule.enabled ? <Power size={14} /> : <PowerOff size={14} />}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontFamily: 'ui-monospace, monospace', color: '#6366F1', fontWeight: 600 }}>
                {rule.code}
              </span>
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#F3F4F6', color: '#6B7280', fontWeight: 600 }}>
                {rule.category}
              </span>
              {rule.isOverridden && (
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#EEF2FF', color: '#4338CA', fontWeight: 600 }}>
                  Overridden
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
              {SHAPE_LABEL[rule.shape] ?? rule.shape}
              {rule.updatedByUser && (
                <> · changed by {rule.updatedByUser.name || rule.updatedByUser.email}
                  {rule.updatedAt && ` on ${new Date(rule.updatedAt).toLocaleDateString()}`}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
