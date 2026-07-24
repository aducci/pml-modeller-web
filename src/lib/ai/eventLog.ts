/**
 * AI Turn Event Log
 *
 * The canonical, replayable record of an AI turn — not just a rendering
 * mechanism (docs/FINAL/11_AI_Conversational_Layer_Discussion.md §4.8).
 * Extends, rather than replaces, the minimal audit log introduced in
 * controlPlane.ts (Phase C) — that log's four event kinds
 * (validated/authorized/committed/rejected) mapped onto this fuller
 * vocabulary's ActionValidated/UserApproved/ActionCommitted/TurnFailed;
 * controlPlane.ts's commit()/rejectProposal() now emit directly into *this*
 * log instead of keeping a separate one
 * (docs/FINAL/12_AI_Layer_Reconciliation_and_Build_Plan.md Phase D, step 12:
 * "no separate instrumentation path").
 *
 * Deliberately in-memory for this phase, not the unused Conversation/
 * ConversationMessage Prisma models — those are a different, still
 * deliberately-deferred concern (conversation *content* persistence); this
 * is turn *event* history, and persisting it is future work, not this phase.
 *
 * Bounded to the most recent MAX_EVENTS entries — this is in-memory and
 * process-local (a serverless instance's log is not the global log anyway),
 * so nothing reads it back for cross-request analytics today; the cap just
 * keeps a long-lived instance from growing this array forever.
 */

import type { TurnMode } from '@/components/chat/ConversationContext';

export type TurnEventType =
  | 'TurnStarted'
  | 'ContextResolved'
  | 'GraphQueried'
  | 'FindingsRetrieved'
  | 'ChangeProposed'
  | 'ActionValidated'
  | 'PreviewRendered'
  | 'UserApproved'
  | 'UserRejected'
  | 'ActionCommitted'
  | 'GraphChanged'
  | 'PatchConflictDetected'
  | 'TurnFailed'
  | 'TurnComplete';

export interface TurnEvent {
  type: TurnEventType;
  turnId: string;
  mode?: TurnMode;
  proposalId?: string;
  timestamp: number;
  /** Free-form detail specific to the event type — kept loose deliberately;
   *  this is a log, not a second schema to keep in sync with every caller. */
  detail?: Record<string, unknown>;
}

const MAX_EVENTS = 2000;
const events: TurnEvent[] = [];

let turnCounter = 0;
/** New turn id — call once per user-initiated AI turn (one sendMessage/startInterview call). */
export function newTurnId(): string {
  return `turn-${Date.now()}-${++turnCounter}`;
}

export function emit(event: TurnEvent): void {
  events.push(event);
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
}

/** Read-only snapshot of the full event log. */
export function getEventLog(): ReadonlyArray<TurnEvent> {
  return events;
}
