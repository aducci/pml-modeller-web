import React from 'react';
import { ProcessDiagnostic } from '../core/diagnostics';
export interface PmlEditorRef {
    revealLine: (line: number) => void;
}
export interface PmlEditorViewProps {
    content: string;
    onChange: (content: string) => void;
    diagnostics?: ProcessDiagnostic[];
    /**
     * When provided, the folder dropdown renders this flat list instead of
     * fetching /processes/index.json (a static-file API that doesn't exist in
     * the hosted app — see 09_AI_Chat_Architecture_Findings.md-adjacent audit).
     * Leave undefined to keep the legacy /processes/* file-browser behavior
     * used by the standalone dev harness (src/App.tsx).
     */
    files?: {
        id: string;
        name: string;
    }[];
    activeFileId?: string;
    onSelectFile?: (fileId: string) => void;
    onCreateFile?: () => void;
}
export declare const PmlEditorView: React.ForwardRefExoticComponent<PmlEditorViewProps & React.RefAttributes<PmlEditorRef | null>>;
//# sourceMappingURL=PmlEditorView.d.ts.map