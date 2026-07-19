'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef, useState } from 'react';
import { parsePml, computeProcessSuggestions } from 'pml-core';
import type { PmlPatch } from 'pml-core';
import { emit, newTurnId } from '@/lib/ai/eventLog';

// Coverage-driven interview lookup (docs/FINAL/07_AI_Engine_Review_and_Enhancements.md
// §7.5 step 3): most-severe-first ordering over computeProcessSuggestions'
// codes. Not stored anywhere — recomputed fresh against the current PML on
// every startInterview() call, per docs/FINAL/06_AI_Modelling_Engine.md §5's
// "coverage is a query against the validator, not a second store" decision.
const SUGGESTION_PRIORITY = [
  'OUTBOUND_HAS_OUTGOING',
  'INBOUND_HAS_INCOMING',
  'NODE_ORPHANED',
  'TASK_NO_ACTOR',
  'DECISION_SINGLE_OUTCOME',
  'IMPLICIT_PARALLEL_FORK',
];

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
  /**
   * 'superseded' added for the control-plane reconciliation case
   * (11_...md §3.4, §4.4) — a proposal that lost a conflict to a direct
   * user edit is marked superseded, not silently deleted. Not yet produced
   * anywhere (that's Phase E's reconciliation protocol); the value exists
   * now so PatchProposal doesn't need a second status migration later.
   */
  status: 'pending' | 'applied' | 'rejected' | 'modified' | 'failed' | 'superseded';
  createdAt: number;
  /** Set when status is 'failed' — why applyPatches/validation rejected it. */
  error?: string;
  /**
   * The mode this proposal was created under (12_AI_Layer_Reconciliation_and_Build_Plan.md
   * Phase C) — the control plane's authorize() step checks this at commit
   * time rather than trusting the caller. Every existing creation site
   * (sendMessage, startInterview) only ever ran under a propose-capable
   * mode, since Explore mode never reaches this code path at all (Phase B) —
   * defaults to 'point-edit' below as the closest-to-accurate label for
   * proposals created before this field existed.
   */
  mode: TurnMode;
  /** The turn (eventLog.newTurnId()) this proposal was produced by — lets
   *  commit-time events (Phase D) attribute back to the turn that started
   *  it, not just the proposal id. */
  turnId: string;
  /**
   * The PML text this proposal's patches were generated against, captured
   * at creation time — lets the control plane detect at commit time
   * whether the user made a direct edit in the meantime (13_Phase_E_Findings_Drive_Canvas_Plan.md
   * E.4's reconciliation protocol, 11_...md §3.4). If the live PML at
   * Accept time still matches this snapshot, nothing changed underneath the
   * proposal; if it differs, the control plane diffs to find the actual
   * conflicting node(s) rather than assuming the whole proposal is stale.
   */
  originalPml: string;
}

/**
 * A clarifying, fixed-choice question attached to an assistant message
 * (docs/FINAL/13_Phase_E_Findings_Drive_Canvas_Plan.md E.3) — the AI asks
 * before guessing at business intent the graph doesn't encode, instead of
 * jumping straight to patches. Rendered as buttons; selecting one re-sends
 * it as the next sendMessage call rather than the user retyping the answer.
 */
export interface ClarifyingQuestion {
  prompt: string;
  options: string[];
  /** Set once the user picks an option — the question stays visible but disabled/answered. */
  answeredWith?: string;
}

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  patches?: PatchProposal[];
  observations?: ModelObservation[];
  question?: ClarifyingQuestion;
}

/** Focus type for scoping AI context to a subgraph window. */
export type GraphFocusType = 'actor' | 'decision' | 'flow-path' | 'full';

// ---------------------------------------------------------------------------
// TurnIntent — explicit mode/scope envelope, resolved before any AI call.
//
// Replaces inferring "what kind of turn is this" from which button was
// clicked or whether structured output happened to validate — see
// docs/FINAL/11_AI_Conversational_Layer_Discussion.md §3.2 (this reverses an
// earlier idea, in the same doc's v3, of letting the model's own tool-call
// sequence signal intent — that still left an implicit classification
// problem inside the LLM's judgement). Per
// docs/FINAL/12_AI_Layer_Reconciliation_and_Build_Plan.md Phase B, this is a
// refactor of behavior that already exists informally (startInterview(),
// the "Review this model" button, and free-text sendMessage() each already
// construct an implicit intent today) — not new capability from zero.
// ---------------------------------------------------------------------------

export type TurnMode = 'explore' | 'interview' | 'review' | 'point-edit' | 'sign-off';

export interface TurnScope {
  type: 'document' | 'subgraph' | 'node' | 'selection';
  ids?: string[];
}

export interface TurnIntent {
  mode: TurnMode;
  scope: TurnScope;
  userMessage: string;
  source: 'chat' | 'canvas' | 'heuristic' | 'review-finding';
}

/**
 * Fixed per-mode permission table (11_...md §3.1) — autonomy is attached to
 * the mode, not decided dynamically by the model. `sign-off` isn't wired to
 * anything yet (Vision F, still not started) but is listed here so the
 * table is complete and doesn't need a second migration when it is.
 */
const MODE_PERMISSIONS: Record<TurnMode, { canPropose: boolean; canCommit: 'never' | 'requires-approval' }> = {
  explore: { canPropose: false, canCommit: 'never' },
  interview: { canPropose: true, canCommit: 'requires-approval' },
  review: { canPropose: true, canCommit: 'requires-approval' },
  'point-edit': { canPropose: true, canCommit: 'requires-approval' },
  'sign-off': { canPropose: true, canCommit: 'requires-approval' },
};

export function canModePropose(mode: TurnMode): boolean {
  return MODE_PERMISSIONS[mode].canPropose;
}

export interface ConversationState {
  id: string;
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
  | { type: 'UPDATE_PROPOSAL'; payload: { proposalId: string; status: PatchProposal['status']; error?: string } }
  | { type: 'ANSWER_QUESTION'; payload: { messageId: string; answer: string } }
  | { type: 'CLEAR_CONVERSATION' };

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
      // Only rebuild the message that actually contains the target
      // proposal, and only rebuild that message's `patches` array — every
      // other message (and every other proposal in this one) keeps its
      // existing object/array references. This used to rebuild every
      // message's `patches` array unconditionally on every dispatch; that
      // was harmless while nothing reacted to reference identity, but
      // PatchProposalCard's highlight effect (13_Phase_E_Findings_Drive_Canvas_Plan.md
      // E.4) depends on `proposal.patches`, so an unrelated Accept/Reject
      // elsewhere in the conversation was spuriously re-firing the effect
      // on every *other* still-pending proposal's card, which called
      // setHighlightedNodeIds with a new array, which triggered
      // controller.updateViewPanel unconditionally, re-rendering the whole
      // subscriber tree and re-triggering the same cards again — a
      // sustained re-render loop that froze the page on Apply.
      return {
        ...state,
        messages: state.messages.map((msg) => {
          if (!msg.patches?.some((p) => p.id === action.payload.proposalId)) return msg;
          return {
            ...msg,
            patches: msg.patches.map((p) =>
              p.id === action.payload.proposalId
                ? { ...p, status: action.payload.status, error: action.payload.error }
                : p
            ),
          };
        }),
      };
    case 'ANSWER_QUESTION':
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.messageId && msg.question
            ? { ...msg, question: { ...msg.question, answeredWith: action.payload.answer } }
            : msg
        ),
      };
    case 'CLEAR_CONVERSATION':
      return createInitialState();
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
  sendMessage: (content: string, pmlSnippet?: string, options?: {
    mode?: TurnMode;
    focusType?: GraphFocusType;
    focusId?: string;
    source?: TurnIntent['source'];
  }) => Promise<void>;
  acceptProposal: (proposalId: string) => void;
  failProposal: (proposalId: string, error: string) => void;
  rejectProposal: (proposalId: string) => void;
  /**
   * Records the chosen option on a clarifying question's message, then
   * re-sends it as the next sendMessage call with the same mode/scope
   * (13_Phase_E_Findings_Drive_Canvas_Plan.md E.3, step 9) — the model gets
   * the answer as unambiguous context on the next turn rather than the
   * user having to retype it as prose.
   */
  answerQuestion: (messageId: string, answer: string, pmlSnippet?: string, mode?: TurnMode, focusType?: GraphFocusType, focusId?: string) => void;
  clearConversation: () => void;
  setFocus: (type: GraphFocusType, id: string) => void;
  startInterview: (pmlSnippet?: string) => void;
  focusType: GraphFocusType;
  focusId: string | null;
  /**
   * Node-set spotlight driven by a Finding's evidence (13_Phase_E_Findings_Drive_Canvas_Plan.md
   * E.1) — distinct from focusType/focusId, which scope the AI's *context
   * window* (actor/decision/flow-path). This scopes what's *visually
   * highlighted* on the canvas, independent of the AI's reasoning scope —
   * a finding can highlight a small evidence set while the AI still reasons
   * over the full document. Set via setHighlightedNodeIds(null) to clear.
   */
  highlightedNodeIds: string[] | null;
  setHighlightedNodeIds: (nodeIds: string[] | null) => void;
  /**
   * Client-side-only dismiss tracking for findings (13_Phase_E_Findings_Drive_Canvas_Plan.md
   * E.2, step 5) — findings are recomputed fresh from computeProcessSuggestions
   * on every render (same "coverage is a query, not a store" principle
   * SUGGESTION_PRIORITY above already follows), not persisted objects with
   * stable ids, so "dismissed" is tracked by a finding's identity key
   * (findingKey() below) rather than a mutable status field on a stored
   * object. Does not survive a page reload — consistent with conversation
   * persistence being out of scope (12_AI_Layer_Reconciliation_and_Build_Plan.md).
   */
  dismissedFindingKeys: ReadonlySet<string>;
  dismissFinding: (key: string) => void;
}

/** Stable identity for a finding across recomputation — code + evidence, not
 *  an object identity (there isn't one; findings are recomputed fresh). */
export function findingKey(finding: { code: string; data?: Record<string, unknown> }): string {
  const nodeId = finding.data?.nodeId as string | undefined;
  const edgeId = finding.data?.edgeId as string | undefined;
  return `${finding.code}:${nodeId ?? ''}:${edgeId ?? ''}`;
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
  const [focusType, setFocusType] = useState<GraphFocusType>('full');
  const [focusId, setFocusId] = useState<string | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[] | null>(null);
  const [dismissedFindingKeys, setDismissedFindingKeys] = useState<ReadonlySet<string>>(new Set());

  const dismissFinding = useCallback((key: string) => {
    setDismissedFindingKeys((prev) => new Set(prev).add(key));
  }, []);

  const setFocus = useCallback((type: GraphFocusType, id: string) => {
    setFocusType(type);
    setFocusId(id);
  }, []);

  const sendMessage = useCallback(async (content: string, pmlSnippet?: string, options?: {
    mode?: TurnMode;
    focusType?: GraphFocusType;
    focusId?: string;
    source?: TurnIntent['source'];
  }) => {
    if (!content.trim()) return;

    // Determine effective focus scope
    const effectiveFocusType = options?.focusType || focusType;
    const effectiveFocusId = options?.focusId || focusId;

    // Explicit TurnIntent envelope (11_...md §3.2) — mode defaults to
    // 'point-edit' since that's today's de facto behavior for a free-text
    // message with no mode specified (the pre-Phase-B call sites: typing in
    // the chat input, or a canvas selection + instruction). Callers that
    // want Explore/Review/Interview/Sign-off pass `mode` explicitly instead
    // of it being inferred from message content or route-fallback behavior.
    const intent: TurnIntent = {
      mode: options?.mode ?? 'point-edit',
      scope: effectiveFocusType && effectiveFocusType !== 'full'
        ? { type: 'subgraph', ids: effectiveFocusId ? [effectiveFocusId] : undefined }
        : { type: 'document' },
      userMessage: content,
      source: options?.source ?? 'chat',
    };

    // Event log (11_...md §4.8 / 12_...md Phase D) — one turnId per
    // sendMessage call, threaded through to the resulting PatchProposal (if
    // any) so a later commit/reject can attribute back to this turn.
    const turnId = newTurnId();
    emit({ type: 'TurnStarted', turnId, mode: intent.mode, timestamp: Date.now() });
    emit({ type: 'ContextResolved', turnId, mode: intent.mode, timestamp: Date.now(), detail: { scope: intent.scope } });

    // Build conversation history from prior turns (before this message is
    // added) so the AI has memory of what it already proposed/discussed —
    // otherwise every turn is stateless and the model can re-propose changes
    // that were already applied. Capped to the last 12 turns to bound token
    // growth. Assistant turns with a proposal card use the card's own
    // description as content, since that's set to '' in the message bubble.
    const conversationHistory = state.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content || m.patches?.[0]?.description || '',
      }))
      .filter((m) => m.content.trim().length > 0)
      .slice(-12);

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

    // Explore mode (11_...md §3.1) is read-only by construction: it never
    // calls /api/ai/propose at all, so there is no patch-producing code path
    // for it to fall into — the mode boundary is structural, not a prompt
    // instruction the model could ignore. Every other mode keeps today's
    // behavior (propose first, fall back to streaming chat on non-2xx).
    const canPropose = canModePropose(intent.mode);

    try {
      abortRef.current = new AbortController();

      if (canPropose) {
        // Build request body with optional focus scope
        const requestBody: Record<string, any> = {
          message: content,
          pmlSnippet: pmlSnippet ?? '',
          conversationHistory,
        };
        if (effectiveFocusType && effectiveFocusType !== 'full') {
          requestBody.focusType = effectiveFocusType;
          requestBody.focusId = effectiveFocusId;
        }

        const response = await fetch('/api/ai/propose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: abortRef.current.signal,
        });

        if (response.ok) {
          // Structured patch response
          const data = await response.json();

          // All patches from one AI response are one proposal (one Apply/Dismiss
          // decision for the whole change set) — not one card per patch op.
          const proposals: PatchProposal[] = (data.patches?.length ?? 0) > 0
            ? [{
                id: `${generateId()}-prop`,
                patches: data.patches,
                description: data.explanation || 'Proposed change',
                confidence: data.confidence || 'medium',
                status: 'pending' as const,
                createdAt: Date.now(),
                mode: intent.mode,
                turnId,
                originalPml: pmlSnippet ?? '',
              }]
            : [];

          if (proposals.length > 0) {
            emit({ type: 'ChangeProposed', turnId, mode: intent.mode, proposalId: proposals[0].id, timestamp: Date.now(), detail: { patchCount: proposals[0].patches.length } });
          }

          // Clarifying question (13_Phase_E_Findings_Drive_Canvas_Plan.md
          // E.3) — the model asked instead of guessing at business intent.
          // In practice this comes with an empty patches array (per the
          // prompt instruction), so proposals.length is 0 here too.
          const question: ClarifyingQuestion | undefined = data.question
            ? { prompt: data.question.prompt, options: data.question.options }
            : undefined;

          const assistantMsg: ConversationMessage = {
            id: generateId(),
            role: 'assistant',
            // When a proposal card is attached, its own description already
            // shows this same explanation — don't repeat it in the bubble too.
            content: proposals.length > 0 ? '' : (data.explanation || 'Here are my suggestions:'),
            timestamp: Date.now(),
            patches: proposals.length > 0 ? proposals : undefined,
            question,
          };

          dispatch({ type: 'ADD_MESSAGE', payload: assistantMsg });
          // A turn that produced a proposal or a clarifying question isn't
          // complete yet — it's awaiting the user's Accept/Reject (control
          // plane emits TurnComplete/TurnFailed for that) or their answer
          // (answerQuestion() starts a brand new turn with its own
          // TurnStarted, rather than resuming this one — this turn just
          // ends without a terminal event once the user acts, same as a
          // proposal never gets an explicit "turn abandoned" event either).
          // A turn that only produced prose has nothing further to wait on.
          if (proposals.length === 0 && !question) {
            emit({ type: 'TurnComplete', turnId, mode: intent.mode, timestamp: Date.now() });
          }
          dispatch({ type: 'SET_PROCESSING', payload: false });
          return;
        }
        // propose failed (non-2xx) — fall through to streaming chat below,
        // same as today's behavior.
      }

      {
        // Streaming chat — the only path for Explore mode, and the fallback
        // path for every other mode when propose fails.
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
        // Streaming chat never produces a patch proposal — the turn is
        // complete once the streamed answer finishes.
        emit({ type: 'TurnComplete', turnId, mode: intent.mode, timestamp: Date.now() });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      emit({ type: 'TurnFailed', turnId, mode: intent.mode, timestamp: Date.now(), detail: { reason: err.message } });
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to get AI response' });
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  }, []);

  const acceptProposal = useCallback((proposalId: string) => {
    dispatch({ type: 'UPDATE_PROPOSAL', payload: { proposalId, status: 'applied' } });
  }, []);

  const failProposal = useCallback((proposalId: string, error: string) => {
    dispatch({ type: 'UPDATE_PROPOSAL', payload: { proposalId, status: 'failed', error } });
  }, []);

  const rejectProposal = useCallback((proposalId: string) => {
    dispatch({ type: 'UPDATE_PROPOSAL', payload: { proposalId, status: 'rejected' } });
  }, []);

  const answerQuestion = useCallback((messageId: string, answer: string, pmlSnippet?: string, mode?: TurnMode, focusType?: GraphFocusType, focusId?: string) => {
    dispatch({ type: 'ANSWER_QUESTION', payload: { messageId, answer } });
    sendMessage(answer, pmlSnippet, { mode, focusType, focusId, source: 'chat' });
  }, [sendMessage]);

  const clearConversation = useCallback(() => {
    dispatch({ type: 'CLEAR_CONVERSATION' });
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
      const turnId = newTurnId();
      emit({ type: 'TurnStarted', turnId, mode: 'interview', timestamp: Date.now() });

      // Coverage-driven lookup: pick the single highest-priority unresolved
      // suggestion instead of asking the AI to re-derive "what's the gap"
      // from scratch on an open-ended prompt — converges the interview
      // toward one topic per turn instead of one "analyse everything" pass.
      let targetMessage = 'Analyse this process model for completeness and quality. List any gaps or issues.';
      try {
        const { graph } = parsePml(pmlSnippet, { validationMode: 'loose' });
        if (graph) {
          const suggestions = computeProcessSuggestions(graph);
          emit({ type: 'FindingsRetrieved', turnId, mode: 'interview', timestamp: Date.now(), detail: { count: suggestions.length } });
          const topSuggestion = suggestions
            .slice()
            .sort((a, b) => SUGGESTION_PRIORITY.indexOf(a.code) - SUGGESTION_PRIORITY.indexOf(b.code))[0];
          if (topSuggestion) {
            targetMessage = `Focus on this one issue only: ${topSuggestion.message} Ask me a clarifying question about it if the fix isn't obvious from context, or propose a fix directly if it is. Don't raise any other issues this turn.`;
            const nodeId = topSuggestion.data?.nodeId as string | undefined;
            const node = nodeId ? graph.nodes.find((n: any) => n.id === nodeId) : undefined;
            if (node?.actor) setFocus('actor', node.actor);
          }
        }
      } catch {
        // Fall through with the generic analysis message — a parse failure
        // here shouldn't block the interview from starting.
      }

      try {
        const response = await fetch('/api/ai/propose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: targetMessage,
            pmlSnippet,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.explanation || (data.patches?.length ?? 0) > 0) {
            const hasPatches = (data.patches?.length ?? 0) > 0;
            const analysisMsg: ConversationMessage = {
              id: generateId(),
              role: 'assistant',
              content: hasPatches ? '' : (data.explanation || 'Here are my observations:'),
              timestamp: Date.now(),
              patches: hasPatches
                ? [{
                    id: `${generateId()}-prop`,
                    patches: data.patches,
                    description: data.explanation || 'Suggested improvement',
                    confidence: data.confidence || 'medium',
                    status: 'pending' as const,
                    createdAt: Date.now(),
                    mode: 'interview' as const,
                    turnId,
                    originalPml: pmlSnippet,
                  }]
                : undefined,
            };
            if (hasPatches) {
              emit({ type: 'ChangeProposed', turnId, mode: 'interview', proposalId: analysisMsg.patches![0].id, timestamp: Date.now(), detail: { patchCount: data.patches.length } });
            } else {
              // Prose-only turn (no proposal to await Accept/Reject on) completes now.
              emit({ type: 'TurnComplete', turnId, mode: 'interview', timestamp: Date.now() });
            }
            dispatch({ type: 'ADD_MESSAGE', payload: analysisMsg });
          } else {
            emit({ type: 'TurnComplete', turnId, mode: 'interview', timestamp: Date.now() });
          }
        }
      } catch (err: any) {
        // Silently fail — the welcome message is enough
        emit({ type: 'TurnFailed', turnId, mode: 'interview', timestamp: Date.now(), detail: { reason: err?.message } });
      } finally {
        dispatch({ type: 'SET_PROCESSING', payload: false });
      }
    }
  }, []);

  return (
    <ConversationContext.Provider value={{ state, sendMessage, acceptProposal, failProposal, rejectProposal, answerQuestion, clearConversation, setFocus, startInterview, focusType, focusId, highlightedNodeIds, setHighlightedNodeIds, dismissedFindingKeys, dismissFinding }}>
      {children}
    </ConversationContext.Provider>
  );
}
