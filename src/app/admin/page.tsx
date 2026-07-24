'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings2, Sparkles, AlertTriangle, ListChecks } from 'lucide-react';
import {
  ProcessController,
  PatternTableController,
  RoutingRulesController,
  AdminView,
  WorkspaceState,
  readSharedState,
  writeSharedState,
  onSharedStateChange,
  type SharedState,
} from 'pml-core';
import { SkillsPanel } from '@/components/admin/SkillsPanel';
import { FindingCopyPanel } from '@/components/admin/FindingCopyPanel';
import { ValidationRulesPanel } from '@/components/admin/ValidationRulesPanel';

// Outer tab: 'workspace' is everything AdminView already covers (Theme,
// Layout, Patterns, Routing — client-side/localStorage config from
// pml-core). 'skills', 'findingCopy', and 'validationRules' are all new: real
// DB-backed content needing Next.js API routes + Prisma + the super-admin
// auth guard — none of which pml-core (a portable library also used by a
// standalone dev harness outside this web app) knows about. Kept as sibling
// tabs rather than injected into AdminView's own tab bar, so pml-core stays
// unaware of anything web-app-specific.
type OuterTab = 'workspace' | 'skills' | 'findingCopy' | 'validationRules';

// Standalone controller set for the config screen. Layout/theme overrides,
// pattern table, and routing rules are global (localStorage-backed via
// pml-core's sharedState), so no PML document context is needed here —
// this mirrors PML_DSL's own dev shell (PML_DSL/src/App.tsx).
export default function AdminPage() {
  const router = useRouter();
  const [outerTab, setOuterTab] = useState<OuterTab>('workspace');

  const patternTableControllerRef = useRef<PatternTableController>();
  if (!patternTableControllerRef.current) {
    patternTableControllerRef.current = new PatternTableController();
  }
  const patternTableController = patternTableControllerRef.current;

  const routingRulesControllerRef = useRef<RoutingRulesController>();
  if (!routingRulesControllerRef.current) {
    routingRulesControllerRef.current = new RoutingRulesController();
  }
  const routingRulesController = routingRulesControllerRef.current;

  const controllerRef = useRef<ProcessController>();
  if (!controllerRef.current) {
    controllerRef.current = new ProcessController('', patternTableController);
  }
  const controller = controllerRef.current;

  const [state, setState] = useState<WorkspaceState | null>(null);

  useEffect(() => controller.subscribe(setState), [controller]);
  useEffect(
    () => patternTableController.subscribe((table) => controller.updatePatternTable(table)),
    [controller, patternTableController]
  );
  useEffect(
    () => routingRulesController.subscribe((rules) => controller.updateRoutingRules(rules)),
    [controller, routingRulesController]
  );

  // Load existing overrides on mount, and pick up changes made in other tabs.
  useEffect(() => {
    const applyShared = (shared: SharedState) => {
      if (Object.keys(shared.themeOverrides).length > 0) {
        controller.updateThemeOverrides(shared.themeOverrides);
      }
      if (Object.keys(shared.layoutSettingsOverrides).length > 0) {
        controller.updateLayoutSettings(shared.layoutSettingsOverrides);
      }
      if (shared.patternTable?.length > 0) {
        patternTableController.setTable(shared.patternTable);
        controller.updatePatternTable(shared.patternTable);
      }
      if (shared.routingRules?.length > 0) {
        routingRulesController.setTable(shared.routingRules);
        controller.updateRoutingRules(shared.routingRules);
      }
    };

    const shared = readSharedState();
    if (shared) applyShared(shared);
    return onSharedStateChange(applyShared);
  }, [controller, patternTableController, routingRulesController]);

  // Persist overrides back to localStorage whenever they change.
  const lastWrittenRef = useRef('');
  useEffect(() => {
    if (!state) return;
    const snapshot: Omit<SharedState, 'schemaVersion'> = {
      themeOverrides: state.themeOverrides,
      layoutSettingsOverrides: state.layoutSettingsOverrides,
      patternTable: state.patternTable,
      routingRules: state.routingRules,
    };
    const serialized = JSON.stringify(snapshot);
    if (serialized !== lastWrittenRef.current) {
      lastWrittenRef.current = serialized;
      writeSharedState(snapshot);
    }
  }, [state]);

  if (!state) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-400">
        Loading configuration...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Outer tab strip — 'workspace' (Theme/Layout/Patterns, from
          pml-core's AdminView) vs. 'skills' (DB-backed AI prompt content,
          this web app only). AdminView keeps its own header/Back button for
          leaving admin entirely; this strip only switches between the two
          top-level areas. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px 0', background: '#F9FAFB', flexShrink: 0 }}>
        {([
          { id: 'workspace' as const, label: 'Workspace Config', icon: Settings2 },
          { id: 'skills' as const, label: 'AI Skills', icon: Sparkles },
          { id: 'findingCopy' as const, label: 'Finding Copy', icon: AlertTriangle },
          { id: 'validationRules' as const, label: 'Validation Rules', icon: ListChecks },
        ]).map((tab) => {
          const Icon = tab.icon;
          const active = outerTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setOuterTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                borderRadius: '6px 6px 0 0', border: '1px solid #E5E7EB', borderBottom: active ? '1px solid #fff' : '1px solid #E5E7EB',
                background: active ? '#fff' : 'transparent', color: active ? '#111827' : '#6B7280',
                fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', marginBottom: -1,
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {outerTab === 'workspace' ? (
          <AdminView
            controller={controller}
            patternTableController={patternTableController}
            routingRulesController={routingRulesController}
            state={state}
            onBack={() => router.back()}
          />
        ) : outerTab === 'skills' ? (
          <SkillsPanel />
        ) : outerTab === 'findingCopy' ? (
          <FindingCopyPanel />
        ) : (
          <ValidationRulesPanel />
        )}
      </div>
    </div>
  );
}
