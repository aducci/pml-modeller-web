'use client';

import React, { useState, useCallback } from 'react';
import {
  Bot, PanelRightClose, PanelRightOpen,
  MessageSquare, Lightbulb, FileCode, X,
} from 'lucide-react';
import type { ProcessController, WorkspaceState } from 'pml-core';
import { ChatPanel } from './ChatPanel';
import { ConversationProvider, useConversation, findingKey, type TurnMode } from './ConversationContext';
import { FindingCard } from './FindingCard';
import { commit as controlPlaneCommit } from '@/lib/ai/controlPlane';
import { findUnresolvedIssues } from '@/lib/ai/findings';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  controller: ProcessController;
  state: WorkspaceState;
}

// ---------------------------------------------------------------------------
// Inner Content — wrapped in ConversationProvider
// ---------------------------------------------------------------------------

function AiAssistantContent({ controller, state }: Props) {
  const { sendMessage, focusType, focusId, highlightedNodeIds, dismissedFindingKeys } = useConversation();
  const [showPmlSource, setShowPmlSource] = useState(false);
  const [showObservations, setShowObservations] = useState(true);

  // Keep the canvas visually scoped to whatever the AI conversation is
  // currently focused on. `viewAsActor` is a transient rendering convenience
  // (see PML_DSL/docs/FINAL/06_AI_Modelling_Engine.md, Principle 8) — it is
  // derived fresh from the current focus every render, never persisted.
  // Only 'actor' focus has a direct canvas primitive today; decision/flow-path
  // scoping would need a new equivalent and is left for a follow-up.
  //
  // highlightNodeIds is the sibling primitive for Finding evidence
  // (docs/FINAL/13_Phase_E_Findings_Drive_Canvas_Plan.md E.1) — independent
  // of focusType/focusId, since a finding's evidence set is not the same
  // concept as the AI's reasoning scope (an actor/decision/flow-path
  // window). Both can be active at once; buildNodeRenderModels.ts composes
  // them (a node needs to pass both filters to render at full opacity).
  React.useEffect(() => {
    controller.updateViewPanel({
      viewAsActor: focusType === 'actor' && focusId ? focusId : null,
      highlightNodeIds: highlightedNodeIds,
    });
  }, [controller, focusType, focusId, highlightedNodeIds]);

  const pmlSnippet = state.pmlContent || '';
  const nodeCount = state.layoutResult?.nodes?.filter((n: any) => n.x !== undefined).length ?? 0;
  const hasModel = nodeCount > 0;

  const handleProposalAccept = useCallback((proposalId: string, mode: TurnMode, patches: any[], turnId: string, originalPml: string): { success: boolean; error?: string } => {
    if (!patches.length || !state.pmlContent) {
      return { success: false, error: 'No patches to apply' };
    }

    try {
      // Routes through the control plane (12_AI_Layer_Reconciliation_and_Build_Plan.md
      // Phase C) instead of calling applyPatches() directly — authorize()
      // re-checks the mode permission table and validate() dry-runs the
      // patch before controller.setPmlContent (the real document mutation)
      // is ever called. Both still ultimately call pml-core's existing
      // applyPatches(); this is composition, not a new validator. turnId
      // (Phase D) lets commit()'s emitted events attribute back to the turn
      // that produced this proposal, not just the proposal id. originalPml
      // (E.4's reconciliation protocol) lets commit() detect whether the
      // user made a conflicting direct edit while this proposal sat pending.
      const outcome = controlPlaneCommit({
        proposalId,
        mode,
        currentPml: state.pmlContent,
        patches,
        onCommit: (newPml) => controller.setPmlContent(newPml),
        turnId,
        originalPml,
      });
      return outcome;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply changes';
      console.error('Error applying patches:', err);
      return { success: false, error: message };
    }
  }, [state.pmlContent, controller]);

  // Real findings from the deterministic engine (computeProcessSuggestions
  // via findUnresolvedIssues), not the three hand-rolled ad-hoc checks this
  // used to run inline against raw layoutResult.nodes — that duplicated
  // exactly what computeProcessSuggestions already does more completely
  // (e.g. TASK_NO_ACTOR alone supersedes the old "unassigned tasks" check).
  // See docs/FINAL/13_Phase_E_Findings_Drive_Canvas_Plan.md E.2, step 4.
  const findings = React.useMemo(() => {
    if (!hasModel) return [];
    return findUnresolvedIssues(pmlSnippet).filter((f) => !dismissedFindingKeys.has(findingKey(f)));
  }, [pmlSnippet, hasModel, dismissedFindingKeys]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* ── Top toolbar ──────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 12px', borderBottom: '1px solid #E5E7EB',
        background: '#fff', flexShrink: 0,
      }}>
        <Bot size={16} color="#059669" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', flex: 1 }}>
          AI Assistant
        </span>

        {/* Toggle PML source button */}
        <button
          onClick={() => setShowPmlSource(!showPmlSource)}
          title={showPmlSource ? 'Hide PML source' : 'Show PML source'}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 8px', borderRadius: 5,
            border: '1px solid', borderColor: showPmlSource ? '#C7D2FE' : '#E5E7EB',
            background: showPmlSource ? '#EEF2FF' : '#fff',
            cursor: 'pointer', fontSize: 11,
            color: showPmlSource ? '#4338CA' : '#6B7280',
          }}
        >
          <FileCode size={13} />
          PML
        </button>

        {/* Toggle observations */}
        <button
          onClick={() => setShowObservations(!showObservations)}
          title={showObservations ? 'Hide observations' : 'Show observations'}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 8px', borderRadius: 5,
            border: '1px solid', borderColor: showObservations ? '#C7D2FE' : '#E5E7EB',
            background: showObservations ? '#EEF2FF' : '#fff',
            cursor: 'pointer', fontSize: 11,
            color: showObservations ? '#4338CA' : '#6B7280',
          }}
        >
          <Lightbulb size={13} />
          {findings.length > 0 && (
            <span style={{
              width: 16, height: 16, borderRadius: '50%',
              background: '#F59E0B', color: '#fff',
              fontSize: 9, fontWeight: 700, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {findings.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Status line — model quality ─────────────────────── */}
      {hasModel && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderBottom: '1px solid #E5E7EB',
          background: '#F9FAFB', fontSize: 11, color: '#6B7280', flexShrink: 0,
        }}>
          <span>Quality: <span style={{ fontWeight: 600, color: findings.length === 0 ? '#059669' : '#F59E0B' }}>
            {findings.length === 0 ? '✓ Complete' : `${findings.length} issue${findings.length > 1 ? 's' : ''}`}
          </span></span>
        </div>
      )}

      {/* ── Main content area ────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Left: Chat panel */}
        <div style={{
          flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Findings panel — real Finding cards (computeProcessSuggestions
              via findUnresolvedIssues), each independently actionable
              (Show in model / Explain / Suggest fixes / Dismiss), not the
              old static text-pill "observations" banner. */}
          {showObservations && findings.length > 0 && (
            <div style={{
              padding: '8px 12px', borderBottom: '1px solid #E5E7EB',
              background: '#FEFCE8', overflowY: 'auto', maxHeight: '40%',
              flexShrink: 0,
            }}>
              {findings.map((finding, i) => (
                <FindingCard key={findingKey(finding) + i} finding={finding} />
              ))}
            </div>
          )}

          {/* Chat panel */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <ChatPanel
              pmlSnippet={pmlSnippet}
              onProposalAccept={handleProposalAccept}
              style={{ border: 'none', height: '100%' }}
            />
          </div>

          {/* PML source overlay */}
          {showPmlSource && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: '#fff', zIndex: 20,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', borderBottom: '1px solid #E5E7EB',
                background: '#F9FAFB', fontSize: 12, fontWeight: 600, color: '#374151',
              }}>
                <FileCode size={14} />
                PML Source
                <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 400 }}>(read-only)</span>
                <button
                  onClick={() => setShowPmlSource(false)}
                  style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer', padding: 2, color: '#9CA3AF' }}
                >
                  <X size={14} />
                </button>
              </div>
              <pre style={{
                flex: 1, overflow: 'auto', padding: 12,
                fontSize: 12, fontFamily: 'ui-monospace, monospace',
                lineHeight: 1.6, color: '#374151', margin: 0,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {pmlSnippet || '// No PML content yet'}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public API — wraps with ConversationProvider
// ---------------------------------------------------------------------------

export function AiAssistantView({ controller, state }: Props) {
  return (
    <ConversationProvider>
      <AiAssistantContent controller={controller} state={state} />
    </ConversationProvider>
  );
}
