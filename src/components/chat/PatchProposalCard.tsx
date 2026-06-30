'use client';

import React from 'react';
import { Check, X, Sparkles, AlertTriangle, HelpCircle } from 'lucide-react';
import type { PatchProposal } from './ConversationContext';

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
  if (proposal.status !== 'pending') {
    const statusLabel = proposal.status === 'applied' ? 'Applied' : 'Rejected';
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
