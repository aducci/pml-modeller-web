import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Download, MousePointer2, Hand, Eye, EyeOff } from 'lucide-react';
import { InteractionMode } from './ProcessCanvasView';

interface CanvasToolbarProps {
  zoom: number;
  interactionMode: InteractionMode;
  onSetInteractionMode: (mode: InteractionMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
  onExportSvg: () => void;
  showLanes?: boolean;
  onToggleLanes?: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  zoom, interactionMode, onSetInteractionMode,
  onZoomIn, onZoomOut, onReset, onFit, onExportSvg,
  showLanes = true, onToggleLanes,
}) => {
  return (
    <div style={{
      position: 'absolute',
      bottom: 16,
      left: 16,
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      padding: '3px 4px',
    }}>
      {/* Interaction mode toggle */}
      <ModeBtn
        active={interactionMode === 'select'}
        onClick={() => onSetInteractionMode('select')}
        title="Select mode (Space to toggle)"
      >
        <MousePointer2 size={14} />
      </ModeBtn>
      <ModeBtn
        active={interactionMode === 'pan'}
        onClick={() => onSetInteractionMode('pan')}
        title="Pan mode (Space to toggle)"
      >
        <Hand size={14} />
      </ModeBtn>

      <Divider />

      {onToggleLanes !== undefined && (
        <ModeBtn
          active={showLanes}
          onClick={onToggleLanes}
          title={showLanes ? 'Hide swimlanes' : 'Show swimlanes'}
        >
          {showLanes ? <Eye size={14} /> : <EyeOff size={14} />}
        </ModeBtn>
      )}

      <Divider />

      <Btn onClick={onZoomOut} title="Zoom out (⌘ −)"><ZoomOut size={14} /></Btn>

      <button
        onClick={onReset}
        title="Reset zoom (⌘ 0)"
        style={{
          padding: '2px 8px',
          fontSize: 11,
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 500,
          color: '#64748B',
          background: 'none',
          border: 'none',
          borderRadius: 5,
          cursor: 'pointer',
          minWidth: 44,
          textAlign: 'center',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        {Math.round(zoom * 100)}%
      </button>

      <Btn onClick={onZoomIn} title="Zoom in (⌘ +)"><ZoomIn size={14} /></Btn>

      <Divider />

      <Btn onClick={onFit} title="Fit to view (⌘ F)"><Maximize2 size={14} /></Btn>
      <Btn onClick={onReset} title="Reset view (⌘ 0)"><RotateCcw size={14} /></Btn>

      <Divider />

      <Btn onClick={onExportSvg} title="Copy SVG to clipboard"><Download size={14} /></Btn>
    </div>
  );
};

const Btn: React.FC<{ onClick: () => void; title: string; children: React.ReactNode }> = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 28,
      padding: 0,
      border: 'none',
      background: 'none',
      borderRadius: 5,
      color: '#64748B',
      cursor: 'pointer',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748B'; }}
  >
    {children}
  </button>
);

const ModeBtn: React.FC<{ active: boolean; onClick: () => void; title: string; children: React.ReactNode }> = ({ active, onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 28,
      padding: 0,
      border: 'none',
      background: active ? '#EEF2FF' : 'none',
      borderRadius: 5,
      color: active ? '#6366F1' : '#94A3B8',
      cursor: 'pointer',
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; } }}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94A3B8'; } }}
  >
    {children}
  </button>
);

const Divider = () => (
  <div style={{ width: 1, height: 16, background: '#E2E8F0', margin: '0 2px' }} />
);
