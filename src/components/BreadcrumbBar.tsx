import React from 'react';
import { ChevronLeft, X } from 'lucide-react';

export interface BreadcrumbBarProps {
  trail: Array<{ processName: string }>;
  currentProcess: string;
  pinnedActor: string | null;
  processInterfacesOn: boolean;
  onNavigateTo: (index: number) => void;
  onUnpinActor: () => void;
}

// TODO: Connect process interface clicks to navigateToProcess in ProcessController
// TODO: Fetch linked process content when breadcrumb item is clicked
export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({
  trail,
  currentProcess,
  pinnedActor,
  processInterfacesOn,
  onNavigateTo,
  onUnpinActor,
}) => {
  const maxVisible = 5;
  const visibleItems = trail.slice(-maxVisible);
  const hasOverflow = trail.length > maxVisible;

  return (
    <div style={{
      height: 28,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      background: '#F8FAFC',
      borderBottom: '1px solid #E5E7EB',
      fontSize: 12,
      gap: 4,
    }}>
      <span style={{ color: '#94A3B8', fontSize: 10 }}>🗺</span>
      
      {hasOverflow && (
        <span style={{ color: '#94A3B8', cursor: 'pointer', fontSize: 12 }}>…</span>
      )}

      {visibleItems.map((item, index) => {
        const actualIndex = trail.length - visibleItems.length + index;
        const isCurrent = index === visibleItems.length - 1 || item.processName === currentProcess;
        
        return isCurrent ? (
          <span
            key={actualIndex}
            style={{
              color: '#1E293B',
              fontWeight: 500,
              cursor: 'default',
            }}
          >
            {item.processName}
          </span>
        ) : (
          <button
            key={actualIndex}
            onClick={() => onNavigateTo(actualIndex)}
            style={{
              background: 'none',
              border: 'none',
              color: '#6366F1',
              cursor: 'pointer',
              padding: '0 2px',
              fontSize: 12,
            }}
            onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; e.currentTarget.style.color = '#4338CA'; }}
            onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; e.currentTarget.style.color = '#6366F1'; }}
          >
            {item.processName}
          </button>
        );
      })}

      {processInterfacesOn && (
        <span
          style={{
            padding: '2px 8px',
            fontSize: 10,
            background: '#EEF2FF',
            color: '#6366F1',
            borderRadius: 4,
          }}
        >
          process interfaces on
        </span>
      )}

      {pinnedActor && (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            fontSize: 10,
            background: '#F1F5F9',
            color: '#334155',
            borderRadius: 4,
            marginLeft: 'auto',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#6366F1',
            }}
          />
          {pinnedActor}
          <button
            onClick={onUnpinActor}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 16,
              height: 16,
              padding: 0,
              border: 'none',
              background: 'none',
              borderRadius: 2,
              cursor: 'pointer',
              color: '#94A3B8',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#64748B'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94A3B8'; }}
          >
            <X size={10} />
          </button>
        </span>
      )}
    </div>
  );
};