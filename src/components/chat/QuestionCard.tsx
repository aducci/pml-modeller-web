'use client';

import React from 'react';
import { HelpCircle, Check } from 'lucide-react';
import type { ClarifyingQuestion } from './ConversationContext';
import { useConversation } from './ConversationContext';

interface Props {
  messageId: string;
  question: ClarifyingQuestion;
  pmlSnippet?: string;
}

/**
 * Renders a clarifying, fixed-choice question the AI asked instead of
 * guessing at business intent (docs/FINAL/13_Phase_E_Findings_Drive_Canvas_Plan.md
 * E.3) — buttons, not a text input, so the answer is unambiguous. Selecting
 * an option calls answerQuestion(), which records the choice on this
 * message and re-sends it as the next turn.
 */
export function QuestionCard({ messageId, question, pmlSnippet }: Props) {
  const { answerQuestion } = useConversation();
  const answered = Boolean(question.answeredWith);

  return (
    <div style={{
      marginTop: 8,
      borderRadius: 10,
      border: '1px solid #C7D2FE',
      background: '#EEF2FF',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 12px',
        fontSize: 13, color: '#3730A3', fontWeight: 600,
      }}>
        <HelpCircle size={14} />
        {question.prompt}
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '0 12px 10px', flexWrap: 'wrap' }}>
        {question.options.map((option) => {
          const isChosen = question.answeredWith === option;
          return (
            <button
              key={option}
              disabled={answered}
              onClick={() => answerQuestion(messageId, option, pmlSnippet)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 10px', borderRadius: 6,
                border: `1px solid ${isChosen ? '#4338CA' : '#C7D2FE'}`,
                background: isChosen ? '#4338CA' : '#fff',
                color: isChosen ? '#fff' : '#3730A3',
                fontSize: 12, fontWeight: 600,
                cursor: answered ? 'default' : 'pointer',
                opacity: answered && !isChosen ? 0.5 : 1,
              }}
            >
              {isChosen && <Check size={12} />}
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
