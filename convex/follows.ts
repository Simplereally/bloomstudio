import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

/**
 * Follow a user.
 */
export const follow = mutation({
    args: {
        followeeId: v.string(), // Clerk ID of the user to follow
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const followerId = identity.subject
        const { followeeId } = args

        if (followerId === followeeId) {
            throw new Error("Cannot follow yourself")
        }

        // Check if already following
        const existing = await ctx.db
            .query("follows")
            .withIndex("by_both", (q) =>
                q.eq("followerId", followerId).eq("followeeId", followeeId)
            )
            .unique()

        if (existing) {
            return // Already following
        }

        await ctx.db.insert("follows", {
            followerId,
            followeeId,
            createdAt: Date.now(),
        })

        // Update counts (optimistic or separate task? simple increment for now)
        // Note: Ideally transactions would be better but Convex handles concurrency well.
        // We'll update the user records if they exist in our DB.
        // Warning: This requires users to be in our `users` table.
        
        const follower = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", followerId)).unique()
        if (follower) {
             await ctx.db.patch(follower._id, { followingCount: (follower.followingCount ?? 0) + 1 })
        }

        const followee = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", followeeId)).unique()
        if (followee) {
             await ctx.db.patch(followee._id, { followersCount: (followee.followersCount ?? 0) + 1 })
        }
    },
})

/**
 * Unfollow a user.
 */
export const unfollow = mutation({
    args: {
        followeeId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const followerId = identity.subject
        const { followeeId } = args

        const existing = await ctx.db
            .query("follows")
            .withIndex("by_both", (q) =>
                q.eq("followerId", followerId).eq("followeeId", followeeId)
            )
            .unique()

        if (!existing) {
            return // Not following
        }

        await ctx.db.delete(existing._id)

         // decrement counts
        const follower = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", followerId)).unique()
        if (follower) {
             await ctx.db.patch(follower._id, { followingCount: Math.max(0, (follower.followingCount ?? 1) - 1) })
        }

        const followee = await ctx.db.query("users").withIndex("by_clerk_id", q => q.eq("clerkId", followeeId)).unique()
        if (followee) {
             await ctx.db.patch(followee._id, { followersCount: Math.max(0, (followee.followersCount ?? 1) - 1) })
        }
    },
})

/**
 * Check if the current user is following a specific user.
 */
export const isFollowing = query({
    args: {
        followeeId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return false
        }

        const followerId = identity.subject
        const { followeeId } = args

        const existing = await ctx.db
            .query("follows")
            .withIndex("by_both", (q) =>
                q.eq("followerId", followerId).eq("followeeId", followeeId)
            )
            .unique()

        return !!existing
    },
})

/**
 * Get follower count for a user.
 */
export const getFollowStats = query({
    args: {
        userId: v.string(), // Clerk ID
    },
    handler: async (ctx, args) => {
        // We can use the denormalized counts on the user object if available, 
        // or count directly if we want strict accuracy (though slower).
        // Let's rely on the user object fields we added.
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
            .unique()
        
        return {
            followers: user?.followersCount ?? 0,
            following: user?.followingCount ?? 0,
        }
    }
})
