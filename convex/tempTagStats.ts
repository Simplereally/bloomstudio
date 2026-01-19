
import { query } from "./_generated/server";

/**
 * Stats Query for NSFW Tagging Progress
 *
 * Performance Optimization Strategy:
 * 1. First, check if any legacy (undefined) records exist via filtered query
 * 2. If NO legacy records: Use only 3 indexed queries (O(log n) each)
 * 3. If legacy exists: Fall back to full scan to count accurately
 *
 * Post-migration (no legacy), this query is highly efficient.
 * Pre-migration, it still requires a full scan for accuracy.
 *
 * Index used: by_sensitivity [isSensitive, createdAt]
 *
 * For true O(1) counts at any scale, consider @convex-dev/aggregate component.
 */
export const getTaggingStatus = query({
    args: {},
    handler: async (ctx) => {
        // Step 1: Run 3 efficient indexed queries in parallel
        const [safeImages, sensitiveImages, pendingImages] = await Promise.all([
            ctx.db
                .query("generatedImages")
                .withIndex("by_sensitivity", (q) => q.eq("isSensitive", false))
                .collect(),

            ctx.db
                .query("generatedImages")
                .withIndex("by_sensitivity", (q) => q.eq("isSensitive", true))
                .collect(),

            ctx.db
                .query("generatedImages")
                .withIndex("by_sensitivity", (q) => q.eq("isSensitive", null))
                .collect(),
        ]);

        const safe = safeImages.length;
        const sensitive = sensitiveImages.length;
        const pending = pendingImages.length;

        // Step 2: Check if we need to count legacy records
        // Efficient filter scan - stops at first match
        const hasLegacy = await ctx.db
            .query("generatedImages")
            .filter((q) =>
                q.and(
                    q.neq(q.field("isSensitive"), true),
                    q.neq(q.field("isSensitive"), false),
                    q.neq(q.field("isSensitive"), null)
                )
            )
            .first();

        let legacy = 0;
        let total: number;

        if (hasLegacy) {
            // Legacy records exist - need full scan for accurate count
            const allImages = await ctx.db.query("generatedImages").collect();
            total = allImages.length;
            legacy = total - safe - sensitive - pending;
        } else {
            // No legacy records - total is just the sum of indexed counts
            total = safe + sensitive + pending;
        }

        const tagged = safe + sensitive;

        const completionRate = total > 0
            ? `${((tagged / total) * 100).toFixed(1)}%`
            : "N/A (no images)";

        return {
            total,
            taggedSafe: safe,
            taggedSensitive: sensitive,
            pending,
            legacy,
            completionRate,
        };
    },
});


