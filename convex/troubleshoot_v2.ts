
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const verifyUserAndGenerations = internalQuery({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();
            
        if (!user) return { error: "User not found" };
        
        const allPendingGenerations = await ctx.db
            .query("pendingGenerations")
            .withIndex("by_owner", (q) => q.eq("ownerId", user.clerkId))
            .collect();
            
        const activeGenerations = allPendingGenerations.filter(g => 
            g.status === "pending" || g.status === "processing"
        );

        // Check batch jobs for this user
        const allBatchJobs = await ctx.db
            .query("batchJobs")
            .withIndex("by_owner", (q) => q.eq("ownerId", user.clerkId))
            .collect();

        const activeBatchJobs = allBatchJobs.filter(b =>
            b.status === "pending" || b.status === "processing" || b.status === "paused"
        );

        // Check for similar emails (fuzzy match)
        const emailBase = args.email.split("@")[0].toLowerCase();
        const allUsers = await ctx.db.query("users").collect();
        const similarUsers = allUsers.filter(u => {
            if (!u.email || u.email === args.email) return false;
            const otherBase = u.email.split("@")[0].toLowerCase();
            return otherBase.includes(emailBase) || emailBase.includes(otherBase);
        });

        return {
            user: {
                id: user._id,
                clerkId: user.clerkId,
                email: user.email
            },
            totalCount: allPendingGenerations.length,
            activeCount: activeGenerations.length,
            activeGenerations: activeGenerations.map(g => ({
                id: g._id,
                status: g.status,
                createdAt: new Date(g.createdAt).toISOString(),
                updatedAt: new Date(g.updatedAt).toISOString(),
                params: g.generationParams
            })),
            batchJobs: {
                totalCount: allBatchJobs.length,
                activeCount: activeBatchJobs.length,
                activeBatchJobs: activeBatchJobs.map(b => ({
                    id: b._id,
                    status: b.status,
                    totalCount: b.totalCount,
                    completedCount: b.completedCount,
                    failedCount: b.failedCount,
                    inFlightCount: b.inFlightCount ?? 0,
                    createdAt: new Date(b.createdAt).toISOString(),
                    updatedAt: new Date(b.updatedAt).toISOString(),
                })),
            },
            similarUsers: similarUsers.map(u => ({
                id: u._id,
                clerkId: u.clerkId,
                email: u.email,
            })),
        };
    },
});

/**
 * Diagnostic: check what the cleanup cron actually sees
 */
export const diagnoseCronCleanup = internalQuery({
    args: {},
    handler: async (ctx) => {
        const STUCK_GENERATION_THRESHOLD_MS = 15 * 60 * 1000;
        const cutoff = Date.now() - STUCK_GENERATION_THRESHOLD_MS;

        const [pending, processing] = await Promise.all([
            ctx.db
                .query("pendingGenerations")
                .withIndex("by_status", (q) => q.eq("status", "pending"))
                .collect(),
            ctx.db
                .query("pendingGenerations")
                .withIndex("by_status", (q) => q.eq("status", "processing"))
                .collect(),
        ]);

        const allActive = [...pending, ...processing];
        const stuck = allActive.filter((g) => g.updatedAt < cutoff);

        return {
            now: new Date(Date.now()).toISOString(),
            cutoff: new Date(cutoff).toISOString(),
            totalPending: pending.length,
            totalProcessing: processing.length,
            totalActive: allActive.length,
            stuckCount: stuck.length,
            stuckGenerations: stuck.map(g => ({
                id: g._id,
                ownerId: g.ownerId,
                status: g.status,
                createdAt: new Date(g.createdAt).toISOString(),
                updatedAt: new Date(g.updatedAt).toISOString(),
            })),
            // Show non-stuck too for comparison
            nonStuckGenerations: allActive.filter(g => g.updatedAt >= cutoff).map(g => ({
                id: g._id,
                ownerId: g.ownerId,
                status: g.status,
                createdAt: new Date(g.createdAt).toISOString(),
                updatedAt: new Date(g.updatedAt).toISOString(),
            })),
        };
    },
});

/**
 * Force-clean stuck generations for a specific user by email
 */
export const forceCleanStuckGenerations = internalMutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();
            
        if (!user) return { error: "User not found" };

        const allPendingGenerations = await ctx.db
            .query("pendingGenerations")
            .withIndex("by_owner", (q) => q.eq("ownerId", user.clerkId))
            .collect();

        const stuck = allPendingGenerations.filter(g =>
            g.status === "pending" || g.status === "processing"
        );

        for (const g of stuck) {
            const ageMinutes = Math.round((Date.now() - g.updatedAt) / 60_000);
            await ctx.db.patch(g._id, {
                status: "failed",
                errorMessage: `Generation timed out after ${ageMinutes} minutes (force-cleaned by admin)`,
                updatedAt: Date.now(),
            });
        }

        return {
            cleaned: stuck.length,
            generationIds: stuck.map(g => g._id),
        };
    },
});
