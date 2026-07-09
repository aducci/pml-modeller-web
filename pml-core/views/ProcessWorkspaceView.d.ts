import React from 'react';
import { ProcessController } from '../controllers/ProcessController';
import { WorkspaceState } from '../types';
export interface ProcessWorkspaceViewProps {
    controller: ProcessController;
    state: WorkspaceState;
    onNavigateAdmin: () => void;
    /** Active workspace mode — 'editor' shows the PML editor + canvas, 'ai-assistant' shows conversation panel + canvas */
    mode?: 'editor' | 'ai-assistant';
    /** Callback when workspace mode changes */
    onModeChange?: (mode: 'editor' | 'ai-assistant') => void;
    /** Optional AI assistant panel rendered in the left slot when mode='ai-assistant' */
    aiAssistantPanel?: React.ReactNode;
}
export declare const ProcessWorkspaceView: React.FC<ProcessWorkspaceViewProps>;
//# sourceMappingURL=ProcessWorkspaceView.d.ts.map