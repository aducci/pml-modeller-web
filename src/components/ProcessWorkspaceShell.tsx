'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProcessController, ProcessWorkspaceView, WorkspaceState } from 'pml-core';
import { AiAssistantView } from '@/components/chat/AiAssistantView';

type WorkspaceMode = 'editor' | 'ai-assistant';

type ProcessWorkspaceShellProps = {
  initialPml: string;
  enableAiAssistant?: boolean;
};

export function ProcessWorkspaceShell({
  initialPml,
  enableAiAssistant = true,
}: ProcessWorkspaceShellProps) {
  const controller = useMemo(() => new ProcessController(initialPml), [initialPml]);
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [mode, setMode] = useState<WorkspaceMode>('editor');

  useEffect(() => {
    return controller.subscribe(setState);
  }, [controller]);

  if (!state) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 text-gray-400">
        Loading workspace...
      </div>
    );
  }

  return (
    <ProcessWorkspaceView
      controller={controller}
      state={state}
      onNavigateAdmin={() => {}}
      mode={enableAiAssistant ? mode : 'editor'}
      onModeChange={enableAiAssistant ? setMode : undefined}
      aiAssistantPanel={enableAiAssistant ? <AiAssistantView controller={controller} state={state} /> : undefined}
    />
  );
}
