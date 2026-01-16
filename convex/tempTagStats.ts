
import { query } from "./_generated/server";

/**
 * Temporary Stats Query for Tagging Migration Progress
 *
 * Performance Notes:
 * - This performs a single full table scan (unavoidable for counting "legacy" undefined fields)
 * - Aggregation is computed in-memory in O(n) time
 * - For production use with large tables, consider using @convex-dev/aggregate component
 *   which maintains denormalized counts for O(1) retrieval
 *
 * @see https://www.convex.dev/components/aggregate
 */
export const getTaggingStatus = query({
    args: {},
    handler: async (ctx) => {
        // Single table scan with in-memory aggregation
        // This is more efficient than 4 separate queries (3 indexed + 1 full scan)
        // since we need the full scan anyway to detect "undefined" legacy records
        const allImages = await ctx.db.query("generatedImages").collect();

        // Aggregate counts in a single pass
        const counts = allImages.reduce(
            (acc, img) => {
                if (img.isSensitive === false) {
                    acc.safe++;
                } else if (img.isSensitive === true) {
                    acc.sensitive++;
                } else if (img.isSensitive === null) {
                    acc.pending++;
                } else {
                    // isSensitive is undefined (legacy records)
                    acc.legacy++;
                }
                return acc;
            },
            { safe: 0, sensitive: 0, pending: 0, legacy: 0 }
        );

        const total = allImages.length;
        const tagged = counts.safe + counts.sensitive;

        // Guard against division-by-zero
        const completionRate = total > 0
            ? `${((tagged / total) * 100).toFixed(1)}%`
            : "N/A (no images)";

        return {
            total,
            taggedSafe: counts.safe,
            taggedSensitive: counts.sensitive,
            pending: counts.pending,
            legacy: counts.legacy,
            completionRate,
        };
    },
});
