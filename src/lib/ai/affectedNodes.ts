/**
 * extractAffectedNodeIds — pure helper reading a PmlPatch[] array and
 * returning every node id the patch set touches, directly (not via a
 * Finding's evidence — a proposal's patches are the ground truth for what
 * they affect).
 *
 * Used for a minimal preview effect (docs/FINAL/13_Phase_E_Findings_Drive_Canvas_Plan.md
 * E.4): while a PatchProposal is pending, its affected nodes are highlighted
 * via the same highlightNodeIds spotlight primitive E.1 built for Finding
 * evidence — not a true ghost-node/ghost-edge rendering (that needs new
 * canvas primitives, deliberately out of scope for this minimal pass; see
 * doc 13's E.4 status entry for the full scoping decision).
 */

import type { PmlPatch } from 'pml-core';

export function extractAffectedNodeIds(patches: PmlPatch[]): string[] {
  const ids = new Set<string>();
  for (const patch of patches) {
    switch (patch.op) {
      case 'add-node':
        ids.add(patch.node.id);
        break;
      case 'update-node':
      case 'remove-node':
        ids.add(patch.nodeId);
        break;
      case 'add-edge':
        ids.add(patch.edge.source);
        ids.add(patch.edge.target);
        break;
      case 'update-edge':
        // UpdateEdgePatch only carries edgeId, not source/target — nothing
        // more specific to highlight than the edge itself, which
        // highlightNodeIds (node-only, per E.1's documented scope) can't
        // represent. No node ids to add here.
        break;
      case 'remove-edge':
        if (patch.source) ids.add(patch.source);
        if (patch.target) ids.add(patch.target);
        break;
      case 'update-process':
        // Process-header-level change — no specific node to highlight.
        break;
    }
  }
  return Array.from(ids);
}
