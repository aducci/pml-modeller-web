'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import type { PmlPatch } from 'pml-core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ModelObservation {
  severity: 'error' | 'warning' | 'info';
  category?: string;
  title: string;
  description: string;
  /** Index into the patches array (if this observation has a corresponding fix). */
  patchRef?: number;
}

export interface PatchProposal {
  id: string;
  patches: PmlPatch[];
  description: string;
  confidence: 'high' | 'medium' | 'low';
  status: 'pending' | 'applied' | 'rejected' | 'modified';
  createdAt: number;
}

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  patches?: PatchProposal[];
  observations?: ModelObservation[];
}

export type AssistantMode = 'guided' | 'exploratory';

export interface ConversationState {
  id: string;
  mode: AssistantMode;
  messages: ConversationMessage[];
  isProcessing: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type ConversationAction =
  | { type: 'ADD_MESSAGE'; payload: ConversationMessage }
  | { type: 'UPDATE_MESSAGE_CONTENT'; payload: { messageId: string; content: string } }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_PROPOSAL'; payload: { proposalId: string; status: PatchProposal['status'] } }
  | { type: 'CLEAR_CONVERSATION' }
  | { type: 'SET_MODE'; payload: AssistantMode };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function conversationReducer(state: ConversationState, action: ConversationAction): ConversationState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGE_CONTENT':
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.messageId ? { ...msg, content: action.payload.content } : msg
        ),
      };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isProcessing: false };
    case 'UPDATE_PROPOSAL':
      return {
        ...state,
        messages: state.messages.map((msg) => ({
          ...msg,
          patches: msg.patches?.map((p) =>
            p.id === action.payload.proposalId ? { ...p, status: action.payload.status } : p
          ),
        })),
      };
    case 'CLEAR_CONVERSATION':
      return createInitialState();
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    default:
      return state;
  }
}

let messageCounter = 0;
function generateId(): string {
  return `conv-${Date.now()}-${++messageCounter}`;
}

function createInitialState(): ConversationState {
  return {
    id: generateId(),
    mode: 'guided',
    messages: [],
    isProcessing: false,
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ConversationContextValue {
  state: ConversationState;
  sendMessage: (content: string, pmlSnippet?: string) => Promise<void>;
  acceptProposal: (proposalId: string) => void;
  rejectProposal: (proposalId: string) => void;
  clearConversation: () => void;
  setMode: (mode: AssistantMode) => void;
  startInterview: (pmlSnippet?: string) => void;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

export function useConversation(): ConversationContextValue {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error('useConversation must be used within ConversationProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(conversationReducer, undefined, createInitialState);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string, pmlSnippet?: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMsg: ConversationMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMsg });
    dispatch({ type: 'SET_PROCESSING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    // Try structured /api/ai/propose first; fall back to streaming /api/ai/chat
    try {
      abortRef.current = new AbortController();
      const response = await fetch('/api/ai/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, pmlSnippet: pmlSnippet ?? '' }),
        signal: abortRef.current.signal,
      });

      if (response.ok) {
        // Structured patch response
        const data = await response.json();

        const proposals: PatchProposal[] = (data.patches || []).map((patch: any, i: number) => ({
          id: `${generateId()}-prop-${i}`,
          patches: [patch],
          description: data.explanation || 'Proposed change',
          confidence: data.confidence || 'medium',
          status: 'pending' as const,
          createdAt: Date.now(),
        }));

        const assistantMsg: ConversationMessage = {
          id: generateId(),
          role: 'assistant',
          content: data.explanation || 'Here are my suggestions:',
          timestamp: Date.now(),
          patches: proposals.length > 0 ? proposals : undefined,
        };

        dispatch({ type: 'ADD_MESSAGE', payload: assistantMsg });
      } else {
        // Fall back to streaming chat
        const streamRes = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content, pmlSnippet: pmlSnippet ?? '' }),
          signal: abortRef.current.signal,
        });

        if (!streamRes.ok) {
          const err = await streamRes.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(err.error || `Request failed (${streamRes.status})`);
        }

        // Read the streaming response
        const reader = streamRes.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullText = '';

        // Add a placeholder assistant message that we'll update
        const assistantMsgId = generateId();
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
          },
        });

        // Read stream chunks
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;

          // Update the message content
          dispatch({
            type: 'UPDATE_MESSAGE_CONTENT',
            payload: { messageId: assistantMsgId, content: fullText },
          });
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to get AI response' });
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  }, []);

  const acceptProposal = useCallback((proposalId: string) => {
    dispatch({ type: 'UPDATE_PROPOSAL', payload: { proposalId, status: 'applied' } });
  }, []);

  const rejectProposal = useCallback((proposalId: string) => {
    dispatch({ type: 'UPDATE_PROPOSAL', payload: { proposalId, status: 'rejected' } });
  }, []);

  const clearConversation = useCallback(() => {
    dispatch({ type: 'CLEAR_CONVERSATION' });
  }, []);

  const setMode = useCallback((mode: AssistantMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  const startInterview = useCallback(async (pmlSnippet?: string) => {
    // Add welcome message
    const welcomeMsg: ConversationMessage = {
      id: generateId(),
      role: 'assistant',
      content: pmlSnippet?.trim()
        ? `I've reviewed your process model. I can see it has structure already. What would you like to improve or add? I can help with:
• Identifying missing actors or tasks
• Checking flow completeness
• Suggesting metadata (risks, SLAs, KPIs)
• Refining decision points`
        : "I'm your AI modelling assistant. I can help you build a process model from scratch.\n\nTell me about the process you want to model. What actors are involved? What triggers it? What are the key steps?",
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: welcomeMsg });

    // If there's existing PML, analyse it
    if (pmlSnippet?.trim()) {
      dispatch({ type: 'SET_PROCESSING', payload: true });
      try {
        const response = await fetch('/api/ai/propose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Analyse this process model for completeness and quality. List any gaps or issues.',
            pmlSnippet,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.explanation || (data.patches?.length ?? 0) > 0) {
            const analysisMsg: ConversationMessage = {
              id: generateId(),
              role: 'assistant',
              content: data.explanation || 'Here are my observations:',
              timestamp: Date.now(),
              patches: (data.patches || []).map((patch: any, i: number) => ({
                id: `${generateId()}-prop-${i}`,
                patches: [patch],
                description: data.explanation || 'Suggested improvement',
                confidence: data.confidence || 'medium',
                status: 'pending' as const,
                createdAt: Date.now(),
              })),
            };
            dispatch({ type: 'ADD_MESSAGE', payload: analysisMsg });
          }
        }
      } catch {
        // Silently fail — the welcome message is enough
      } finally {
        dispatch({ type: 'SET_PROCESSING', payload: false });
      }
    }
  }, []);

  return (
    <ConversationContext.Provider value={{ state, sendMessage, acceptProposal, rejectProposal, clearConversation, setMode, startInterview }}>
      {children}
    </ConversationContext.Provider>
  );
}
