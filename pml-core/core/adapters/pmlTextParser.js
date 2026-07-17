// PML text parser: converts raw PML DSL lines into a structured PmlProcessModel (actors, events, tasks, subprocesses, decisions, edges).
// Handles scopes, flowLayers, semanticRoles, decision branches, key-flow chains, metadata (note/kpi/sla/owner/changed), and dedupes edges by (source,target,condition).
// TODO: Extract regex-heavy parsing helpers (events, edges, subprocess, decisions) into smaller named functions or modules for readability and testability.
// TODO: Centralize valid literal sets (ScopeType, FlowLayer, SemanticRole) in a shared constants/types module used by both parser and validators.
// TODO: Add unit tests for complex constructs (branch-flow blocks, metadata attachment, boundary links, key-flow) to guard against regressions during refactors.
import { parse as parseYaml } from 'yaml';
import { parseMetadataLine } from '../activityMetadataSchema';
export const GATEWAY_KIND_BY_KEYWORD = {
    XOR: 'exclusive',
    OR: 'inclusive',
    AND: 'parallel',
};
function stripComment(line) {
    // Strip // comments first (not inside strings), then # comments
    let result = line;
    const slashIdx = result.search(/\/\/(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    if (slashIdx >= 0)
        result = result.slice(0, slashIdx);
    const hashIdx = result.indexOf('#');
    if (hashIdx >= 0)
        result = result.slice(0, hashIdx);
    return result;
}
function parseProcessHeader(line) {
    const header = line.trim();
    const match = header.match(/^@process\s+(?:level=)?([^\s]+)\s+"([^"]+)"(.*)$/);
    if (!match) {
        return {};
    }
    const level = match[1];
    const name = match[2];
    const rest = match[3] || '';
    const parentMatch = rest.match(/(?:\s|^)parent=([^\s]+)/);
    const parentLevelMatch = rest.match(/(?:\s|^)parentLevel=([^\s]+)/);
    const versionMatch = rest.match(/(?:\s|^)version=([^\s]+)/);
    const statusMatch = rest.match(/(?:\s|^)status=([^\s]+)/);
    return {
        level,
        name,
        parent: parentMatch ? parentMatch[1] : undefined,
        parentLevel: parentLevelMatch ? parentLevelMatch[1] : undefined,
        version: versionMatch ? versionMatch[1] : undefined,
        status: statusMatch ? statusMatch[1] : undefined,
    };
}
export function parsePmlTextToProcessModel(text) {
    const lines = text.split(/\r?\n/);
    const actors = new Map();
    const events = [];
    const tasks = [];
    const subprocesses = [];
    const enums = [];
    const catalogs = [];
    const routes = [];
    const routeById = new Map();
    const decisions = new Map();
    const edges = [];
    let processId = 'parsed-process';
    let processName = 'Parsed Process';
    let processLevel;
    let parent;
    let parentLevel;
    let processVersion;
    let processStatus;
    let inContext = false;
    let hasSeenFirstStatement = false;
    let headerFirstViolation = false;
    let headerFirstViolationSourceLine;
    let inFlowBlock = false;
    let activeEnum = null;
    let activeCatalog = null;
    let activeDecisionId = null;
    let activeRouteId = null;
    let activeActorId;
    let inKeyFlowBlock = false;
    let lastNodeId;
    let lastNodeType;
    const declarationOrder = new Map();
    let declarationCounter = 0;
    let contextStartLine;
    let context = {};
    const contextLines = [];
    const parserIssues = [];
    let lastRiskId;
    const resetLastRisk = () => {
        lastRiskId = undefined;
    };
    const attachMetadata = (key, value) => {
        if (!lastNodeId || !lastNodeType)
            return;
        const applyToMeta = (meta) => {
            if (key === 'changed') {
                if (!Array.isArray(meta.changes))
                    meta.changes = [];
                meta.changes.push(value);
            }
            else if (key === 'risk') {
                if (!meta.risks)
                    meta.risks = [];
                meta.risks.push({ id: value, controls: [] });
                lastRiskId = value;
            }
            else if (key === 'control') {
                if (!meta.risks)
                    meta.risks = [];
                const risk = meta.risks.find((r) => r.id === lastRiskId);
                if (risk) {
                    if (!risk.controls)
                        risk.controls = [];
                    risk.controls.push(value);
                }
                else if (meta.risks.length > 0) {
                    meta.risks[meta.risks.length - 1].controls = meta.risks[meta.risks.length - 1].controls || [];
                    meta.risks[meta.risks.length - 1].controls.push(value);
                }
            }
            else if (key === 'app') {
                if (!Array.isArray(meta.app))
                    meta.app = [];
                if (!meta.app.includes(value))
                    meta.app.push(value);
            }
            else if (key === 'rule') {
                if (!Array.isArray(meta.rule))
                    meta.rule = [];
                if (!meta.rule.includes(value))
                    meta.rule.push(value);
            }
            else if (!meta[key]) {
                meta[key] = value;
            }
        };
        if (lastNodeType === 'task') {
            const task = tasks.find(t => t.id === lastNodeId);
            if (task) {
                if (!task.metadata)
                    task.metadata = {};
                applyToMeta(task.metadata);
            }
        }
        else if (lastNodeType === 'event') {
            const event = events.find(e => e.id === lastNodeId);
            if (event) {
                if (!event.metadata)
                    event.metadata = {};
                applyToMeta(event.metadata);
            }
        }
        else if (lastNodeType === 'decision') {
            const decision = decisions.get(lastNodeId);
            if (decision) {
                if (!decision.metadata)
                    decision.metadata = {};
                applyToMeta(decision.metadata);
            }
        }
    };
    const toDisplayLabel = (id) => id
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (m) => m.toUpperCase());
    const parseScopePrefix = (line) => {
        const match = line.match(/^(inScope|external)\s+(.+)$/);
        if (!match) {
            return { scope: 'inScope', statement: line };
        }
        return {
            scope: match[1],
            statement: match[2],
        };
    };
    const parsePrimaryMarker = (textFragment) => {
        return /\bprimary\b/.test(textFragment) || /\bisPrimary\s*=\s*true\b/.test(textFragment);
    };
    const emitDeprecation = (code, message, lineIndex, rawLength) => {
        parserIssues.push({
            code,
            message,
            severity: 'warning',
            source: { startLine: lineIndex + 1, startColumn: 1, endLine: lineIndex + 1, endColumn: Math.max(1, rawLength || 1) },
            fix: { label: 'Replace with >', correction: '', replaceLine: false },
            qualityImpact: -2,
        });
    };
    const parseEdgeAnnotationAttributes = (raw) => {
        const attrs = {};
        const quoted = (name) => {
            const match = raw.match(new RegExp(`\\b${name}="([^"]+)"`));
            return match?.[1];
        };
        const plain = (name) => {
            const match = raw.match(new RegExp(`\\b${name}=([^\\s]+)`));
            return match?.[1];
        };
        const flowLayer = plain('flowLayer');
        if (flowLayer && ['main', 'alternate', 'message', 'annotation', 'hidden'].includes(flowLayer)) {
            attrs.flowLayer = flowLayer;
        }
        const semanticRole = plain('semanticRole');
        if (semanticRole && ['normalFlow', 'messageFlow', 'exceptionFlow', 'compensationFlow', 'eventEscalation', 'boundaryInterrupt'].includes(semanticRole)) {
            attrs.semanticRole = semanticRole;
        }
        const visibility = plain('visibilityDefault') || plain('visibility');
        if (visibility === 'shown' || visibility === 'hidden') {
            attrs.visibilityDefault = visibility;
        }
        attrs.revealGroup = plain('revealGroup');
        attrs.narrative = quoted('narrative');
        attrs.condition = quoted('condition') || plain('condition');
        attrs.label = quoted('label') || plain('label');
        const keyFlow = plain('keyFlow');
        if (keyFlow === 'true' || keyFlow === 'false') {
            attrs.keyFlow = keyFlow === 'true';
        }
        const loop = plain('loop');
        if (loop === 'true' || loop === 'false') {
            attrs.loop = loop === 'true';
        }
        return attrs;
    };
    const registerDeclaration = (id) => {
        if (!declarationOrder.has(id)) {
            declarationOrder.set(id, declarationCounter++);
        }
    };
    const parseChainNodes = (chainLine) => {
        const normalized = chainLine.replace(/->/g, '>');
        return normalized
            .split('>')
            .map((token) => token.trim().replace(/\?$/, ''))
            .filter((token) => token.length > 0);
    };
    // Matches one or more trailing `key=value` / `key="value"` attribute tokens
    // at the end of a chain line, e.g. "a > b keyFlow=true loop=false".
    const TRAILING_EDGE_ATTRS_RE = /(?:\s+[A-Za-z][A-Za-z0-9]*=(?:"[^"]*"|\S+))+\s*$/;
    const pushEdgeChain = (chainLine, flags, lineIndex, rawLength) => {
        // Strip trailing inline attributes (e.g. "a > b keyFlow=true") before
        // splitting into node tokens — parseChainNodes only understands node ids
        // and previously left attribute text stuck onto the last node's id.
        const attrTailMatch = chainLine.match(TRAILING_EDGE_ATTRS_RE);
        const cleanChain = attrTailMatch ? chainLine.slice(0, attrTailMatch.index).trim() : chainLine;
        const inlineAttrs = attrTailMatch ? parseEdgeAnnotationAttributes(attrTailMatch[0]) : {};
        const selfLoopMatch = cleanChain.match(/^([A-Za-z0-9_-]+\??)\s+loop\s*(?:->|>)\s*\1$/i);
        if (selfLoopMatch) {
            if (cleanChain.includes('->')) {
                emitDeprecation('DEPRECATED_ARROW', '-> is deprecated. Use > for flow connectors.', lineIndex ?? 0, rawLength || 1);
            }
            const { id: source } = parseTentative(selfLoopMatch[1]);
            edges.push({
                ...inlineAttrs,
                source,
                target: source,
                keyFlow: Boolean(flags?.keyFlow || inlineAttrs.keyFlow),
                loop: true,
                ...(lineIndex !== undefined ? { sourceRange: { startLine: lineIndex + 1, startColumn: 1, endLine: lineIndex + 1, endColumn: Math.max(1, rawLength || 1) } } : {}),
            });
            return [source];
        }
        const nodes = parseChainNodes(cleanChain);
        for (let i = 1; i < nodes.length; i++) {
            const source = nodes[i - 1];
            const target = nodes[i];
            edges.push({
                ...inlineAttrs,
                source,
                target,
                keyFlow: Boolean(flags?.keyFlow || inlineAttrs.keyFlow),
                loop: Boolean(inlineAttrs.loop),
                ...(lineIndex !== undefined ? { sourceRange: { startLine: lineIndex + 1, startColumn: 1, endLine: lineIndex + 1, endColumn: Math.max(1, rawLength || 1) } } : {}),
            });
        }
        return nodes;
    };
    const addDecisionOutcome = (decisionId, outcomeName, target, primary, loop = false, keyFlow = false, outcomeLabel) => {
        const decision = decisions.get(decisionId);
        if (!decision) {
            return;
        }
        const exists = decision.outcomes.some((o) => o.name === outcomeName && o.target === target);
        if (!exists) {
            decision.outcomes.push({ name: outcomeName, target, primary });
        }
        edges.push({
            source: decisionId,
            target,
            condition: outcomeName,
            label: outcomeLabel,
            loop,
            keyFlow,
            primary,
        });
    };
    // Strip trailing ? from a node id token and return { id, tentative }
    const parseTentative = (token) => {
        if (token.endsWith('?'))
            return { id: token.slice(0, -1), tentative: true };
        return { id: token, tentative: false };
    };
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const raw = stripComment(lines[lineIndex]);
        const trimmed = raw.trim();
        const isIndented = /^\s+/.test(raw);
        if (trimmed.length === 0) {
            // Preserve activeDecisionId across blank lines so branch-flow blocks can
            // include visual spacing between outcomes.
            continue;
        }
        if (!hasSeenFirstStatement) {
            hasSeenFirstStatement = true;
            if (!trimmed.startsWith('@process')) {
                headerFirstViolation = true;
                headerFirstViolationSourceLine = lineIndex + 1;
            }
        }
        if (activeEnum) {
            if (trimmed === '}') {
                enums.push({ id: activeEnum.id, values: activeEnum.values, sourceRange: { startLine: lineIndex + 1, startColumn: 1, endLine: lineIndex + 1, endColumn: Math.max(1, raw.length) } });
                activeEnum = null;
                continue;
            }
            if (isIndented) {
                const valueToken = trimmed.replace(/,$/, '').trim();
                if (valueToken.length > 0) {
                    activeEnum.values.push(valueToken);
                }
            }
            continue;
        }
        if (activeCatalog) {
            if (trimmed === '}') {
                catalogs.push({ kind: activeCatalog.kind, entries: activeCatalog.entries, sourceRange: { startLine: lineIndex + 1, startColumn: 1, endLine: lineIndex + 1, endColumn: Math.max(1, raw.length) } });
                activeCatalog = null;
                continue;
            }
            if (isIndented) {
                const entryMatch = trimmed.match(/^([A-Za-z0-9_-]+)\s+"([^"]*)"$/);
                if (entryMatch) {
                    activeCatalog.entries.push({ id: entryMatch[1], description: entryMatch[2] });
                }
            }
            continue;
        }
        if (trimmed === '---context---') {
            inContext = true;
            contextStartLine = lineIndex + 1;
            inFlowBlock = false;
            activeDecisionId = null;
            continue;
        }
        if (inContext) {
            contextLines.push(raw);
            continue;
        }
        if (trimmed.startsWith('@process')) {
            const header = parseProcessHeader(trimmed);
            processLevel = header.level;
            processName = header.name || processName;
            parent = header.parent;
            parentLevel = header.parentLevel;
            processVersion = header.version;
            processStatus = header.status;
            processId = processName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || processId;
            continue;
        }
        // The `flow key` check must run first — "flow key" also matches
        // `startsWith('flow')`, so the generic branch below would otherwise
        // always win and inKeyFlowBlock would never be set true.
        if (/^flow\s+key(?:\s*\{)?$/.test(trimmed)) {
            inFlowBlock = true;
            inKeyFlowBlock = true;
            activeDecisionId = null;
            continue;
        }
        if (trimmed.startsWith('flow') || /^flow\s*\{$/.test(trimmed)) {
            inFlowBlock = true;
            inKeyFlowBlock = false;
            activeDecisionId = null;
            continue;
        }
        if (trimmed === '}' && inFlowBlock) {
            inFlowBlock = false;
            inKeyFlowBlock = false;
            continue;
        }
        if (!isIndented) {
            activeDecisionId = null;
            activeRouteId = null;
            if (inFlowBlock && !trimmed.includes('->') && !trimmed.includes('>')) {
                inFlowBlock = false;
                inKeyFlowBlock = false;
            }
            if (!trimmed.startsWith('actor ')) {
                activeActorId = undefined;
            }
        }
        // Warn on deprecated label="..." syntax on node declaration lines.
        if (/\blabel="/.test(trimmed) && /^(event|task|decision|actor|subprocess|route)\b/.test(trimmed)) {
            parserIssues.push({
                code: 'DEPRECATED_LABEL_ATTR',
                message: 'label="..." is no longer supported. Use as "Label Name" instead.',
                severity: 'warning',
                source: { startLine: lineIndex + 1, startColumn: 1, endLine: lineIndex + 1, endColumn: Math.max(1, raw.length) },
            });
        }
        const actorMatch = trimmed.match(/^actor\s+([A-Za-z0-9_-]+)(?:\s+(?:as\s+)?"([^"]+)")?$/);
        if (actorMatch) {
            const actorId = actorMatch[1];
            actors.set(actorId, { id: actorId, label: actorMatch[2] || actorId });
            activeActorId = actorId;
            continue;
        }
        const enumHeaderMatch = trimmed.match(/^enum\s+([A-Za-z0-9_-]+)\s*\{$/);
        if (enumHeaderMatch) {
            activeEnum = { id: enumHeaderMatch[1], values: [] };
            continue;
        }
        const catalogHeaderMatch = trimmed.match(/^(risk_register|rule_library|app_registry)\s*\{$/);
        if (catalogHeaderMatch) {
            activeCatalog = { kind: catalogHeaderMatch[1], entries: [] };
            continue;
        }
        const explicitEdgeMatch = trimmed.match(/^edge\s+([A-Za-z0-9_-]+)\s*(?:->|>)\s*([A-Za-z0-9_-]+)(?:\s+(.*))?$/);
        if (explicitEdgeMatch) {
            if (trimmed.includes('->')) {
                emitDeprecation('DEPRECATED_ARROW', '-> is deprecated. Use > for flow connectors.', lineIndex, raw.length);
            }
            const attrs = parseEdgeAnnotationAttributes(explicitEdgeMatch[3] || '');
            edges.push({
                source: explicitEdgeMatch[1],
                target: explicitEdgeMatch[2],
                condition: attrs.condition,
                label: attrs.label,
                keyFlow: attrs.keyFlow,
                loop: attrs.loop,
                flowLayer: attrs.flowLayer,
                semanticRole: attrs.semanticRole,
                visibilityDefault: attrs.visibilityDefault,
                revealGroup: attrs.revealGroup,
                narrative: attrs.narrative,
                sourceRange: { startLine: lineIndex + 1, startColumn: 1, endLine: lineIndex + 1, endColumn: Math.max(1, raw.length) },
            });
            continue;
        }
        const scoped = parseScopePrefix(trimmed);
        const taskMatch = scoped.statement.match(/^task(?:\(([a-z_]+)\))?\s+([A-Za-z0-9_-]+\??)(?:\(([a-z_]+)\))?(?:\s+(?:as\s+)?"([^"]+)")?(?:\s+actor=([A-Za-z0-9_-]+))?(?:\s*(?:->|>)\s*([A-Za-z0-9_-]+\??))?$/);
        if (taskMatch) {
            const { id: taskId, tentative: queried } = parseTentative(taskMatch[2]);
            const implicitTarget = taskMatch[6] ? parseTentative(taskMatch[6]).id : undefined;
            // Accept type from either task(type) id or task id(type)
            const typeBefore = taskMatch[1];
            const typeAfter = taskMatch[3];
            const rawType = typeAfter || typeBefore;
            // Accept custom task types — don't restrict to predefined list
            const taskType = rawType || undefined;
            const rawLength = raw.length;
            if (scoped.statement.includes('->')) {
                emitDeprecation('DEPRECATED_ARROW', '-> is deprecated. Use > for flow connectors.', lineIndex, rawLength);
            }
            tasks.push({
                id: taskId,
                label: taskMatch[4] || toDisplayLabel(taskId),
                actor: taskMatch[5] || activeActorId,
                scope: scoped.scope,
                taskType,
                metadata: {
                    ...(queried && { queried: true }),
                },
                sourceRange: { startLine: lineIndex + 1, startColumn: 1, endLine: lineIndex + 1, endColumn: Math.max(1, rawLength) },
            });
            if (implicitTarget) {
                edges.push({
                    source: taskId,
                    target: implicitTarget,
                    keyFlow: false,
                    loop: false,
                    sourceRange: { startLine: lineIndex + 1, startColumn: 1, endLine: lineIndex + 1, endColumn: Math.max(1, rawLength || 1) },
                });
            }
            lastNodeId = taskId;
            lastNodeType = 'task';
            resetLastRisk();
            registerDeclaration(taskId);
            continue;
        }
        const eventShortMatch = scoped.statement.match(/^event\((message|signal|timer|state)\)\s+([A-Za-z0-9_-]+\??)(?:\s+(inbound|outbound|internal))?(?:\s+from=([A-Za-z0-9_.-]+))?(?:\s+to=([A-Za-z0-9_.-]+))?(?:\s+(.*))?$/);
        if (eventShortMatch) {
            const dirKeyword = eventShortMatch[3];
            const fromPeer = eventShortMatch[4];
            const toPeer = eventShortMatch[5];
            let direction = dirKeyword === 'outbound' ? 'outbound' : dirKeyword === 'internal' ? 'internal' : dirKeyword === 'inbound' ? 'inbound' : undefined;
            let extras = eventShortMatch[6] || '';
            const asLabelMatch = extras.match(/(?:\bas\s+)?"([^"]+)"/);
            const { id: eventId, tentative: queried } = parseTentative(eventShortMatch[2]);
            events.push({
                id: eventId,
                label: asLabelMatch ? asLabelMatch[1] : toDisplayLabel(eventId),
                actor: activeActorId,
                direction,
                type: eventShortMatch[1],
                source: fromPeer,
                target: toPeer,
                scope: scoped.scope,
                isPrimary: parsePrimaryMarker(extras),
                metadata: {
                    ...(queried && { queried: true }),
                },
                sourceRange: { startLine: lineIndex + 1, startColumn: 1, endLine: lineIndex + 1, endColumn: Math.max(1, raw.length) },
            });
            lastNodeId = eventId;
            lastNodeType = 'event';
            resetLastRisk();
            registerDeclaration(eventId);
            continue;
        }
        // Verbose event form: event <id> [as "<Label>"] <direction> [extras]
        //                  or: event <id> <direction> [as "<Label>"] [extras]
        // direction is optional — actor-less events declared at top of file may omit it.
        const eventVerboseMatch = scoped.statement.match(/^event\s+([A-Za-z0-9_-]+)(?:\s+(.+))?$/);
        if (eventVerboseMatch && !scoped.statement.startsWith('event(')) {
            const { id: eventId, tentative: queried } = parseTentative(eventVerboseMatch[1]);
            const rest = eventVerboseMatch[2] || '';
            const verboseAsMatch = rest.match(/(?:\bas\s+)?"([^"]+)"/);
            const dirMatch = rest.match(/\b(inbound|outbound|internal)\b/);
            const direction = dirMatch?.[1];
            const extra = rest
                .replace(/(?:\bas\s+)?"[^"]+"\s*/g, '')
                .replace(/\b(?:inbound|outbound|internal)\b\s*/, '');
            events.push({
                id: eventId,
                label: verboseAsMatch ? verboseAsMatch[1] : toDisplayLabel(eventId),
                actor: activeActorId,
                direction,
                type: 'message',
                scope: scoped.scope,
                isPrimary: parsePrimaryMarker(extra),
                metadata: {
                    ...(queried && { queried: true }),
                },
                sourceRange: { startLine: lineIndex + 1, startColumn: 1, endLine: lineIndex + 1, endColumn: Math.max(1, raw.length) },
            });
            lastNodeId = eventId;
            lastNodeType = 'event';
            resetLastRisk();
            registerDeclaration(eventId);
            continue;
        }
        const subprocessMatch = scoped.statement.match(/^subprocess\s+([A-Za-z0-9_-]+)(?:\s+(?:as\s+)?"([^"]+)")?(?:\s*\(([^)]*)\)\s*(?:->|>)\s*\(([^)]*)\))?(.*)$/);
        if (subprocessMatch) {
            if (scoped.statement.includes('->')) {
                emitDeprecation('DEPRECATED_ARROW', '-> is deprecated. Use > for flow connectors.', lineIndex, raw.length);
            }
            const tail = subprocessMatch[5] || '';
            const processMatch = tail.match(/\bprocess=([^\s]+)/);
            const actorMatchInSubprocess = tail.match(/\bactor=([A-Za-z0-9_-]+)/);
            const collapsedMatch = tail.match(/\bcollapsed=(true|false)\b/);
            const parseList = (value) => {
                if (!value)
                    return [];
                return value
                    .split(',')
                    .map((part) => part.trim())
                    .filter((part) => part.length > 0);
            };
            subprocesses.push({
                id: subprocessMatch[1],
                label: subprocessMatch[2] || toDisplayLabel(subprocessMatch[1]),
                actor: actorMatchInSubprocess?.[1] || activeActorId,
                scope: scoped.scope,
                process: processMatch?.[1],
                collapsed: collapsedMatch ? collapsedMatch[1] === 'true' : true,
                inputs: parseList(subprocessMatch[3]),
                outputs: parseList(subprocessMatch[4]),
                sourceRange: { startLine: lineIndex + 1, startColumn: 1, endLine: lineIndex + 1, endColumn: Math.max(1, raw.length) },
            });
            lastNodeId = subprocessMatch[1];
            lastNodeType = 'subprocess';
            resetLastRisk();
            registerDeclaration(subprocessMatch[1]);
            continue;
        }
        // Accepts: decision id  |  decision id as "Label"  |  decision id:  |  decision id as "Label":
        // Also: decision id? as "Label":   (queried)
        const decisionMatch = scoped.statement.match(/^decision(?:\((AND|OR|XOR)\))?\s+([A-Za-z0-9_-]+\??)(?:\s+(?:as\s+)?"([^"]+)")?:?$/);
        if (decisionMatch) {
            const gatewayKind = decisionMatch[1] ? GATEWAY_KIND_BY_KEYWORD[decisionMatch[1]] : 'exclusive';
            const { id: decisionId, tentative: queried } = parseTentative(decisionMatch[2]);
            if (!decisions.has(decisionId)) {
                decisions.set(decisionId, {
                    id: decisionId,
                    label: decisionMatch[3] || toDisplayLabel(decisionId),
                    actor: activeActorId,
                    gatewayKind,
                    scope: scoped.scope,
                    outcomes: [],
                    metadata: {
                        ...(queried && { queried: true }),
                    },
                    sourceRange: { startLine: lineIndex + 1, startColumn: 1, endLine: lineIndex + 1, endColumn: Math.max(1, raw.length) },
                });
            }
            else if (activeActorId) {
                const existing = decisions.get(decisionId);
                if (!existing.actor) {
                    existing.actor = activeActorId;
                }
                if (!existing.scope) {
                    existing.scope = scoped.scope;
                }
            }
            activeDecisionId = decisionId;
            lastNodeId = decisionId;
            lastNodeType = 'decision';
            resetLastRisk();
            registerDeclaration(decisionId);
            continue;
        }
        const routeMatch = scoped.statement.match(/^route\s+([A-Za-z0-9_-]+)(?:\s+"([^"]+)")?\s+by\s+([A-Za-z0-9_-]+)$/);
        if (routeMatch) {
            const routeId = routeMatch[1];
            const existingRoute = routeById.get(routeId);
            if (!existingRoute) {
                const newRoute = {
                    id: routeId,
                    label: routeMatch[2] || toDisplayLabel(routeId),
                    enumId: routeMatch[3],
                    mappings: [],
                    sourceRange: { startLine: lineIndex + 1, startColumn: 1, endLine: lineIndex + 1, endColumn: Math.max(1, raw.length) },
                };
                routes.push(newRoute);
                routeById.set(routeId, newRoute);
            }
            activeRouteId = routeId;
            activeDecisionId = null;
            registerDeclaration(routeId);
            continue;
        }
        const parallelHeaderMatch = scoped.statement.match(/^parallel\s+([A-Za-z0-9_-]+)(?:\s+"([^"]+)")?\s*(?:->|>)\s*([A-Za-z0-9_-]+)$/);
        if (parallelHeaderMatch) {
            if (scoped.statement.includes('->')) {
                emitDeprecation('DEPRECATED_ARROW', '-> is deprecated. Use > for flow connectors.', lineIndex, raw.length);
            }
            parserIssues.push({
                code: 'UNSUPPORTED_PARALLEL_GATEWAY',
                message: 'parallel gateways are not supported in the current PML specification. Replace with explicit fan-out flows from the source step.',
                severity: 'error',
                source: {
                    startLine: lineIndex + 1,
                    startColumn: 1,
                    endLine: lineIndex + 1,
                    endColumn: Math.max(1, raw.length),
                },
            });
            activeDecisionId = null;
            activeRouteId = null;
            continue;
        }
        // Decision/route mapping block header: id: or id as "Label":
        // Auto-declares the decision if not previously declared — no need for a
        // standalone `decision id` line when the outcomes block is present.
        const mappingHeaderMatch = trimmed.match(/^([A-Za-z0-9_-]+)(?:\s+as\s+"([^"]+)")?:$/);
        if (mappingHeaderMatch) {
            const mappingId = mappingHeaderMatch[1];
            const mappingLabel = mappingHeaderMatch[2];
            if (routeById.has(mappingId)) {
                activeRouteId = mappingId;
                activeDecisionId = null;
                continue;
            }
            // Auto-declare decision if not already declared
            if (!decisions.has(mappingId)) {
                decisions.set(mappingId, {
                    id: mappingId,
                    label: mappingLabel || toDisplayLabel(mappingId),
                    actor: activeActorId,
                    scope: scoped.scope,
                    gatewayKind: 'exclusive',
                    outcomes: [],
                    sourceRange: { startLine: lineIndex + 1, startColumn: 1, endLine: lineIndex + 1, endColumn: Math.max(1, raw.length) },
                });
                registerDeclaration(mappingId);
            }
            else if (mappingLabel) {
                // Upgrade label if the block header provides one
                decisions.get(mappingId).label = mappingLabel;
            }
            activeDecisionId = mappingId;
            activeRouteId = null;
            continue;
        }
        const routeMappingMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\s*(?:->|>)\s*([A-Za-z0-9_-]+)$/);
        if (routeMappingMatch && activeRouteId) {
            if (trimmed.includes('->')) {
                emitDeprecation('DEPRECATED_ARROW', '-> is deprecated. Use > for flow connectors.', lineIndex, raw.length);
            }
            const route = routeById.get(activeRouteId);
            if (route) {
                const routeValue = routeMappingMatch[1];
                const routeTarget = routeMappingMatch[2];
                if (!route.mappings.some((mapping) => mapping.value === routeValue && mapping.target === routeTarget)) {
                    route.mappings.push({ value: routeValue, target: routeTarget });
                }
                edges.push({
                    source: activeRouteId,
                    target: routeTarget,
                    condition: routeValue,
                    label: routeValue,
                    keyFlow: false,
                    loop: false,
                    ...(lineIndex !== undefined ? { sourceRange: { startLine: lineIndex + 1, startColumn: 1, endLine: lineIndex + 1, endColumn: Math.max(1, raw.length || 1) } } : {}),
                });
            }
            continue;
        }
        const branchMatch = trimmed.match(/^([A-Za-z0-9_.-]+)(\*)?(?:\s+as\s+"([^"]+)")?(?:\s+loop)?\s*(?:->|>)\s*([A-Za-z0-9_-][\w-]*\??)/);
        const colonMatch = trimmed.match(/^([A-Za-z0-9_.-]+)(\*)?(?:\s+as\s+"([^"]+)")?(?:\s+loop)?\s*:\s*([A-Za-z0-9_-][\w-]*\??)/);
        const match = branchMatch || colonMatch;
        if (match && activeDecisionId) {
            const outcomeName = match[1];
            const outcomeLabel = match[3];
            const { id: target } = parseTentative(match[4]);
            const isPrimary = Boolean(match[2]);
            const isLoop = /\sloop\s*(?:->|>|:)/.test(trimmed);
            addDecisionOutcome(activeDecisionId, outcomeName, target, isPrimary, isLoop, inKeyFlowBlock, outcomeLabel);
            continue;
        }
        const decisionSugarBranches = null; // if/else sugar removed — use outcome -> target form
        if (activeDecisionId && decisionSugarBranches) {
            for (const branch of decisionSugarBranches) {
                addDecisionOutcome(activeDecisionId, branch.outcomeName, branch.target, branch.primary, false, inKeyFlowBlock);
            }
            continue;
        }
        // Metadata annotation parsing (when indented and matches note/kpi/sla/owner/changed pattern)
        if (isIndented && lastNodeId) {
            const metaMatch = parseMetadataLine(trimmed);
            if (metaMatch) {
                attachMetadata(metaMatch[0], metaMatch[1]);
                continue;
            }
        }
        if (trimmed.startsWith('key:') && (trimmed.includes('->') || trimmed.includes('>'))) {
            const keyChain = trimmed.slice('key:'.length).trim();
            if (keyChain.length > 0) {
                if (trimmed.includes('->')) {
                    emitDeprecation('DEPRECATED_ARROW', '-> is deprecated. Use > for flow connectors.', lineIndex, raw.length);
                }
                pushEdgeChain(keyChain, { keyFlow: true }, lineIndex, raw.length);
            }
            continue;
        }
        if ((trimmed.includes('->') || trimmed.includes('>')) && (inFlowBlock || !isIndented) && !/^task\b/.test(scoped.statement)) {
            if (trimmed.includes('->')) {
                emitDeprecation('DEPRECATED_ARROW', '-> is deprecated. Use > for flow connectors.', lineIndex, raw.length);
            }
            pushEdgeChain(trimmed, { keyFlow: inKeyFlowBlock }, lineIndex, raw.length);
            continue;
        }
    }
    if (contextLines.length > 0) {
        const contextText = contextLines.join('\n').trim();
        if (contextText.length > 0) {
            try {
                const parsedContext = parseYaml(contextText);
                if (parsedContext && typeof parsedContext === 'object' && !Array.isArray(parsedContext)) {
                    context = parsedContext;
                }
                else {
                    parserIssues.push({
                        code: 'CONTEXT_YAML_ROOT_INVALID',
                        message: 'Context block must parse to a YAML object/map at the root.',
                        severity: 'error',
                        source: contextStartLine
                            ? {
                                startLine: contextStartLine,
                                startColumn: 1,
                                endLine: contextStartLine,
                                endColumn: 1,
                            }
                            : undefined,
                    });
                }
            }
            catch (error) {
                parserIssues.push({
                    code: 'CONTEXT_YAML_PARSE_ERROR',
                    message: error instanceof Error
                        ? `Malformed context YAML: ${error.message}`
                        : 'Malformed context YAML.',
                    severity: 'error',
                    source: contextStartLine
                        ? {
                            startLine: contextStartLine,
                            startColumn: 1,
                            endLine: contextStartLine,
                            endColumn: 1,
                        }
                        : undefined,
                });
            }
        }
    }
    const uniqueEdges = new Map();
    for (const edge of edges) {
        const key = `${edge.source}>${edge.target}:${edge.condition || ''}`;
        if (!uniqueEdges.has(key)) {
            uniqueEdges.set(key, edge);
            continue;
        }
        const existing = uniqueEdges.get(key);
        existing.keyFlow = Boolean(existing.keyFlow || edge.keyFlow);
        existing.loop = Boolean(existing.loop || edge.loop);
        existing.flowLayer = existing.flowLayer || edge.flowLayer;
        existing.semanticRole = existing.semanticRole || edge.semanticRole;
        existing.visibilityDefault = existing.visibilityDefault || edge.visibilityDefault;
        existing.revealGroup = existing.revealGroup || edge.revealGroup;
        existing.narrative = existing.narrative || edge.narrative;
        existing.label = existing.label || edge.label;
    }
    const incomingCount = new Map();
    const outgoingCount = new Map();
    for (const edge of edges) {
        outgoingCount.set(edge.source, (outgoingCount.get(edge.source) || 0) + 1);
        incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
    }
    for (const event of events) {
        if (event.direction === undefined) {
            const in_ = incomingCount.get(event.id) || 0;
            const out = outgoingCount.get(event.id) || 0;
            if (in_ === 0 && out > 0)
                event.direction = 'inbound';
            else if (in_ > 0 && out === 0)
                event.direction = 'outbound';
            else
                event.direction = 'internal';
        }
    }
    return {
        id: processId,
        name: processName,
        level: processLevel,
        parent,
        parentLevel,
        version: processVersion,
        status: processStatus,
        actors: Array.from(actors.values()).sort((a, b) => a.id.localeCompare(b.id)),
        events,
        tasks,
        subprocesses,
        enums,
        catalogs,
        decisions: Array.from(decisions.values()).sort((a, b) => a.id.localeCompare(b.id)),
        routes,
        edges: Array.from(uniqueEdges.values()),
        context,
        parserIssues: parserIssues.length > 0 ? parserIssues : undefined,
        headerFirstViolation,
        headerFirstViolationSource: headerFirstViolationSourceLine
            ? {
                startLine: headerFirstViolationSourceLine,
                startColumn: 1,
                endLine: headerFirstViolationSourceLine,
                endColumn: 1,
            }
            : undefined,
    };
}
