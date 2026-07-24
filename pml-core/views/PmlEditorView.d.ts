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
     * When provided, the folder dropdown shows this flat list of project
     * files (DB-backed — see pml-modeller-web's ProjectFile model). The real
     * hosted app always passes this. If omitted (e.g. the standalone dev
     * harness, src/App.tsx, which has no DB), the folder button simply
     * doesn't render — there used to be a fallback that browsed static files
     * under public/processes/*, but that folder and its dev-only save
     * endpoint were removed (the files it served are now imported into a
     * real project instead).
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