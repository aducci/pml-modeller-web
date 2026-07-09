import React from 'react';
import { ProcessCatalogs } from '../core/normalizedGraph';
import { OverlayCategory } from '../types';
export type { OverlayCategory };
export interface OverlayEntry {
    nodeId: string;
    label: string;
    actor: string;
    value: string;
}
export interface OverlayNodeEntry {
    nodeId: string;
    label: string;
    type: string;
    actor: string;
    metaCount: number;
}
export interface OverlayEntries {
    nodes: OverlayNodeEntry[];
    risk: OverlayEntry[];
    sla: OverlayEntry[];
    raci: OverlayEntry[];
    app: OverlayEntry[];
    businessRule: OverlayEntry[];
}
export interface ProcessDataPanelProps {
    isOpen: boolean;
    onTogglePanel: () => void;
    overlayEntries: OverlayEntries;
    activeCategory?: OverlayCategory;
    selectedNode?: {
        id: string;
        label: string;
    } | null;
    allNodes?: Array<{
        id: string;
        label: string;
    }>;
    catalogs?: ProcessCatalogs;
    onSetCategory: (category: OverlayCategory) => void;
    onAdd: (nodeId: string, category: OverlayCategory, value: string) => void;
    onEdit: (nodeId: string, category: OverlayCategory, oldValue: string, newValue: string) => void;
    onRemove: (nodeId: string, value: string) => void;
    onSelectNode: (nodeId: string) => void;
    onSetCatalogEntry: (kind: keyof ProcessCatalogs, id: string, description: string) => void;
}
export declare const ProcessDataPanel: React.FC<ProcessDataPanelProps>;
//# sourceMappingURL=ProcessDataPanel.d.ts.map