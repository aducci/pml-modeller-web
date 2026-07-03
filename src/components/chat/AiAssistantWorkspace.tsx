'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { ProcessController, WorkspaceState } from 'pml-core';
import { ConversationProvider, useConversation } from './ConversationContext';
import { AiAssistantView } from './AiAssistantView';

interface Props {
  controller: ProcessController;
  state: WorkspaceState;
}

export function AiAssistantWorkspace({ controller, state }: Props) {
  return (
    <ConversationProvider>
      <AiAssistantViewInner controller={controller} state={state} />
    </ConversationProvider>
  );
}

function AiAssistantViewInner({ controller, state }: Props) {
  const { startInterview } = useConversation();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    startInterview(state.pmlContent);
  }, [startInterview, state.pmlContent]);

  return (
    <AiAssistantView controller={controller} state={state} />
  );
}
