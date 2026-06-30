'use client';

import React, { useCallback, useRef } from 'react';
import { ProcessController, WorkspaceState } from 'pml-core';
import { ConversationProvider, useConversation } from './ConversationContext';
import { ChatPanel } from './ChatPanel';

interface Props {
  controller: ProcessController;
  state: WorkspaceState;
}

function AiAssistantContent({ controller, state }: Props) {
  const { acceptProposal } = useConversation();
  const lastPmlRef = useRef(state.pmlContent);

  // Keep pmlSnippet updated
  lastPmlRef.current = state.pmlContent;

  const handleProposalAccept = useCallback((patches: any[]) => {
    // Patches are applied — the ProcessController handles PML content updates
    // For now, the patches go through the conversation flow
    console.log('Proposal accepted:', patches);
  }, []);

  // Extract the current PML as a context snippet
  const pmlSnippet = state.pmlContent || '';

  return (
    <ChatPanel
      pmlSnippet={pmlSnippet}
      onProposalAccept={handleProposalAccept}
    />
  );
}

export function AiAssistantWorkspace({ controller, state }: Props) {
  return (
    <ConversationProvider>
      <AiAssistantContent controller={controller} state={state} />
    </ConversationProvider>
  );
}
