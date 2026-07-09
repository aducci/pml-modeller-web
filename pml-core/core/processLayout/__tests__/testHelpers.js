/**
 * Test helpers for layout pipeline tests.
 * Provides PML fixtures, a run helper, and snapshot serialization.
 */
import { parsePmlTextToProcessModel } from '../../adapters/pmlTextParser';
import { pmlToNormalizedGraphWithDiagnostics } from '../../adapters/pmlToNormalizedGraph';
import { computeProcessLayout } from '../index';
// ── PML fixtures ──────────────────────────────────────────────────────────────
export const PML_FIXTURES = {
    'same-lane-straight': `
@process L3 "Same Lane Straight"
actor Operations
    event(message) start inbound
    task validate  "Validate"
    task process   "Process"
    event(message) done to=System
flow
    start > validate > process > done
`,
    'cross-lane-downward': `
@process L3 "Cross Lane Downward"
actor Operations
    event(message) request inbound
    task handoff  "Handoff"
actor Fulfillment
    task receive  "Receive"
    task execute  "Execute"
    event(message) done to=System
flow
    request > handoff > receive > execute > done
`,
    'split-rejoin': `
@process L3 "Split Rejoin"
actor Operations
    event(message) start inbound
    task intake    "Intake"
    task path_a    "Ops Path"
    task finalise  "Finalise"
    decision split_gate
        ops_path      > path_a
        customer_path > customer_action
    decision join_gate
        merged > finalise
    event(message) done to=System
actor Customer
    task customer_action "Customer Action"
flow
    start > intake > split_gate
    path_a          > join_gate
    customer_action > join_gate
    join_gate > finalise > done
`,
    'loopback': `
@process L3 "Loopback"
actor Operations
    event(message) start from=Channel
    task attempt      "Attempt"
    task check        "Check"
    task retry_action "Retry"
    decision check_gate
        pass  > done
        retry > retry_action
    event(message) done to=Channel
flow
    start > attempt > check > check_gate
    retry_action > attempt
`,
    'multi-lane-fan': `
@process L3 "Multi Lane Fan"
actor Sales
    event(message) order inbound
    task qualify   "Qualify"
    decision route_gate
        to_ops     > ops_task
        to_finance > finance_task
        to_legal   > legal_task
actor Operations
    task ops_task  "Ops Work"
    event(message) ops_done to=System
actor Finance
    task finance_task "Finance Work"
    event(message) fin_done to=System
actor Legal
    task legal_task  "Legal Work"
    event(message) leg_done to=System
flow
    order > qualify > route_gate
    ops_task > ops_done
    finance_task > fin_done
    legal_task > leg_done
`,
};
export function runLayout(pml) {
    const rawModel = parsePmlTextToProcessModel(pml);
    const { graph } = pmlToNormalizedGraphWithDiagnostics(rawModel);
    if (!graph)
        throw new Error('Parse produced null graph');
    return computeProcessLayout(graph);
}
export function runLayoutWithSettings(pml, settings) {
    const rawModel = parsePmlTextToProcessModel(pml);
    const { graph } = pmlToNormalizedGraphWithDiagnostics(rawModel);
    if (!graph)
        throw new Error('Parse produced null graph');
    return computeProcessLayout(graph, settings);
}
export function toSnapshot(result) {
    return {
        fingerprint: result.diagnostics.determinismFingerprint ?? '',
        nodes: result.nodes
            .slice()
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((n) => ({
            id: n.id,
            x: Math.round(n.x ?? 0),
            y: Math.round(n.y ?? 0),
            laneId: n.laneId ?? '',
        })),
        edges: result.edges
            .slice()
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((e) => ({
            id: e.id,
            scenario: e.routing?.scenario ?? 'none',
            waypointCount: e.routing?.waypoints?.length ?? 0,
            channel: e.routing?.channel ?? 0,
        })),
        lanes: result.lanes
            .slice()
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((l) => ({
            id: l.id,
            y: Math.round(l.y),
            height: Math.round(l.height),
        })),
    };
}
