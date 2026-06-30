'use client';

import React from 'react';
import { FileCode, Bot } from 'lucide-react';

export type WorkspaceMode = 'editor' | 'ai-assistant';

interface Props {
  mode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
}

export function ConversationTabBar({ mode, onModeChange }: Props) {
  const tabs: Array<{ id: WorkspaceMode; label: string; icon: React.ReactNode }> = [
    { id: 'editor', label: 'Editor', icon: <FileCode size={13} /> },
    { id: 'ai-assistant', label: 'AI Assistant', icon: <Bot size={13} /> },
  ];

  return (
    <div style={{ display: 'flex', gap: 0, marginLeft: 16 }}>
      {tabs.map((tab) => {
        const isActive = mode === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onModeChange(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', fontSize: 12, fontWeight: isActive ? 600 : 400,
              color: isActive ? '#6366F1' : '#6B7280',
              background: isActive ? '#EEF2FF' : 'transparent',
              border: '1px solid',
              borderColor: isActive ? '#C7D2FE' : 'transparent',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              transition: 'all 0.12s',
              position: 'relative',
              bottom: -1,
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.color = '#374151';
                e.currentTarget.style.background = '#F3F4F6';
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.color = '#6B7280';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
