'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import type { PmlPatch } from 'pml-core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MessageRole = 'user' | 'assistant' | 'system';

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

    // Call /api/ai/propose for structured patches
    try {
      abortRef.current = new AbortController();
      const response = await fetch('/api/ai/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, pmlSnippet: pmlSnippet ?? '' }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `Request failed (${response.status})`);
      }

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

  return (
    <ConversationContext.Provider value={{ state, sendMessage, acceptProposal, rejectProposal, clearConversation, setMode }}>
      {children}
    </ConversationContext.Provider>
  );
}
