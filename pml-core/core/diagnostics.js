/**
 * Compute an overall model quality score from a set of diagnostics.
 * Returns a value from 0–100 where 100 is perfect.
 */
export function computeQualityScore(diagnostics) {
    let score = 100;
    for (const d of diagnostics) {
        const impact = d.qualityImpact ?? (d.severity === 'error' ? -15 :
            d.severity === 'warning' ? -5 :
                0);
        score = Math.max(0, score + impact);
    }
    return score;
}
