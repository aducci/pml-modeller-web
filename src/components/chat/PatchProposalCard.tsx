'use client';

import React from 'react';
import { Check, X, Sparkles, AlertTriangle, HelpCircle } from 'lucide-react';
import { useConversation, type PatchProposal } from './ConversationContext';
import { extractAffectedNodeIds } from '@/lib/ai/affectedNodes';

interface Props {
  proposal: PatchProposal;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

const confidenceConfig = {
  high: { icon: Sparkles, color: '#059669', label: 'High confidence' },
  medium: { icon: HelpCircle, color: '#D97706', label: 'Medium confidence' },
  low: { icon: AlertTriangle, color: '#DC2626', label: 'Low confidence — review needed' },
};

export function PatchProposalCard({ proposal, onAccept, onReject }: Props) {
  const { setHighlightedNodeIds } = useConversation();

  // Minimal preview effect (docs/FINAL/13_Phase_E_Findings_Drive_Canvas_Plan.md
  // E.4): while this proposal is pending, spotlight the nodes it would
  // touch using the same highlightNodeIds primitive E.1 built for Finding
  // evidence — not true ghost nodes/edges (that needs new canvas rendering
  // primitives, out of scope for this pass). Cleared once the proposal
  // resolves (Accept/Reject) or the card unmounts, so it never lingers on a
  // stale selection.
  // Depend on proposal.id + status only, not proposal.patches — the patches
  // array's *contents* for a given proposal never change after creation, but
  // its reference can (e.g. an unrelated Accept/Reject elsewhere in the
  // conversation previously rebuilt every message's patches array; that's
  // fixed now too, but this effect shouldn't re-run on reference churn
  // regardless of what the reducer does elsewhere — id+status is the actual
  // semantic trigger for "should this card be highlighting right now".
  React.useEffect(() => {
    if (proposal.status !== 'pending') return;
    const affected = extractAffectedNodeIds(proposal.patches);
    if (affected.length > 0) setHighlightedNodeIds(affected);
    return () => setHighlightedNodeIds(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposal.id, proposal.status, setHighlightedNodeIds]);

  if (proposal.status === 'failed') {
    return (
      <div style={{
        marginTop: 8, padding: '8px 12px', borderRadius: 8,
        background: '#FEF2F2', border: '1px solid #FECACA',
        fontSize: 12, color: '#DC2626',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <AlertTriangle size={14} />
          Apply failed — model unchanged
        </div>
        <div style={{ marginTop: 4, color: '#7F1D1D' }}>{proposal.error}</div>
      </div>
    );
  }

  if (proposal.status !== 'pending') {
    // 'superseded' (Phase E reconciliation, not produced anywhere yet) reads
    // as its own label rather than falling into the generic "Rejected" case
    // — a proposal superseded by a conflicting direct user edit is a
    // different outcome from the user explicitly clicking Reject.
    const statusLabel =
      proposal.status === 'applied' ? 'Applied'
      : proposal.status === 'superseded' ? 'Superseded by a manual edit'
      : 'Rejected';
    const statusColor = proposal.status === 'applied' ? '#059669' : '#9CA3AF';
    return (
      <div style={{
        marginTop: 8, padding: '8px 12px', borderRadius: 8,
        background: proposal.status === 'applied' ? '#ECFDF5' : '#F9FAFB',
        border: `1px solid ${proposal.status === 'applied' ? '#A7F3D0' : '#E5E7EB'}`,
        fontSize: 12, color: statusColor, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {proposal.status === 'applied' ? <Check size={14} /> : <X size={14} />}
        {statusLabel}: {proposal.description}
      </div>
    );
  }

  const ConfIcon = confidenceConfig[proposal.confidence].icon;
  const confColor = confidenceConfig[proposal.confidence].color;

  return (
    <div style={{
      marginTop: 8,
      borderRadius: 10,
      border: '1px solid #E5E7EB',
      background: '#fff',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 12px',
        background: '#F9FAFB',
        borderBottom: '1px solid #E5E7EB',
        fontSize: 12, color: '#6B7280',
      }}>
        <ConfIcon size={14} color={confColor} />
        <span style={{ color: confColor, fontWeight: 600 }}>{confidenceConfig[proposal.confidence].label}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9CA3AF' }}>
          {new Date(proposal.createdAt).toLocaleTimeString()}
        </span>
      </div>

      {/* Description */}
      <div style={{ padding: '10px 12px', fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
        {proposal.description}
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', gap: 6, padding: '6px 12px 8px',
        borderTop: '1px solid #F3F4F6',
      }}>
        <button
          onClick={() => onAccept(proposal.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 6, border: 'none',
            background: '#059669', color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#047857'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#059669'; }}
        >
          <Check size={13} />
          Apply
        </button>
        <button
          onClick={() => onReject(proposal.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB',
            background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#374151'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6B7280'; }}
        >
          <X size={13} />
          Dismiss
        </button>
      </div>
    </div>
  );
}
