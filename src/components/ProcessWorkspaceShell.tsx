'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ProcessController,
  ProcessWorkspaceView,
  WorkspaceState,
  readSharedState,
  onSharedStateChange,
} from 'pml-core';
import { AiAssistantView } from '@/components/chat/AiAssistantView';

type WorkspaceMode = 'editor' | 'ai-assistant';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const AUTOSAVE_DEBOUNCE_MS = 1500;

type ProcessWorkspaceShellProps = {
  initialPml: string;
  enableAiAssistant?: boolean;
  /** The file currently open. Edits autosave to PATCH /api/files/[fileId]. Omit for unsaved/demo workspaces. */
  fileId?: string;
  /** The file's parent project — used to list sibling files for the folder dropdown. */
  projectId?: string;
};

export function ProcessWorkspaceShell({
  initialPml,
  enableAiAssistant = true,
  fileId,
  projectId,
}: ProcessWorkspaceShellProps) {
  const router = useRouter();
  const controller = useMemo(() => new ProcessController(initialPml), [initialPml]);
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [mode, setMode] = useState<WorkspaceMode>('editor');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [files, setFiles] = useState<{ id: string; name: string }[] | undefined>(undefined);

  useEffect(() => {
    return controller.subscribe(setState);
  }, [controller]);

  // Load sibling files for the folder-dropdown switcher. Only when there's a
  // project to scope the list to — the /demo sandbox has neither a projectId
  // nor anything to switch between.
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    fetch(`/api/projects/${projectId}/files`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { files: [] }))
      .then((data) => {
        if (!cancelled) setFiles(data.files || []);
      })
      .catch(() => {
        if (!cancelled) setFiles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const handleSelectFile = (nextFileId: string) => {
    if (nextFileId === fileId) return;
    // A route navigation (not a client-side content swap) — reuses the page's
    // existing server-side load/tenant-scope check for the new file, and is
    // a soft transition within the same /dashboard layout, not a full reload.
    router.push(`/dashboard/${nextFileId}`);
  };

  const handleCreateFile = async () => {
    if (!projectId) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Untitled file' }),
      });
      const data = await response.json();
      if (response.ok && data?.file?.id) {
        router.push(`/dashboard/${data.file.id}`);
      }
    } catch {
      // Dropdown stays open with the existing list; nothing to recover here.
    }
  };

  // Autosave: debounce PML changes and PATCH them to the open file. Skipped
  // entirely when there's no fileId (e.g. the unauthenticated /demo
  // sandbox, which has nothing to save to).
  const lastSavedRef = useRef(initialPml);
  useEffect(() => {
    if (!fileId || !state) return;
    const content = state.pmlContent;
    if (content === undefined || content === lastSavedRef.current) return;

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const response = await fetch(`/api/files/${fileId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pmlSource: content }),
        });
        if (!response.ok) throw new Error('Save failed');
        lastSavedRef.current = content;
        setSaveStatus('saved');
        controller.markSaved();
      } catch {
        setSaveStatus('error');
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [fileId, state?.pmlContent]);

  // Layout/theme overrides set from the admin screen live in localStorage
  // (see pml-core's sharedState) so they apply here without a shared controller instance.
  useEffect(() => {
    const shared = readSharedState();
    if (shared) {
      if (Object.keys(shared.themeOverrides).length > 0) {
        controller.updateThemeOverrides(shared.themeOverrides);
      }
      if (Object.keys(shared.layoutSettingsOverrides).length > 0) {
        controller.updateLayoutSettings(shared.layoutSettingsOverrides);
      }
    }
    return onSharedStateChange((next) => {
      controller.updateThemeOverrides(next.themeOverrides ?? {});
      controller.updateLayoutSettings(next.layoutSettingsOverrides ?? {});
    });
  }, [controller]);

  if (!state) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 text-gray-400">
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {fileId && saveStatus !== 'idle' ? (
        <div
          className={`pointer-events-none absolute right-3 top-3 z-50 rounded-full px-3 py-1 text-xs font-medium shadow-sm ${
            saveStatus === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-white/90 text-gray-500 border border-gray-200'
          }`}
        >
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Save failed'}
        </div>
      ) : null}
      <ProcessWorkspaceView
        controller={controller}
        state={state}
        // Opens in a new tab (not router.push) so the workspace stays open —
        // admin overrides propagate to it live via the sharedState 'storage'
        // event listener above, no navigation/round-trip needed to see them.
        onNavigateAdmin={() => window.open('/admin', '_blank', 'noopener,noreferrer')}
        mode={enableAiAssistant ? mode : 'editor'}
        onModeChange={enableAiAssistant ? setMode : undefined}
        aiAssistantPanel={enableAiAssistant ? <AiAssistantView controller={controller} state={state} /> : undefined}
        files={files}
        activeFileId={fileId}
        onSelectFile={projectId ? handleSelectFile : undefined}
        onCreateFile={projectId ? handleCreateFile : undefined}
      />
    </div>
  );
}
