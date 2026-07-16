'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

// Standalone controller set for the config screen. Layout/theme overrides,
// pattern table, and routing rules are global (localStorage-backed via
// pml-core's sharedState), so no PML document context is needed here —
// this mirrors PML_DSL's own dev shell (PML_DSL/src/App.tsx).
export default function AdminPage() {
  const router = useRouter();

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
    <div className="h-screen w-screen">
      <AdminView
        controller={controller}
        patternTableController={patternTableController}
        routingRulesController={routingRulesController}
        state={state}
        onBack={() => router.back()}
      />
    </div>
  );
}
