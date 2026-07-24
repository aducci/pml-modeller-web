'use client';

import { useCallback, useEffect, useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';

interface FindingCopyEntry {
  code: string;
  title: string;
  summary: string;
  isOverridden: boolean;
  updatedAt: string | null;
  updatedByUser: { name: string | null; email: string } | null;
}

/**
 * Admin "Finding Copy" tab — lets an admin edit the short title/one-line
 * summary shown on each Finding card (FindingCard.tsx), without touching the
 * rule logic in PML_DSL's contractGuards.ts or redeploying. Mirrors
 * SkillsPanel's talk-directly-to-its-own-API-route shape, but simpler: one
 * row per code, two short fields, no version history (unlike a prompt, a
 * finding's one-line label isn't something you'd want to roll back through
 * history for — "reset to default" is enough).
 */
export function FindingCopyPanel() {
  const [entries, setEntries] = useState<FindingCopyEntry[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { title: string; summary: string }>>({});
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch('/api/admin/finding-copy');
    if (!res.ok) {
      setError(`Failed to load (${res.status})`);
      return;
    }
    const data = await res.json();
    setEntries(data.entries);
    setDrafts(
      Object.fromEntries(
        (data.entries as FindingCopyEntry[]).map((e) => [e.code, { title: e.title, summary: e.summary }])
      )
    );
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = useCallback(async (code: string) => {
    const draft = drafts[code];
    if (!draft) return;
    setSavingCode(code);
    setError(null);
    try {
      const res = await fetch('/api/admin/finding-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, title: draft.title, summary: draft.summary }),
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
  }, [drafts, load]);

  if (!entries) {
    return (
      <div style={{ padding: 24, color: '#9CA3AF', fontSize: 13 }}>
        {error ?? 'Loading finding copy...'}
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20, background: '#F9FAFB' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Finding Copy</div>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
          Short title and one-line summary shown on each Finding card. The full technical explanation
          (used as AI context) is unaffected — it's still shown behind "Details" on the card.
        </div>
      </div>

      {error && (
        <div style={{ padding: '8px 14px', marginBottom: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, color: '#DC2626', fontSize: 12 }}>
          {error}
        </div>
      )}

      {entries.map((entry) => {
        const draft = drafts[entry.code] ?? { title: entry.title, summary: entry.summary };
        const isDirty = draft.title !== entry.title || draft.summary !== entry.summary;
        return (
          <div
            key={entry.code}
            style={{
              background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
              padding: 14, marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', color: '#6366F1', fontWeight: 600 }}>
                {entry.code}
              </span>
              {entry.isOverridden && (
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#EEF2FF', color: '#4338CA', fontWeight: 600 }}>
                  Edited
                </span>
              )}
              {entry.updatedByUser && (
                <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>
                  {entry.updatedByUser.name || entry.updatedByUser.email}
                  {entry.updatedAt && ` · ${new Date(entry.updatedAt).toLocaleDateString()}`}
                </span>
              )}
            </div>

            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 3 }}>
              Title
            </label>
            <input
              value={draft.title}
              onChange={(e) => setDrafts((d) => ({ ...d, [entry.code]: { ...draft, title: e.target.value } }))}
              style={{
                width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB',
                fontSize: 13, marginBottom: 10, outline: 'none', color: '#111827',
              }}
            />

            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 3 }}>
              Summary
            </label>
            <input
              value={draft.summary}
              onChange={(e) => setDrafts((d) => ({ ...d, [entry.code]: { ...draft, summary: e.target.value } }))}
              style={{
                width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB',
                fontSize: 13, marginBottom: 10, outline: 'none', color: '#111827',
              }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleSave(entry.code)}
                disabled={!isDirty || savingCode === entry.code}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6,
                  border: 'none', background: isDirty && savingCode !== entry.code ? '#059669' : '#E5E7EB',
                  color: isDirty && savingCode !== entry.code ? '#fff' : '#9CA3AF', fontSize: 12, fontWeight: 600,
                  cursor: isDirty && savingCode !== entry.code ? 'pointer' : 'not-allowed',
                }}
              >
                <Save size={12} />
                {savingCode === entry.code ? 'Saving...' : 'Save'}
              </button>
              {isDirty && (
                <button
                  onClick={() => setDrafts((d) => ({ ...d, [entry.code]: { title: entry.title, summary: entry.summary } }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6,
                    border: '1px solid #E5E7EB', background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={12} />
                  Discard
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
