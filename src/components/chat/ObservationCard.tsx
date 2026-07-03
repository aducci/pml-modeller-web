'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, HelpCircle, Lightbulb, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Observation {
  id: string;
  type: 'gap' | 'quality' | 'suggestion' | 'completeness';
  severity: 'info' | 'warning' | 'error';
  subject: string;
  description: string;
  actionable: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

interface Props {
  observation: Observation;
  onDismiss?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const typeConfig = {
  gap: { icon: HelpCircle, label: 'Missing element' },
  quality: { icon: AlertTriangle, label: 'Quality issue' },
  suggestion: { icon: Lightbulb, label: 'Suggestion' },
  completeness: { icon: CheckCircle, label: 'Complete' },
};

const severityColor = {
  info: { bg: '#EFF6FF', border: '#BFDBFE', dot: '#3B82F6', text: '#1E40AF' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B', text: '#92400E' },
  error: { bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444', text: '#991B1B' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ObservationCard({ observation, onDismiss }: Props) {
  const TypeIcon = typeConfig[observation.type].icon;
  const colors = severityColor[observation.severity];

  return (
    <div
      style={{
        marginTop: 6,
        borderRadius: 8,
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          fontSize: 11,
          color: colors.text,
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: colors.dot,
            flexShrink: 0,
          }}
        />
        <TypeIcon size={12} />
        <span>{typeConfig[observation.type].label}</span>
        <span style={{ marginLeft: 4, color: colors.text, opacity: 0.7 }}>·</span>
        <span style={{ fontWeight: 400, opacity: 0.8 }}>{observation.subject}</span>

        {onDismiss && (
          <button
            onClick={() => onDismiss(observation.id)}
            style={{
              marginLeft: 'auto',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: 2,
              color: colors.text,
              opacity: 0.5,
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Description */}
      <div style={{ padding: '0 10px 8px', fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
        {observation.description}
      </div>

      {/* Action button */}
      {observation.actionable && observation.actionLabel && (
        <div style={{ padding: '0 10px 8px' }}>
          <button
            onClick={observation.onAction}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 6,
              border: 'none',
              background: colors.dot,
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: 0.9,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.9'; }}
          >
            {observation.actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
