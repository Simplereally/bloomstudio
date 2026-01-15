
import { query } from "./_generated/server";

export const getTaggingStatus = query({
    args: {},
    handler: async (ctx) => {
        // Count tagged images (explicit true or false)
        const taggedSafe = await ctx.db
            .query("generatedImages")
            .withIndex("by_sensitivity", (q) => q.eq("isSensitive", false))
            .collect();

        const taggedSensitive = await ctx.db
            .query("generatedImages")
            .withIndex("by_sensitivity", (q) => q.eq("isSensitive", true))
            .collect();

        // Count pending (null)
        const pending = await ctx.db
            .query("generatedImages")
            .withIndex("by_sensitivity", (q) => q.eq("isSensitive", null))
            .collect();

        // Count legacy (undefined) - manually filtering
        const allImages = await ctx.db.query("generatedImages").collect();
        const legacy = allImages.filter((img) => img.isSensitive === undefined);

        return {
            total: allImages.length,
            taggedSafe: taggedSafe.length,
            taggedSensitive: taggedSensitive.length,
            pending: pending.length,
            legacy: legacy.length,
            completionRate: `${(((taggedSafe.length + taggedSensitive.length) / allImages.length) * 100).toFixed(1)}%`
        };
    },
});
