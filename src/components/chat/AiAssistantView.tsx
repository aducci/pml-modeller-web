'use client';

import React, { useState, useCallback } from 'react';
import {
  Bot, PanelRightClose, PanelRightOpen,
  MessageSquare, Lightbulb, FileCode, X,
} from 'lucide-react';
import { applyPatches, generatePml } from 'pml-core';
import type { ProcessController, WorkspaceState } from 'pml-core';
import { ChatPanel } from './ChatPanel';
import { ConversationProvider, useConversation } from './ConversationContext';

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
  const { sendMessage, focusType, focusId } = useConversation();
  const [showPmlSource, setShowPmlSource] = useState(false);
  const [showObservations, setShowObservations] = useState(true);

  // Keep the canvas visually scoped to whatever the AI conversation is
  // currently focused on. `viewAsActor` is a transient rendering convenience
  // (see PML_DSL/docs/FINAL/06_AI_Modelling_Engine.md, Principle 8) — it is
  // derived fresh from the current focus every render, never persisted.
  // Only 'actor' focus has a direct canvas primitive today; decision/flow-path
  // scoping would need a new equivalent and is left for a follow-up.
  React.useEffect(() => {
    controller.updateViewPanel({
      viewAsActor: focusType === 'actor' && focusId ? focusId : null,
    });
  }, [controller, focusType, focusId]);

  const pmlSnippet = state.pmlContent || '';
  const nodeCount = state.layoutResult?.nodes?.filter((n: any) => n.x !== undefined).length ?? 0;
  const hasModel = nodeCount > 0;

  const handleProposalAccept = useCallback((patches: any[]): { success: boolean; error?: string } => {
    if (!patches.length || !state.pmlContent) {
      return { success: false, error: 'No patches to apply' };
    }

    try {
      const result = applyPatches(state.pmlContent, patches);
      if (result.success && result.pml) {
        controller.setPmlContent(result.pml);
        return { success: true };
      }
      return { success: false, error: result.error || 'Failed to apply changes' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply changes';
      console.error('Error applying patches:', err);
      return { success: false, error: message };
    }
  }, [state.pmlContent, controller]);

  // Compute initial observations
  const observations = React.useMemo(() => {
    const obs: Array<{ type: string; severity: string; label: string; description: string }> = [];
    if (!hasModel) return obs;

    const nodes: any[] = state.layoutResult?.nodes ?? [];
    const edges: any[] = state.layoutResult?.edges ?? [];

    // Check for unassigned nodes
    const unassigned = nodes.filter((n: any) => !n.actor && n.type === 'task');
    if (unassigned.length > 0) {
      obs.push({
        type: 'gap', severity: 'warning', label: 'Unassigned tasks',
        description: `${unassigned.length} task${unassigned.length > 1 ? 's' : ''} ha${unassigned.length > 1 ? 've' : 's'} no actor assigned.`,
      });
    }

    // Check for missing outbound event
    const hasOutbound = nodes.some((n: any) => n.type === 'event' && n.metadata?.direction === 'outbound');
    if (!hasOutbound) {
      obs.push({
        type: 'quality', severity: 'warning', label: 'No outbound event',
        description: 'Your process has no defined end. Consider adding an outbound event.',
      });
    }

    // Check node count
    if (nodeCount <= 2) {
      obs.push({
        type: 'gap', severity: 'info', label: 'Simple process',
        description: 'Only 2 nodes identified. You may want to add more detail.',
      });
    }

    return obs;
  }, [state.layoutResult, hasModel, nodeCount]);

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
          {observations.length > 0 && (
            <span style={{
              width: 16, height: 16, borderRadius: '50%',
              background: '#F59E0B', color: '#fff',
              fontSize: 9, fontWeight: 700, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {observations.length}
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
          <span>Quality: <span style={{ fontWeight: 600, color: observations.length === 0 ? '#059669' : '#F59E0B' }}>
            {observations.length === 0 ? '✓ Complete' : `${observations.length} issue${observations.length > 1 ? 's' : ''}`}
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
          {/* Observations banner */}
          {showObservations && observations.length > 0 && (
            <div style={{
              padding: '8px 12px', borderBottom: '1px solid #E5E7EB',
              background: '#FFFBEB', display: 'flex', flexWrap: 'wrap', gap: 6,
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#92400E', width: '100%', marginBottom: 2 }}>
                <Lightbulb size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Model observations
              </span>
              {observations.map((obs, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 8px', borderRadius: 4,
                  background: obs.severity === 'warning' ? '#FEF2C7' : '#EFF6FF',
                  border: '1px solid', borderColor: obs.severity === 'warning' ? '#FDE68A' : '#BFDBFE',
                  fontSize: 11, color: obs.severity === 'warning' ? '#92400E' : '#1E40AF',
                }}>
                  {obs.label}
                </div>
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
