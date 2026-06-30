import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Settings, Palette, GitBranch, Map, ExternalLink } from 'lucide-react';
import { ProcessController } from 'pml-core';
import { PatternTableController } from 'pml-core';
import { RoutingRulesController } from 'pml-core';
import { WorkspaceState } from 'pml-core';
import { LayoutRulesPanel } from './LayoutRulesPanel';
import { ThemePanel } from './ThemePanel';
import { PatternTablePanel } from './PatternTablePanel';
import { RoutingTypesPanel } from './RoutingTypesPanel';
import { RoutingRulesPanel } from './RoutingRulesPanel';

type Tab = 'layout' | 'theme' | 'patterns' | 'routing-types' | 'routing-rules';

interface Props {
  controller: ProcessController;
  patternTableController: PatternTableController;
  routingRulesController: RoutingRulesController;
  state: WorkspaceState;
  onBack: () => void;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode; group: string }[] = [
  { id: 'routing-types', label: 'Types', icon: <BookOpen size={14} />, group: 'Reference' },
  { id: 'routing-rules', label: 'Rules', icon: <Map size={14} />, group: 'Reference' },
  { id: 'patterns', label: 'Patterns', icon: <GitBranch size={14} />, group: 'Routing' },
  { id: 'layout', label: 'Layout', icon: <Settings size={14} />, group: 'Config' },
  { id: 'theme', label: 'Theme', icon: <Palette size={14} />, group: 'Config' },
];

export const AdminView: React.FC<Props> = ({ controller, patternTableController, routingRulesController, state, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('theme');

  const openInNewWindow = () => {
    window.open('/admin', '_blank', 'noopener,noreferrer');
  };

  const groups = Array.from(new Set(TABS.map(t => t.group)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden', background: '#F9FAFB' }}>

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header style={{ display: 'flex', alignItems: 'center', height: 44, flexShrink: 0, background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 16px', gap: 10 }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 5 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#111827'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6B7280'; }}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div style={{ width: 1, height: 18, background: '#E5E7EB' }} />

        <div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>Configuration</span>
        </div>

        {/* Live indicator */}
        {state.layoutResult && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#059669' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            Live
          </div>
        )}

        <button
          onClick={openInNewWindow}
          title="Open admin in a new window"
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6366F1', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#E0E7FF'; e.currentTarget.style.borderColor = '#A5B4FC'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.borderColor = '#C7D2FE'; }}
        >
          <ExternalLink size={12} />
          New Window
        </button>
      </header>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Left nav — compact */}
        <nav style={{ width: 180, flexShrink: 0, background: '#fff', borderRight: '1px solid #E5E7EB', padding: '8px 0', overflowY: 'auto' }}>
          {groups.map(group => (
            <div key={group} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', padding: '4px 12px 4px' }}>
                {group}
              </div>
              {TABS.filter(t => t.group === group).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', width: '100%',
                    background: activeTab === tab.id ? '#EEF2FF' : 'none',
                    border: 'none', borderLeft: activeTab === tab.id ? '2px solid #6366F1' : '2px solid transparent',
                    cursor: 'pointer', textAlign: 'left', fontSize: 12, fontWeight: activeTab === tab.id ? 600 : 400,
                    color: activeTab === tab.id ? '#4338CA' : '#374151',
                  }}
                  onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.background = '#F9FAFB'; }}
                  onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.background = 'none'; }}
                >
                  <span style={{ color: activeTab === tab.id ? '#6366F1' : '#9CA3AF', flexShrink: 0 }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          ))}

          {/* Spacer + quick stats */}
          <div style={{ marginTop: 12, padding: '10px 12px', borderTop: '1px solid #F3F4F6' }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#D1D5DB', marginBottom: 6 }}>
              Session
            </div>
            <OverrideStat
              label="Layout"
              count={Object.keys(state.layoutSettingsOverrides).length}
              onReset={() => controller.updateLayoutSettings({})}
            />
            <OverrideStat
              label="Theme"
              count={Object.keys(state.themeOverrides).length}
              onReset={() => controller.updateThemeOverrides({})}
            />
          </div>
        </nav>

        {/* Panel content */}
        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '20px 28px' }}>
          {activeTab === 'routing-types' && (
            <RoutingTypesPanel layoutResult={state.layoutResult} />
          )}
          {activeTab === 'routing-rules' && (
            <RoutingRulesPanel
              controller={routingRulesController}
              rules={state.routingRules}
            />
          )}
          {activeTab === 'patterns' && (
            <PatternTablePanel
              controller={patternTableController}
              table={state.patternTable}
            />
          )}
          {activeTab === 'layout' && (
            <LayoutRulesPanel
              overrides={state.layoutSettingsOverrides}
              onChange={o => controller.updateLayoutSettings(o)}
            />
          )}
          {activeTab === 'theme' && (
            <ThemePanel
              overrides={state.themeOverrides}
              onChange={o => controller.updateThemeOverrides(o)}
            />
          )}
        </main>
      </div>
    </div>
  );
};

// Count total modified keys across nested overrides
function flattenKeys(obj: any, prefix = ''): Record<string, true> {
  if (typeof obj !== 'object' || obj === null) return prefix ? { [prefix]: true } : {};
  let keys: Record<string, true> = {};
  for (const k of Object.keys(obj)) {
    const nested = flattenKeys(obj[k], prefix ? `${prefix}.${k}` : k);
    keys = { ...keys, ...nested };
  }
  return keys;
}

const OverrideStat: React.FC<{ label: string; count: number; onReset: () => void }> = ({ label, count, onReset }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, padding: '2px 0' }}>
    <span style={{ fontSize: 11, color: '#6B7280' }}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 9,
        background: count > 0 ? '#EEF2FF' : '#F3F4F6',
        color: count > 0 ? '#6366F1' : '#D1D5DB',
      }}>
        {count}
      </span>
      {count > 0 && (
        <button
          onClick={onReset}
          style={{ fontSize: 10, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          reset
        </button>
      )}
    </div>
  </div>
);
