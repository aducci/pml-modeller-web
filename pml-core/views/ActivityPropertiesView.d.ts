import React from 'react';
import { SelectedElement } from '../types';
import { NormalizedEdge, CatalogEntry } from '../core/normalizedGraph';
type UpdateNodeFn = (nodeId: string, property: 'label' | 'metadata' | 'gatewayKind' | 'eventType', value: string | Record<string, any>) => void;
export interface ActivityPropertiesViewProps {
    selectedElement: SelectedElement;
    elementData?: any | null;
    allNodes?: Array<{
        id: string;
        label: string;
    }>;
    allEdges?: NormalizedEdge[];
    /** app_registry catalog entries — drives the Application field's dropdown of known apps. */
    appCatalog?: CatalogEntry[];
    onClose: () => void;
    onUpdateNode?: UpdateNodeFn;
    onRenameNode?: (oldId: string, newId: string) => boolean;
    onAddOutcome?: (decisionId: string, name: string, target: string) => void;
    onUpdateOutcome?: (decisionId: string, name: string, patch: {
        name?: string;
        target?: string;
        primary?: boolean;
        loop?: boolean;
    }) => void;
    onRemoveOutcome?: (decisionId: string, name: string) => void;
    onSelectNode?: (nodeId: string) => void;
    /** Adds (or updates the description of) an app_registry entry — used by the "new app" affordance. */
    onAddAppCatalogEntry?: (id: string, description: string) => void;
}
export declare const ActivityPropertiesView: React.FC<ActivityPropertiesViewProps>;
export {};
//# sourceMappingURL=ActivityPropertiesView.d.ts.map