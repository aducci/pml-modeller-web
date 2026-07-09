'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * RoutingTypesPanel — admin reference for all 14 canonical connection routing types.
 */
import { useState } from 'react';
import { deriveRoutingTypeCode } from '../../core/routing/routingDiagnostics';
import { ChevronDown, ChevronRight } from 'lucide-react';
function MiniDiagram({ points, isDashed, width = 96, height = 60 }) {
    const ptStr = points.map(([x, y]) => `${x},${y}`).join(' ');
    const [sx, sy] = points[0];
    const [ex, ey] = points[points.length - 1];
    // Arrow head direction from last two points
    const [px, py] = points[points.length - 2];
    const dx = ex - px;
    const dy = ey - py;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const al = 7; // arrow length
    const aw = 4; // arrow half-width
    const arrow = [
        `${ex},${ey}`,
        `${ex - ux * al - uy * aw},${ey - uy * al + ux * aw}`,
        `${ex - ux * al + uy * aw},${ey - uy * al - ux * aw}`,
    ].join(' ');
    return (_jsxs("svg", { width: width, height: height, viewBox: `0 0 100 ${Math.round(100 * height / width)}`, style: { display: 'block', overflow: 'visible' }, children: [_jsx("rect", { x: sx - 10, y: sy - 5, width: 20, height: 10, rx: 2, fill: "#EEF2FF", stroke: "#6366F1", strokeWidth: 1.5 }), _jsx("rect", { x: ex - 10, y: ey - 5, width: 20, height: 10, rx: 2, fill: "#EEF2FF", stroke: "#6366F1", strokeWidth: 1.5 }), _jsx("polyline", { points: ptStr, fill: "none", stroke: isDashed ? '#EA580C' : '#6366F1', strokeWidth: 2, strokeDasharray: isDashed ? '5,3' : undefined, strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("polygon", { points: arrow, fill: isDashed ? '#EA580C' : '#6366F1' })] }));
}
const ROUTING_TYPES = [
    // ── Straight ──────────────────────────────────────────────────────────────
    {
        code: 'STH',
        fullName: 'Straight Horizontal',
        group: 'Straight',
        bends: 0,
        sourceAnchor: 'RC',
        targetAnchor: 'LC',
        skew: false,
        isDashed: false,
        miniPoints: [[10, 31], [90, 31]],
        trigger: 'Source and target share the same vertical midpoint (y ≈ same). Forward flow only.',
        codeMapping: {
            bendType: 'straight',
            scenarioPattern: 'same-lane-straight',
            elbowYPolicy: 'n/a',
        },
    },
    {
        code: 'STV',
        fullName: 'Straight Vertical',
        group: 'Straight',
        bends: 0,
        sourceAnchor: 'BC',
        targetAnchor: 'TC',
        skew: false,
        isDashed: false,
        miniPoints: [[50, 10], [50, 52]],
        trigger: 'Source and target share the same horizontal midpoint (x ≈ same). Cross-lane straight-down.',
        codeMapping: {
            bendType: 'straight',
            scenarioPattern: 'cross-lane-downward (straight-down geometry mode)',
            elbowYPolicy: 'n/a',
        },
    },
    // ── Single Elbow ──────────────────────────────────────────────────────────
    {
        code: 'SEH',
        fullName: 'Single Elbow Horizontal',
        group: 'Single Elbow',
        bends: 1,
        sourceAnchor: 'RC → TC/BC',
        targetAnchor: 'TC or BC',
        skew: true,
        isDashed: false,
        miniPoints: [[10, 31], [75, 31], [75, 52]],
        trigger: 'Horizontal-primary, target port is top or bottom. Common for boundary event exits and decision drops.',
        codeMapping: {
            bendType: 'h-first',
            scenarioPattern: 'same-lane-elbow, boundary-outbound',
            elbowYPolicy: 'midpointY (mid) · matchSourceConnectionY (near) · matchTargetConnectionY (far)',
        },
    },
    {
        code: 'SEV',
        fullName: 'Single Elbow Vertical',
        group: 'Single Elbow',
        bends: 1,
        sourceAnchor: 'BC → LC/RC',
        targetAnchor: 'LC or RC',
        skew: true,
        isDashed: false,
        miniPoints: [[50, 10], [50, 45], [90, 45]],
        trigger: 'Vertical-primary. Source exits bottom, drops to target height, enters left or right. Used for rejection / exception paths.',
        codeMapping: {
            bendType: 'v-first',
            scenarioPattern: 'boundary-outbound (bottom exit), exception flows',
            elbowYPolicy: 'midpointY (mid) · matchSourceConnectionY (near) · matchTargetConnectionY (far)',
        },
    },
    // ── Double Elbow ──────────────────────────────────────────────────────────
    {
        code: 'DEH',
        fullName: 'Double Elbow Horizontal',
        group: 'Double Elbow',
        bends: 2,
        sourceAnchor: 'RC',
        targetAnchor: 'LC',
        skew: true,
        isDashed: false,
        miniPoints: [[10, 20], [50, 20], [50, 42], [90, 42]],
        trigger: 'Default for most left-to-right connections. Target LC is right of source RC, nodes at different heights. The main workhorse.',
        codeMapping: {
            bendType: 'h-v-h',
            scenarioPattern: 'same-lane-elbow, cross-lane-downward, cross-lane-upward (forward, target is right of source)',
            elbowYPolicy: 'midpointY → mid skew (default)',
        },
        notes: 'DEN and DEF are the near/far skew variants — same internal bendType h-v-h, different ElbowYPolicy.',
    },
    {
        code: 'DEN',
        fullName: 'Double Elbow Near-Exit H',
        group: 'Double Elbow',
        bends: 2,
        sourceAnchor: 'RC',
        targetAnchor: 'LC',
        skew: false,
        isDashed: false,
        miniPoints: [[10, 20], [22, 20], [22, 42], [90, 42]],
        trigger: 'Near skew — short exit buffer then long run. Elbow sits close to source node.',
        codeMapping: {
            bendType: 'h-v-h',
            scenarioPattern: 'same as DEH',
            elbowYPolicy: 'matchSourceConnectionY → near skew',
        },
        notes: 'Right-pane label: DEH / near',
    },
    {
        code: 'DEF',
        fullName: 'Double Elbow Far-Exit H',
        group: 'Double Elbow',
        bends: 2,
        sourceAnchor: 'RC',
        targetAnchor: 'LC',
        skew: false,
        isDashed: false,
        miniPoints: [[10, 20], [78, 20], [78, 42], [90, 42]],
        trigger: 'Far skew — long run then late jog close to target. Elbow sits close to target node.',
        codeMapping: {
            bendType: 'h-v-h',
            scenarioPattern: 'same as DEH',
            elbowYPolicy: 'matchTargetConnectionY → far skew',
        },
        notes: 'Right-pane label: DEH / far. Also applies to cross-lane-upward when target is right of source (e.g. Operations→Customer going up-and-right).',
    },
    {
        code: 'DEV',
        fullName: 'Double Elbow Vertical',
        group: 'Double Elbow',
        bends: 2,
        sourceAnchor: 'BC',
        targetAnchor: 'TC',
        skew: true,
        isDashed: false,
        miniPoints: [[30, 10], [30, 36], [70, 36], [70, 52]],
        trigger: 'Vertical Z-shape. Source exits bottom, vertical run to horizontal jog row, vertical run into target top. Used for top-to-bottom cross-lane where nodes are horizontally offset.',
        codeMapping: {
            bendType: 'v-h-v (sourcePort=bottom, targetPort=top)',
            scenarioPattern: 'cross-lane-downward (non-aligned x)',
            elbowYPolicy: 'midpointY · channelY (inter-lane gap row)',
        },
    },
    {
        code: 'DBL',
        fullName: 'Double Elbow Bottom-to-Left',
        group: 'Double Elbow',
        bends: 2,
        sourceAnchor: 'BC',
        targetAnchor: 'LC',
        skew: true,
        isDashed: false,
        //  [A]           Source top-left, BC exits downward
        //   |            vertical to corridor
        //   └──────┐     horizontal right
        //          |     drop to target y
        //          └──>  [B] LC (bottom-right)
        miniPoints: [[20, 10], [20, 38], [72, 38], [72, 50], [82, 50]],
        trigger: 'Source exits bottom (BC), travels to a horizontal corridor, then drops to enter target from the left (LC). Used for cross-lane connections where the exit direction is vertical but the entry is horizontal.',
        codeMapping: {
            bendType: 'v-h-v (sourcePort=bottom, targetPort=left)',
            scenarioPattern: 'cross-lane-downward (cross-down-b_to_l), boundary-outbound routing to offset node',
            elbowYPolicy: 'midpointY · channelY · matchTargetConnectionY',
        },
        notes: 'Implemented by routeVerticalFirstLeftEntry in routingPrimitives.ts. Technically 3 bend points (the entry buffer adds a small horizontal segment before LC) but visually reads as 2 elbows.',
    },
    // ── Triple Elbow ──────────────────────────────────────────────────────────
    {
        code: 'TEH',
        fullName: 'Triple Elbow Horizontal',
        group: 'Triple Elbow',
        bends: 3,
        sourceAnchor: 'RC → LC (backward)',
        targetAnchor: 'LC',
        skew: false,
        isDashed: true,
        // Goes right past both nodes, drops, comes back left
        miniPoints: [[65, 20], [85, 20], [85, 42], [35, 42], [15, 42]],
        trigger: 'True feedback loop: target is to the LEFT of source (x decreases). scenarioKey contains "loopback". Rendered dashed.',
        codeMapping: {
            bendType: 'h-v-h (scenarioKey must include "loopback")',
            scenarioPattern: 'loopback-bottom-corridor, loopback-top-corridor',
            elbowYPolicy: 'fixed (corridor Y from lane geometry)',
        },
        notes: 'ONLY applies when scenarioKey includes "loopback". cross-lane-upward where target is right of source is DEH/DEF — not TEH.',
    },
    {
        code: 'TEV',
        fullName: 'Triple Elbow Vertical',
        group: 'Triple Elbow',
        bends: 3,
        sourceAnchor: 'BC → TC (upward loopback)',
        targetAnchor: 'TC',
        skew: false,
        isDashed: true,
        miniPoints: [[30, 42], [30, 55], [70, 55], [70, 10], [70, 10]],
        trigger: 'Vertical feedback loop: target is ABOVE and a genuine cycle (loopback). scenarioKey contains "loopback". Rendered dashed.',
        codeMapping: {
            bendType: 'v-h-v (scenarioKey must include "loopback")',
            scenarioPattern: 'loopback-top-corridor',
            elbowYPolicy: 'fixed (top corridor Y)',
        },
    },
    // ── Special ───────────────────────────────────────────────────────────────
    {
        code: 'SLP',
        fullName: 'Self Loop',
        group: 'Special',
        bends: 3,
        sourceAnchor: 'RC',
        targetAnchor: 'TC (same node)',
        skew: false,
        isDashed: false,
        miniPoints: [[50, 31], [70, 31], [70, 10], [50, 10], [50, 26]],
        trigger: 'Source node ID equals target node ID. Engine uses buildLoopbackWaypoints with fixed offset.',
        codeMapping: {
            bendType: 'h-v-h or v-h-v (small fixed-offset rectangular loop)',
            scenarioPattern: 'self-loop (source.id === target.id)',
            elbowYPolicy: 'fixed (loop size offset)',
        },
    },
    {
        code: 'POH',
        fullName: 'Parallel Offset Horizontal',
        group: 'Special',
        bends: 2,
        sourceAnchor: 'RC',
        targetAnchor: 'LC',
        skew: false,
        isDashed: false,
        miniPoints: [[10, 18], [50, 18], [50, 36], [90, 36]],
        trigger: 'Same geometry as DEH but channel ≠ 0 — the engine nudged this path up or down to separate it from another overlapping connection.',
        codeMapping: {
            bendType: 'h-v-h (channel != 0)',
            scenarioPattern: 'same as DEH',
            elbowYPolicy: 'channelY (offset by channel × spacing)',
        },
        notes: 'The channel parameter is how the engine separates two connections sharing the same source-target pair or crossing path.',
    },
    {
        code: 'POV',
        fullName: 'Parallel Offset Vertical',
        group: 'Special',
        bends: 2,
        sourceAnchor: 'BC',
        targetAnchor: 'TC',
        skew: false,
        isDashed: false,
        miniPoints: [[28, 10], [28, 36], [72, 36], [72, 52]],
        trigger: 'Same as POH for vertical connections. Channel offset nudges the horizontal jog X.',
        codeMapping: {
            bendType: 'v-h-v (channel != 0)',
            scenarioPattern: 'same as DEV',
            elbowYPolicy: 'channelY',
        },
    },
    {
        code: 'AOT',
        fullName: 'Auto Orthogonal',
        group: 'Special',
        bends: -1,
        sourceAnchor: 'engine-selected',
        targetAnchor: 'engine-selected',
        skew: false,
        isDashed: false,
        miniPoints: [[10, 31], [50, 31], [50, 20], [90, 20]],
        trigger: 'Fallback when position heuristics cannot resolve a clean named type. scenarioKey is unknown or unclassified.',
        codeMapping: {
            bendType: 'varies',
            scenarioPattern: 'unknown / unclassified',
            elbowYPolicy: 'varies',
        },
        notes: 'Right pane shows: AOT → [resolved bendType]. Flag for routing engine investigation.',
    },
];
const GROUPS = ['Straight', 'Single Elbow', 'Double Elbow', 'Triple Elbow', 'Special'];
const GROUP_COLORS = {
    'Straight': { bg: '#F0FDF4', border: '#BBF7D0', text: '#14532D', badge: '#16A34A' },
    'Single Elbow': { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E3A5F', badge: '#3B82F6' },
    'Double Elbow': { bg: '#EEF2FF', border: '#C7D2FE', text: '#312E81', badge: '#6366F1' },
    'Triple Elbow': { bg: '#FFF7ED', border: '#FED7AA', text: '#7C2D12', badge: '#EA580C' },
    'Special': { bg: '#F5F3FF', border: '#DDD6FE', text: '#4C1D95', badge: '#7C3AED' },
};
export const RoutingTypesPanel = ({ layoutResult }) => {
    const [expandedCode, setExpandedCode] = useState(null);
    const [filterGroup, setFilterGroup] = useState(null);
    const liveCountByCode = buildLiveCounts(layoutResult);
    const filtered = filterGroup ? ROUTING_TYPES.filter(t => t.group === filterGroup) : ROUTING_TYPES;
    return (_jsxs("div", { children: [_jsxs("div", { style: { marginBottom: 24 }, children: [_jsx("h2", { style: { fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }, children: "Connection Routing Types" }), _jsxs("p", { style: { fontSize: 12, color: '#6B7280', margin: '4px 0 0', lineHeight: 1.5 }, children: ["Reference for all 14 canonical routing types \u2014 code, geometry, trigger conditions, and internal engine mapping.", layoutResult && (_jsx("span", { style: { color: '#059669', marginLeft: 4 }, children: "Live counts reflect the current diagram." }))] })] }), _jsxs("div", { style: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }, children: [_jsx(FilterChip, { label: "All types", active: filterGroup === null, onClick: () => setFilterGroup(null) }), GROUPS.map(g => (_jsx(FilterChip, { label: g, active: filterGroup === g, onClick: () => setFilterGroup(filterGroup === g ? null : g), color: GROUP_COLORS[g].badge }, g)))] }), _jsxs("div", { style: { border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', marginBottom: 28 }, children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '52px 80px 1fr 90px 60px 80px 72px', padding: '8px 14px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }, children: [_jsx("span", {}), _jsx("span", { style: thStyle, children: "Diagram" }), _jsx("span", { style: thStyle, children: "Full name" }), _jsx("span", { style: thStyle, children: "Anchors" }), _jsx("span", { style: thStyle, children: "Bends" }), _jsx("span", { style: thStyle, children: "Skew" }), _jsx("span", { style: thStyle, children: layoutResult ? 'Live' : '' })] }), filtered.map(t => (_jsx(SummaryRow, { type: t, isExpanded: expandedCode === t.code, onToggle: () => setExpandedCode(prev => prev === t.code ? null : t.code), liveCount: liveCountByCode[t.code], showLive: Boolean(layoutResult) }, t.code)))] }), _jsx(RefTable, { title: "Skew \u2192 ElbowYPolicy mapping", subtitle: "How the right-pane skew label maps to the engine's internal ElbowYPolicy.", cols: ['Skew', 'ElbowYPolicy', 'Effect on elbow position'], rows: [
                    ['near', 'matchSourceConnectionY', 'Elbow hugs source — short first segment, long approach to target'],
                    ['mid', 'midpointY', 'Symmetric Z — elbow at horizontal/vertical midpoint (default)'],
                    ['mid*', 'channelY', 'Mid but snapped to inter-lane gap row; used for cross-lane connections'],
                    ['far', 'matchTargetConnectionY', 'Elbow hugs target — long first segment, short final approach'],
                    ['—', 'fixed + elbowYFixedValue', 'Absolute coordinate; pinned back-route corridors'],
                ] }), _jsxs("div", { style: { border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', marginBottom: 28 }, children: [_jsxs("div", { style: { padding: '12px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }, children: [_jsx("h3", { style: { fontSize: 13, fontWeight: 700, color: '#374151', margin: 0 }, children: "Classification decision tree" }), _jsx("p", { style: { fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }, children: "Priority order used by deriveRoutingTypeCode (and scenarioResolver.ts upstream)." })] }), _jsx("div", { style: { padding: '14px 16px' }, children: _jsx("pre", { style: { fontSize: 11, color: '#374151', margin: 0, lineHeight: 1.8, fontFamily: 'monospace' }, children: `1.  source.id === target.id                       → SLP
2.  scenarioKey includes "loopback"               → TEH (h-v-h) or TEV (v-h-v) — DASHED
3.  bendType = straight, right→left               → STH
4.  bendType = straight, bottom→top               → STV
5.  bendType = h-first                            → SEH  (skew from ElbowYPolicy)
6.  bendType = v-first                            → SEV  (skew from ElbowYPolicy)
7.  bendType = h-v-h, channel != 0               → POH
8.  bendType = h-v-h, elbowYPolicy = near         → DEN
9.  bendType = h-v-h, elbowYPolicy = far          → DEF
    (includes cross-lane-upward where target is right of source)
10. bendType = h-v-h                              → DEH  (mid skew, default)
11. bendType = v-h-v, channel != 0               → POV
12. bendType = v-h-v                              → DEV
13. fallback                                      → AOT

NOTE: cross-lane-upward is NOT a back-route. It classifies as DEH/DEF/DEN
      based on skew. Only scenarioKey "loopback-*" produces TEH/TEV.` }) })] })] }));
};
// ---------------------------------------------------------------------------
// Summary row with expandable detail
// ---------------------------------------------------------------------------
function SummaryRow({ type, isExpanded, onToggle, liveCount, showLive }) {
    const colors = GROUP_COLORS[type.group];
    return (_jsxs(_Fragment, { children: [_jsxs("div", { onClick: onToggle, style: {
                    display: 'grid',
                    gridTemplateColumns: '52px 80px 1fr 90px 60px 80px 72px',
                    padding: '8px 14px',
                    borderBottom: isExpanded ? 'none' : '1px solid #F3F4F6',
                    cursor: 'pointer',
                    background: isExpanded ? '#FAFAFA' : '#fff',
                    alignItems: 'center',
                    gap: 0,
                }, onMouseEnter: e => { if (!isExpanded)
                    e.currentTarget.style.background = '#F9FAFB'; }, onMouseLeave: e => { if (!isExpanded)
                    e.currentTarget.style.background = '#fff'; }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [isExpanded ? _jsx(ChevronDown, { size: 11, color: "#9CA3AF" }) : _jsx(ChevronRight, { size: 11, color: "#9CA3AF" }), _jsx("span", { style: {
                                    fontFamily: 'monospace', fontWeight: 700, fontSize: 11,
                                    background: colors.bg, color: colors.text,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: 4, padding: '1px 4px', whiteSpace: 'nowrap',
                                }, children: type.code })] }), _jsx("div", { style: { paddingRight: 8 }, children: _jsx(MiniDiagram, { points: type.miniPoints, isDashed: type.isDashed, width: 72, height: 44 }) }), _jsxs("div", { children: [_jsx("span", { style: { fontSize: 12, color: '#374151' }, children: type.fullName }), type.isDashed && (_jsx("span", { style: { marginLeft: 6, fontSize: 10, color: '#D97706', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 3, padding: '0 4px' }, children: "dashed" }))] }), _jsxs("span", { style: { fontSize: 10, fontFamily: 'monospace', color: '#6B7280' }, children: [type.sourceAnchor.split(' ')[0], " \u2192 ", type.targetAnchor.split(' ')[0]] }), _jsx("span", { style: { fontSize: 12, color: '#374151', textAlign: 'center' }, children: type.bends === -1 ? '?' : type.bends }), _jsx("span", { style: { fontSize: 11, color: type.skew ? '#6366F1' : '#D1D5DB' }, children: type.skew ? 'near/mid/far' : '—' }), showLive && (_jsx("span", { style: { fontSize: 11, fontWeight: 600, textAlign: 'center', color: liveCount ? '#059669' : '#D1D5DB' }, children: liveCount ?? 0 }))] }), isExpanded && (_jsx("div", { style: { padding: '4px 14px 16px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }, children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '140px 1fr', gap: 20, marginTop: 8 }, children: [_jsxs("div", { children: [_jsx("div", { style: subheadStyle, children: "Geometry" }), _jsx("div", { style: { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, display: 'inline-block' }, children: _jsx(MiniDiagram, { points: type.miniPoints, isDashed: type.isDashed, width: 120, height: 74 }) })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }, children: [_jsx(DetailBlock, { label: "Trigger", value: type.trigger, span: true }), _jsx(DetailBlock, { label: "Source anchor", value: type.sourceAnchor, mono: true }), _jsx(DetailBlock, { label: "Target anchor", value: type.targetAnchor, mono: true }), _jsx(DetailBlock, { label: "Internal bendType", value: type.codeMapping.bendType, mono: true }), _jsx(DetailBlock, { label: "Scenario pattern", value: type.codeMapping.scenarioPattern, mono: true }), _jsx(DetailBlock, { label: "ElbowYPolicy", value: type.codeMapping.elbowYPolicy, mono: true }), type.notes && _jsx(DetailBlock, { label: "Notes", value: type.notes, span: true })] })] }) }))] }));
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildLiveCounts(layoutResult) {
    if (!layoutResult?.edges)
        return {};
    const counts = {};
    for (const edge of layoutResult.edges) {
        const prefs = edge.routing?.preferences;
        if (!prefs?.bendType)
            continue;
        const info = deriveRoutingTypeCode(prefs.bendType, prefs.sourcePortSelected ?? prefs.sourceAnchor, prefs.targetPortSelected ?? prefs.targetAnchor, prefs.portRuleElbowYPolicy ?? 'midpointY', edge.routing?.scenario ?? '', edge.routing?.channel ?? 0, edge.source === edge.target);
        if (info)
            counts[info.code] = (counts[info.code] ?? 0) + 1;
    }
    return counts;
}
function FilterChip({ label, active, onClick, color }) {
    return (_jsx("button", { onClick: onClick, style: {
            fontSize: 11, padding: '3px 10px', borderRadius: 12, cursor: 'pointer', border: 'none',
            background: active ? (color ?? '#6366F1') : '#F3F4F6',
            color: active ? '#fff' : '#6B7280',
            fontWeight: active ? 600 : 400,
            transition: 'all 0.15s',
        }, children: label }));
}
function DetailBlock({ label, value, mono, span }) {
    return (_jsxs("div", { style: span ? { gridColumn: '1 / -1' } : {}, children: [_jsx("div", { style: subheadStyle, children: label }), _jsx("div", { style: { fontSize: 11, color: '#374151', fontFamily: mono ? 'monospace' : undefined, lineHeight: 1.5 }, children: value })] }));
}
function RefTable({ title, subtitle, cols, rows }) {
    return (_jsxs("div", { style: { border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', marginBottom: 28 }, children: [_jsxs("div", { style: { padding: '12px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }, children: [_jsx("h3", { style: { fontSize: 13, fontWeight: 700, color: '#374151', margin: 0 }, children: title }), _jsx("p", { style: { fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }, children: subtitle })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: cols.map(() => 'auto').join(' 1fr ').replace('auto 1fr auto', 'auto 1fr 1fr') }, children: [cols.map((c, i) => (_jsx("div", { style: { padding: '7px 14px', background: '#F9FAFB', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', borderBottom: '1px solid #E5E7EB' }, children: c }, i))), rows.map((row, ri) => row.map((cell, ci) => (_jsx("div", { style: { padding: '7px 14px', fontSize: 11, color: ci === 0 ? '#6366F1' : '#374151', fontFamily: ci < 2 ? 'monospace' : undefined, background: ri % 2 ? '#F9FAFB' : '#fff', borderBottom: '1px solid #F3F4F6' }, children: cell }, `${ri}-${ci}`))))] })] }));
}
const thStyle = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' };
const subheadStyle = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 4 };
