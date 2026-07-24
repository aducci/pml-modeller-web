'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RotateCcw, Save, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { SKILL_DISPLAY_META } from '@/lib/ai/skillMeta';

interface SkillVersion {
  id: string;
  content: string;
  label: string | null;
  createdAt: string;
  createdByUser: { name: string | null; email: string } | null;
}

interface Skill {
  id: string;
  key: string;
  description: string | null;
  versions: SkillVersion[]; // newest first
}

function skillLabel(key: string): string {
  return (SKILL_DISPLAY_META as Record<string, { label: string }>)[key]?.label ?? key;
}

/**
 * Admin "Skills" tab — structured, versioned view/edit surface for the AI's
 * system/chat prompts (previously only editable via a code change to
 * lib/ai/prompts.ts + redeploy). Talks to /api/admin/skills directly, not
 * through pml-core's ProcessController/SharedState — those are for
 * client-side-only theme/layout overrides, whereas skill content is real
 * DB-backed, versioned, and gated by the super-admin check on the API
 * routes themselves (see lib/superAdmin.ts).
 */
export function SkillsPanel() {
  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch('/api/admin/skills');
    if (!res.ok) {
      setError(`Failed to load skills (${res.status})`);
      return;
    }
    const data = await res.json();
    setSkills(data.skills);
    setSelectedKey((prev) => prev ?? data.skills[0]?.key ?? null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectedSkill = useMemo(
    () => skills?.find((s) => s.key === selectedKey) ?? null,
    [skills, selectedKey]
  );
  const currentVersion = selectedSkill?.versions[0] ?? null;

  // Reset the draft to the current live content whenever the selected skill
  // changes (or first loads) — not on every render, so typing doesn't get
  // clobbered by a background refetch.
  useEffect(() => {
    if (currentVersion) setDraft(currentVersion.content);
  }, [selectedKey, currentVersion?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty = currentVersion ? draft !== currentVersion.content : false;

  const handleSave = useCallback(async () => {
    if (!selectedKey || !isDirty) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: selectedKey, content: draft }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${res.status})`);
      }
      await load();
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [selectedKey, draft, isDirty, load]);

  const handleRevert = useCallback(async (versionId: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/skills/revert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Revert failed (${res.status})`);
      }
      await load();
    } catch (err: any) {
      setError(err.message || 'Revert failed');
    } finally {
      setSaving(false);
    }
  }, [load]);

  if (!skills) {
    return (
      <div style={{ padding: 24, color: '#9CA3AF', fontSize: 13 }}>
        {error ?? 'Loading skills...'}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      {/* Left: skill list */}
      <nav style={{ width: 220, flexShrink: 0, background: '#fff', borderRight: '1px solid #E5E7EB', padding: '8px 0', overflowY: 'auto' }}>
        {skills.map((skill) => (
          <button
            key={skill.key}
            onClick={() => setSelectedKey(skill.key)}
            style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px',
              background: selectedKey === skill.key ? '#EEF2FF' : 'none',
              border: 'none', borderLeft: selectedKey === skill.key ? '2px solid #6366F1' : '2px solid transparent',
              cursor: 'pointer', fontSize: 13, fontWeight: selectedKey === skill.key ? 600 : 400,
              color: selectedKey === skill.key ? '#4338CA' : '#374151',
            }}
          >
            {skillLabel(skill.key)}
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400, marginTop: 2 }}>
              {skill.versions.length} version{skill.versions.length === 1 ? '' : 's'}
            </div>
          </button>
        ))}
      </nav>

      {/* Right: editor + history */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedSkill && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #E5E7EB', background: '#fff', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{skillLabel(selectedSkill.key)}</div>
                {selectedSkill.description && (
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{selectedSkill.description}</div>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={!isDirty || saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6,
                  border: 'none', background: isDirty && !saving ? '#059669' : '#E5E7EB',
                  color: isDirty && !saving ? '#fff' : '#9CA3AF', fontSize: 13, fontWeight: 600,
                  cursor: isDirty && !saving ? 'pointer' : 'not-allowed',
                }}
              >
                <Save size={14} />
                {saving ? 'Saving...' : 'Save as new version'}
              </button>
            </div>

            {error && (
              <div style={{ padding: '8px 20px', background: '#FEF2F2', borderBottom: '1px solid #FECACA', color: '#DC2626', fontSize: 12 }}>
                {error}
              </div>
            )}

            <div style={{ flex: 1, minHeight: 0, padding: 20 }}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck={false}
                style={{
                  width: '100%', height: '100%', resize: 'none', padding: 14, borderRadius: 8,
                  border: '1px solid #D1D5DB', background: '#FAFAFA', color: '#111827',
                  fontSize: 12.5, lineHeight: 1.6, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.background = '#fff'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.background = '#FAFAFA'; }}
              />
            </div>

            {/* Version history */}
            <div style={{ borderTop: '1px solid #E5E7EB', background: '#F9FAFB', flexShrink: 0, maxHeight: historyOpen ? 260 : 40, overflowY: 'auto', transition: 'max-height 0.15s' }}>
              <button
                onClick={() => setHistoryOpen((v) => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#6B7280', fontWeight: 600 }}
              >
                <Clock size={13} />
                Version history ({selectedSkill.versions.length})
                {historyOpen ? <ChevronUp size={13} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={13} style={{ marginLeft: 'auto' }} />}
              </button>
              {historyOpen && (
                <div style={{ padding: '0 20px 12px' }}>
                  {selectedSkill.versions.map((version, i) => (
                    <div
                      key={version.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 10px', borderRadius: 6, marginBottom: 4,
                        background: i === 0 ? '#EEF2FF' : '#fff', border: '1px solid #E5E7EB',
                      }}
                    >
                      <div style={{ fontSize: 12, color: '#374151' }}>
                        <span style={{ fontWeight: i === 0 ? 700 : 400 }}>
                          {i === 0 ? 'Current — ' : ''}{new Date(version.createdAt).toLocaleString()}
                        </span>
                        {version.label && <span style={{ color: '#9CA3AF' }}> · {version.label}</span>}
                        {version.createdByUser && (
                          <span style={{ color: '#9CA3AF' }}> · {version.createdByUser.name || version.createdByUser.email}</span>
                        )}
                      </div>
                      {i !== 0 && (
                        <button
                          onClick={() => handleRevert(version.id)}
                          disabled={saving}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6366F1', background: 'none', border: '1px solid #C7D2FE', borderRadius: 4, padding: '3px 8px', cursor: saving ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                        >
                          <RotateCcw size={11} />
                          Restore
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
