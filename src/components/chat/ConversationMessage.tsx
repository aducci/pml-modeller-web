'use client';

import React from 'react';
import { Bot, User, Sparkles } from 'lucide-react';
import type { ConversationMessage as MessageType } from './ConversationContext';
import { PatchProposalCard } from './PatchProposalCard';
import { QuestionCard } from './QuestionCard';

interface Props {
  message: MessageType;
  onAcceptProposal: (id: string) => void;
  onRejectProposal: (id: string) => void;
  pmlSnippet?: string;
}

export function ConversationMessage({ message, onAcceptProposal, onRejectProposal, pmlSnippet }: Props) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const avatar = isUser
    ? <User size={16} color="#6366F1" />
    : <Bot size={16} color="#059669" />;

  const bgColor = isUser ? '#EEF2FF' : isSystem ? '#FEF3C7' : '#FFFFFF';
  const borderColor = isUser ? '#C7D2FE' : isSystem ? '#FDE68A' : '#E5E7EB';
  const align = isUser ? 'flex-end' : 'flex-start';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align, marginBottom: 12, maxWidth: '92%', alignSelf: align }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3, padding: '0 4px' }}>
        {avatar}
        <span style={{ fontSize: 11, fontWeight: 600, color: isUser ? '#4338CA' : '#059669' }}>
          {isUser ? 'You' : isSystem ? 'System' : 'AI Assistant'}
        </span>
        <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 4 }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {message.patches && message.patches.some(p => p.confidence === 'high') && (
          <Sparkles size={10} color="#059669" />
        )}
      </div>

      {/* Message bubble */}
      <div style={{
        padding: '8px 12px',
        borderRadius: 10,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        fontSize: 13,
        lineHeight: 1.6,
        color: '#1F2937',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {message.content}

        {/* Patch proposals */}
        {message.patches?.map((proposal) => (
          <PatchProposalCard
            key={proposal.id}
            proposal={proposal}
            onAccept={onAcceptProposal}
            onReject={onRejectProposal}
          />
        ))}

        {/* Clarifying question */}
        {message.question && (
          <QuestionCard messageId={message.id} question={message.question} pmlSnippet={pmlSnippet} />
        )}
      </div>
    </div>
  );
}
