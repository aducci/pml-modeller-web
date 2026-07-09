import React from 'react';
import { ProcessDiagnostic } from '../core/diagnostics';
export interface PmlEditorRef {
    revealLine: (line: number) => void;
}
export interface PmlEditorViewProps {
    content: string;
    onChange: (content: string) => void;
    diagnostics?: ProcessDiagnostic[];
}
export declare const PmlEditorView: React.ForwardRefExoticComponent<PmlEditorViewProps & React.RefAttributes<PmlEditorRef | null>>;
//# sourceMappingURL=PmlEditorView.d.ts.map