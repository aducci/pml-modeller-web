/**
 * NodeRenderModel — canonical render contract between layout engine and SVG output.
 *
 * The renderer consumes this exclusively. Nothing in ProcessCanvas reads
 * LayoutNode directly — it reads NodeRenderModel.
 *
 * Policy: All rendering decisions (colours, visibility, icon layout) are made
 * in buildNodeRenderModels(). ProcessCanvas is a pure renderer — no decision logic.
 *
 * Policy: Interaction state (isHovered, isSelected) is NOT in this model.
 * It is applied as CSS classes on the <g> element at render time, not as
 * fields in NodeRenderModel. This keeps the model stable across interaction
 * events and avoids triggering re-computation on hover/select.
 */
export {};
