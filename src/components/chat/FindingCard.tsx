'use client';

import React from 'react';
import { AlertTriangle, Eye, MessageCircle, Wrench, X } from 'lucide-react';
import type { ProcessDiagnostic } from 'pml-core';
import { useConversation, findingKey } from './ConversationContext';

interface Props {
  finding: ProcessDiagnostic;
}

const CATEGORY_LABEL: Record<string, string> = {
  structural: 'Structural',
  semantic: 'Semantic',
  completeness: 'Completeness',
  risk: 'Risk',
  quality: 'Quality',
};

/**
 * Renders one deterministic Finding (computeProcessSuggestions()'s output)
 * as an interactive card — [Show in model] [Explain] [Suggest fixes] [Dismiss]
 * — rather than the finding only ever existing as text baked into an AI
 * prompt (docs/FINAL/13_Phase_E_Findings_Drive_Canvas_Plan.md E.2, step 5).
 *
 * This finding is deterministic, rule-derived fact — not an AI guess — so it
 * always renders as "Confirmed issue" (step 6's confirmed/inferred split).
 * An AI's own interpretation riding on top of a finding (via Explain/Suggest
 * fixes) is a separate, later turn — that distinction lives in the chat
 * transcript, not on this card.
 */
export function FindingCard({ finding }: Props) {
  const { setHighlightedNodeIds, sendMessage, dismissFinding } = useConversation();
  const key = findingKey(finding);
  const nodeIds = finding.evidence?.nodeIds ?? [];
  const edgeIds = finding.evidence?.edgeIds ?? [];

  const handleShowInModel = () => {
    setHighlightedNodeIds(nodeIds.length > 0 ? nodeIds : null);
  };

  // Both Explain and Suggest fixes reuse the same sendMessage/mode:'review'
  // path and scope the turn to this finding's evidence — the same wiring
  // E.1 already built for canvas highlighting, not a second focus mechanism.
  const handleExplain = () => {
    handleShowInModel();
    sendMessage(
      `Explain this finding in more detail: ${finding.message}`,
      undefined,
      { mode: 'review', focusType: nodeIds.length > 0 ? 'actor' : 'full', source: 'review-finding' }
    );
  };

  const handleSuggestFixes = () => {
    handleShowInModel();
    sendMessage(
      `Suggest one or more concrete fixes for this finding: ${finding.message}`,
      undefined,
      { mode: 'review', focusType: nodeIds.length > 0 ? 'actor' : 'full', source: 'review-finding' }
    );
  };

  return (
    <div style={{
      marginBottom: 8,
      borderRadius: 10,
      border: '1px solid #FDE68A',
      background: '#FFFBEB',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 12px',
        borderBottom: '1px solid #FDE68A',
        fontSize: 11, color: '#92400E',
      }}>
        <AlertTriangle size={13} />
        <span style={{ fontWeight: 700 }}>Confirmed issue</span>
        {finding.category && (
          <span style={{
            marginLeft: 4, padding: '1px 6px', borderRadius: 4,
            background: '#FEF3C7', fontSize: 10, fontWeight: 600,
          }}>
            {CATEGORY_LABEL[finding.category] ?? finding.category}
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#B45309' }}>{finding.code}</span>
      </div>

      {/* Message */}
      <div style={{ padding: '10px 12px', fontSize: 13, color: '#78350F', lineHeight: 1.5 }}>
        {finding.message}
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', gap: 6, padding: '6px 12px 8px',
        borderTop: '1px solid #FEF3C7', flexWrap: 'wrap',
      }}>
        <button
          onClick={handleShowInModel}
          disabled={nodeIds.length === 0 && edgeIds.length === 0}
          style={actionButtonStyle('#4338CA', '#EEF2FF', '#C7D2FE')}
        >
          <Eye size={12} /> Show in model
        </button>
        <button onClick={handleExplain} style={actionButtonStyle('#374151', '#fff', '#E5E7EB')}>
          <MessageCircle size={12} /> Explain
        </button>
        <button onClick={handleSuggestFixes} style={actionButtonStyle('#374151', '#fff', '#E5E7EB')}>
          <Wrench size={12} /> Suggest fixes
        </button>
        <button onClick={() => dismissFinding(key)} style={actionButtonStyle('#9CA3AF', '#fff', '#E5E7EB')}>
          <X size={12} /> Dismiss
        </button>
      </div>
    </div>
  );
}

function actionButtonStyle(color: string, background: string, borderColor: string): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '4px 8px', borderRadius: 6,
    border: `1px solid ${borderColor}`, background, color,
    fontSize: 11, fontWeight: 600, cursor: 'pointer',
  };
}
