/**
 * Curtain Geometry Controller
 *
 * Single controller for all curtain width and position calculations.
 * ProcessCanvas is a renderer — it must not contain geometry logic.
 * All curtain sizing decisions belong here.
 *
 * A curtain is the inbound (left) or outbound (right) interface zone that
 * frames boundary events at the edges of the process model.
 */
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
/** Minimum gap between a curtain's right/left edge and the nearest swimlane. */
const CURTAIN_LANE_GAP = 10;
/** Absolute minimum curtain width to keep it visible. */
const CURTAIN_MIN_WIDTH = 8;
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
/**
 * Derives the pixel geometry for both interface curtains from the current
 * layout result. All sizing decisions are made here and returned as a plain
 * value object for the renderer to consume without further calculation.
 */
export function computeCurtainGeometry(input) {
    const { inboundEventNodes, outboundEventNodes, minLaneX, maxLaneX, padding, boundsWidth, canvasTokens, estimatedCharWidth, textPaddingX, } = input;
    const estimateTextWidth = (text) => text.length * estimatedCharWidth + textPaddingX;
    const estimateZoneWidth = (eventNodes) => {
        const maxShapeWidth = Math.max(...eventNodes.map((n) => n.layoutWidth ?? n.width));
        const maxLabelWidth = Math.max(...eventNodes.map((n) => estimateTextWidth(n.label)));
        // Zone must fit: shape (3× diameter), label, and minimum base width.
        return Math.max(canvasTokens.baseCurtainWidth, maxShapeWidth * 3, maxLabelWidth + padding / 2);
    };
    // --- Left (inbound) ---
    let leftCenter = padding;
    let leftWidth = canvasTokens.baseCurtainWidth;
    if (inboundEventNodes.length > 0) {
        const minEventX = Math.min(...inboundEventNodes.map((n) => n.x));
        leftCenter = padding + minEventX;
        leftWidth = Math.max(leftWidth, estimateZoneWidth(inboundEventNodes));
        const maxAllowedRight = minLaneX - CURTAIN_LANE_GAP;
        if (leftCenter + leftWidth / 2 > maxAllowedRight) {
            const allowed = (maxAllowedRight - leftCenter) * 2;
            leftWidth = Math.max(CURTAIN_MIN_WIDTH, Math.min(leftWidth, allowed));
            leftCenter = Math.min(leftCenter, maxAllowedRight - leftWidth / 2);
        }
    }
    leftWidth = Math.max(CURTAIN_MIN_WIDTH, leftWidth);
    // --- Right (outbound) ---
    let rightCenter = padding + boundsWidth;
    let rightWidth = canvasTokens.baseCurtainWidth;
    if (outboundEventNodes.length > 0) {
        const maxEventX = Math.max(...outboundEventNodes.map((n) => n.x));
        rightCenter = padding + maxEventX;
        rightWidth = Math.max(rightWidth, estimateZoneWidth(outboundEventNodes));
        const minAllowedLeft = maxLaneX + CURTAIN_LANE_GAP;
        if (rightCenter - rightWidth / 2 < minAllowedLeft) {
            const allowed = (rightCenter - minAllowedLeft) * 2;
            rightWidth = Math.max(CURTAIN_MIN_WIDTH, Math.min(rightWidth, allowed));
            rightCenter = Math.max(rightCenter, minAllowedLeft + rightWidth / 2);
        }
    }
    rightWidth = Math.max(CURTAIN_MIN_WIDTH, rightWidth);
    return {
        left: { x: leftCenter - leftWidth / 2, center: leftCenter, width: leftWidth },
        right: { x: rightCenter - rightWidth / 2, center: rightCenter, width: rightWidth },
    };
}
