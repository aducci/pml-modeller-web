'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Trash2, AlertCircle } from 'lucide-react';
import { useConversation } from './ConversationContext';
import { ConversationMessage } from './ConversationMessage';

interface Props {
  /** Current PML snippet to provide as context for AI queries */
  pmlSnippet?: string;
  /** Called when the user accepts a proposal — receives the patches, returns whether the apply actually succeeded */
  onProposalAccept?: (patches: any[]) => { success: boolean; error?: string };
  style?: React.CSSProperties;
}

export function ChatPanel({ pmlSnippet, onProposalAccept, style }: Props) {
  const { state, sendMessage, acceptProposal, failProposal, rejectProposal, clearConversation, startInterview } = useConversation();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [state.messages]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollBtn(!isNearBottom);
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim() || state.isProcessing) return;
    sendMessage(input.trim(), pmlSnippet);
    setInput('');
  }, [input, state.isProcessing, sendMessage, pmlSnippet]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const handleAccept = useCallback((proposalId: string) => {
    const msg = state.messages.find(m => m.patches?.some(p => p.id === proposalId));
    const proposal = msg?.patches?.find(p => p.id === proposalId);
    if (!proposal || proposal.patches.length === 0) return;

    const result = onProposalAccept?.(proposal.patches);
    if (!result || result.success) {
      acceptProposal(proposalId);
    } else {
      failProposal(proposalId, result.error || 'Failed to apply changes');
    }
  }, [acceptProposal, failProposal, state.messages, onProposalAccept]);

  const handleReject = useCallback((proposalId: string) => {
    rejectProposal(proposalId);
  }, [rejectProposal]);

  // Phase 3 entry points (docs/FINAL/07_AI_Engine_Review_and_Enhancements.md
  // §7.4 step 2) — startInterview() already had the right shape (welcome
  // message + optional existing-model analysis) but no caller anywhere in
  // the app. These two buttons are that caller: one for "start fresh /
  // continue" (interview), one for "review what's here" (review).
  const handleStartInterview = useCallback(() => {
    startInterview(pmlSnippet);
  }, [startInterview, pmlSnippet]);

  const handleReviewModel = useCallback(() => {
    sendMessage('Review this process model for completeness and quality. Point out the most significant gap first.', pmlSnippet);
  }, [sendMessage, pmlSnippet]);

  const hasMessages = state.messages.length > 0;
  const isEmpty = !hasMessages && !state.isProcessing && !state.error;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#FAFBFC', ...style,
    }}>
      {/* ── Header ───────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderBottom: '1px solid #E5E7EB',
        background: '#fff',
      }}>
        <Bot size={18} color="#059669" />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', flex: 1 }}>
          AI Assistant
        </span>

        {/* Clear */}
        {hasMessages && (
          <button
            onClick={clearConversation}
            title="Clear conversation"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', borderRadius: 5,
              border: '1px solid #E5E7EB', background: '#fff',
              cursor: 'pointer', fontSize: 11, color: '#9CA3AF',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FECACA'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
          >
            <Trash2 size={12} />
            Clear
          </button>
        )}
      </div>

      {/* ── Messages ─────────────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1, overflowY: 'auto', padding: '12px 14px',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Empty state */}
        {isEmpty && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: '#9CA3AF', textAlign: 'center', padding: 24,
          }}>
            <Bot size={36} color="#D1D5DB" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>
              How can I help with your process model?
            </p>
            <p style={{ fontSize: 12, color: '#9CA3AF', maxWidth: 280, marginBottom: 16 }}>
              I can analyse your PML for completeness, suggest improvements, or help build a new model from scratch.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleStartInterview}
                style={{
                  padding: '7px 14px', borderRadius: 8, border: '1px solid #6366F1',
                  background: '#6366F1', color: '#fff', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#4F46E5'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#6366F1'; }}
              >
                Start guided interview
              </button>
              <button
                onClick={handleReviewModel}
                style={{
                  padding: '7px 14px', borderRadius: 8, border: '1px solid #E5E7EB',
                  background: '#fff', color: '#374151', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
              >
                Review this model
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {state.messages.map((msg) => (
          <ConversationMessage
            key={msg.id}
            message={msg}
            onAcceptProposal={handleAccept}
            onRejectProposal={handleReject}
          />
        ))}

        {/* Loading indicator */}
        {state.isProcessing && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', color: '#9CA3AF', fontSize: 13,
          }}>
            <div style={{ display: 'flex', gap: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D1D5DB', animation: 'pulse 1.2s infinite' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D1D5DB', animation: 'pulse 1.2s infinite 0.2s' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D1D5DB', animation: 'pulse 1.2s infinite 0.4s' }} />
            </div>
            Thinking...
          </div>
        )}

        {/* Error state */}
        {state.error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 8,
            background: '#FEF2F2', border: '1px solid #FECACA',
            color: '#DC2626', fontSize: 12,
          }}>
            <AlertCircle size={14} />
            {state.error}
          </div>
        )}
      </div>

      {/* ── Scroll-to-bottom button ──────────────────────── */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          style={{
            position: 'absolute', bottom: 64, left: '50%', transform: 'translateX(-50%)',
            padding: '4px 12px', borderRadius: 12,
            background: '#fff', border: '1px solid #E5E7EB',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            cursor: 'pointer', fontSize: 11, color: '#6B7280', zIndex: 10,
          }}
        >
          ↓ New messages
        </button>
      )}

      {/* ── Input ────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 14px',
        borderTop: '1px solid #E5E7EB', background: '#fff',
      }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your process model..."
          disabled={state.isProcessing}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            border: '1px solid #E5E7EB', fontSize: 13,
            outline: 'none', background: '#F9FAFB',
            color: '#1F2937',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.background = '#fff'; }}
          onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#F9FAFB'; }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || state.isProcessing}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 8, border: 'none',
            background: !input.trim() || state.isProcessing ? '#E5E7EB' : '#6366F1',
            color: !input.trim() || state.isProcessing ? '#9CA3AF' : '#fff',
            cursor: !input.trim() || state.isProcessing ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => {
            if (input.trim() && !state.isProcessing) e.currentTarget.style.background = '#4F46E5';
          }}
          onMouseLeave={e => {
            if (input.trim() && !state.isProcessing) e.currentTarget.style.background = '#6366F1';
          }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
