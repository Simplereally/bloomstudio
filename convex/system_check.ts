
import { internalQuery, internalMutation } from "./_generated/server";

export const getSystemTime = internalQuery({
    args: {},
    handler: async (ctx) => {
        return {
            now: Date.now(),
            iso: new Date().toISOString()
        };
    },
});

export const forceCleanupAllStuck = internalMutation({
    args: {},
    handler: async (ctx) => {
        const stuckThreshold = Date.now() - (15 * 60 * 1000);
        
        const stuckPending = await ctx.db
            .query("pendingGenerations")
            .filter(q => q.or(
                q.eq(q.field("status"), "pending"),
                q.eq(q.field("status"), "processing")
            ))
            .filter(q => q.lt(q.field("updatedAt"), stuckThreshold))
            .collect();
            
        for (const g of stuckPending) {
            await ctx.db.patch(g._id, {
                status: "failed",
                errorMessage: "Generation timed out (stuck in processing for over 15 minutes)",
                updatedAt: Date.now()
            });
        }
        
        return { count: stuckPending.length };
    },
});
