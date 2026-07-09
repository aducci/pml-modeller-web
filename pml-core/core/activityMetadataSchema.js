/**
 * Activity Metadata Schema
 *
 * PML-compliant metadata properties that can be attached to activities.
 * Per spec Section 13, these are formatted as:
 *   key value
 * indented under any element declaration.
 */
export const PML_METADATA_PROPERTIES = [
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Detailed explanation...' },
    { key: 'note', label: 'Note', type: 'textarea', placeholder: 'Description or guidance...' },
    { key: 'rule', label: 'Business Rule', type: 'textarea', placeholder: 'Policy or rule text...' },
    { key: 'kpi', label: 'KPI', type: 'operator', placeholder: 'metric < value (e.g., time < 4h)' },
    { key: 'sla', label: 'SLA', type: 'operator', placeholder: 'metric < value (e.g., completion < 24h)' },
    { key: 'owner', label: 'Owner', type: 'text', placeholder: 'Team or person responsible...' },
    { key: 'app', label: 'Application', type: 'text', placeholder: 'System or application identifier...' },
];
/**
 * Keys present on `node.metadata` that are not user-facing PML metadata:
 * `queried` is the `?` marker (own dedicated UI, not a generic property), and
 * scope/direction/eventType/taskType/outcomes/gatewayKind are structural fields
 * the layout engine's ingest stage (`processLayout/index.ts`) copies into the
 * *layout* node's metadata bag for its own rendering use — each already has its
 * own dedicated field wherever a UI surfaces node properties.
 */
export const NON_USER_METADATA_KEYS = new Set([
    'queried',
    'scope',
    'direction',
    'eventType',
    'taskType',
    'outcomes',
    'gatewayKind',
]);
const QUOTED_METADATA_KEYS = new Set(['description', 'note', 'rule']);
const PARSABLE_METADATA_KEYS = [
    ...PML_METADATA_PROPERTIES.map((property) => property.key),
    'changed',
    'risk',
    'control',
];
export const PML_METADATA_CATEGORIES = [
    { id: 'risk', label: 'Risk', metadataKeys: ['risks'] },
    { id: 'sla', label: 'SLA', metadataKeys: ['sla'] },
    { id: 'rule', label: 'Business Rule', metadataKeys: ['rule'] },
    { id: 'kpi', label: 'KPI', metadataKeys: ['kpi'] },
    { id: 'owner', label: 'Owner', metadataKeys: ['owner'] },
    { id: 'app', label: 'Application', metadataKeys: ['app'] },
];
export function parseMetadataLine(line) {
    const keysPattern = PARSABLE_METADATA_KEYS.join('|');
    const match = line.match(new RegExp(`^(${keysPattern})\\s+(.+)$`));
    if (!match)
        return null;
    const key = match[1];
    const rawValue = match[2].trim();
    if (key === 'changed') {
        const dateMatch = rawValue.match(/^"(\d{4}-\d{2}-\d{2})"\s+(.*)$/);
        if (!dateMatch)
            return null;
        const date = dateMatch[1];
        const attrs = dateMatch[2];
        const result = { date };
        const byMatch = attrs.match(/by=([A-Za-z0-9_-]+)/);
        const reasonMatch = attrs.match(/reason="([^"]+)"/);
        if (byMatch)
            result.by = byMatch[1];
        if (reasonMatch)
            result.reason = reasonMatch[1];
        return [key, result];
    }
    if (key === 'risk' || key === 'control') {
        return [key, rawValue];
    }
    return [key, stripOptionalQuotes(rawValue)];
}
function stripOptionalQuotes(value) {
    const quoted = value.match(/^"([\s\S]*)"$/);
    return quoted ? quoted[1] : value;
}
function quoteForPml(value) {
    return `"${value.replace(/"/g, '\\"')}"`;
}
function serializeSimpleMetadata(key, value) {
    const textValue = String(value);
    if (QUOTED_METADATA_KEYS.has(key)) {
        return `${key} ${quoteForPml(textValue)}`;
    }
    return `${key} ${textValue}`;
}
export function formatMetadataForPml(metadata) {
    const lines = [];
    if (metadata.risks && Array.isArray(metadata.risks)) {
        for (const risk of metadata.risks) {
            if (!risk?.id)
                continue;
            lines.push(`risk ${risk.id}`);
            if (Array.isArray(risk.controls)) {
                for (const control of risk.controls) {
                    lines.push(`  control ${control}`);
                }
            }
        }
    }
    for (const key of PML_METADATA_PROPERTIES.map((property) => property.key)) {
        const value = metadata[key];
        if (value === undefined || value === null || value === '')
            continue;
        if (Array.isArray(value)) {
            for (const item of value) {
                if (item === undefined || item === null || item === '')
                    continue;
                lines.push(serializeSimpleMetadata(key, item));
            }
            continue;
        }
        lines.push(serializeSimpleMetadata(key, value));
    }
    if (metadata.changes && Array.isArray(metadata.changes)) {
        for (const change of metadata.changes) {
            if (change.date) {
                const reason = change.reason ? ` reason="${change.reason}"` : '';
                const by = change.by ? ` by=${change.by}` : '';
                lines.push(`changed "${change.date}"${by}${reason}`);
            }
        }
    }
    return lines;
}
