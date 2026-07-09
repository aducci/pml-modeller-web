/**
 * Activity Metadata Schema
 *
 * PML-compliant metadata properties that can be attached to activities.
 * Per spec Section 13, these are formatted as:
 *   key value
 * indented under any element declaration.
 */
export interface MetadataProperty {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'operator';
    placeholder?: string;
}
export declare const PML_METADATA_PROPERTIES: MetadataProperty[];
export type PmlMetadataKey = typeof PML_METADATA_PROPERTIES[number]['key'];
/**
 * Keys present on `node.metadata` that are not user-facing PML metadata:
 * `queried` is the `?` marker (own dedicated UI, not a generic property), and
 * scope/direction/eventType/taskType/outcomes/gatewayKind are structural fields
 * the layout engine's ingest stage (`processLayout/index.ts`) copies into the
 * *layout* node's metadata bag for its own rendering use — each already has its
 * own dedicated field wherever a UI surfaces node properties.
 */
export declare const NON_USER_METADATA_KEYS: Set<string>;
type ParsedMetadataKey = PmlMetadataKey | 'changed' | 'risk' | 'control';
export interface MetadataCategoryDefinition {
    id: 'risk' | 'sla' | 'rule' | 'kpi' | 'owner' | 'app';
    label: string;
    metadataKeys: string[];
}
export declare const PML_METADATA_CATEGORIES: MetadataCategoryDefinition[];
export declare function parseMetadataLine(line: string): [ParsedMetadataKey, any] | null;
export declare function formatMetadataForPml(metadata: Record<string, any>): string[];
export {};
//# sourceMappingURL=activityMetadataSchema.d.ts.map