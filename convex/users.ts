/**
 * Convex User Functions
 *
 * Queries and mutations for user management and API key storage.
 */
import { v } from "convex/values"
import { internalQuery, mutation, query } from "./_generated/server"
import { generateRandomUsername } from "./usernameGenerator"

/**
 * Get or create a user record based on the authenticated Clerk identity.
 * This should be called when a user first accesses the app.
 */
export const getOrCreateUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const clerkId = identity.subject

        // Check if user already exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
            .unique()

        if (existingUser) {
            // Update user info if changed, but only for defined fields to avoid overwriting with undefined
            const patch: Partial<{
                email: string;
                name: string;
                pictureUrl: string;
            }> = {}

            if (identity.email !== undefined && identity.email !== existingUser.email) {
                patch.email = identity.email
            }
            if (identity.name !== undefined && identity.name !== existingUser.name) {
                patch.name = identity.name
            }
            if (identity.pictureUrl !== undefined && identity.pictureUrl !== existingUser.pictureUrl) {
                patch.pictureUrl = identity.pictureUrl
            }

            if (Object.keys(patch).length > 0) {
                await ctx.db.patch(existingUser._id, {
                    ...patch,
                    updatedAt: Date.now(),
                })
            }

            return existingUser._id
        }

        // Create new user with auto-generated username
        const username = generateRandomUsername()
        const userId = await ctx.db.insert("users", {
            clerkId,
            email: identity.email,
            name: identity.name,
            username,
            pictureUrl: identity.pictureUrl,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        })

        return userId
    },
})

/**
 * Get the current authenticated user's record.
 */
export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return null
        }

        return await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique()
    },
})

/**
 * Set the Pollinations API key for the current user.
 * The key should be encrypted before calling this mutation.
 */
export const setPollinationsApiKey = mutation({
    args: {
        encryptedApiKey: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique()

        if (!user) {
            throw new Error("User not found. Call getOrCreateUser first.")
        }

        await ctx.db.patch(user._id, {
            pollinationsApiKey: args.encryptedApiKey,
            updatedAt: Date.now(),
        })

        return { success: true }
    },
})

/**
 * Get the encrypted Pollinations API key for the current user.
 * The key must be decrypted on the client/server side.
 */
export const getPollinationsApiKey = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return null
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique()

        return user?.pollinationsApiKey ?? null
    },
})

/**
 * Internal query to get a user's encrypted API key by their Clerk ID.
 * Used by internal actions like batch processing.
 */
export const getEncryptedApiKeyByClerkId = internalQuery({
    args: {
        clerkId: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
            .unique()

        return user?.pollinationsApiKey ?? null
    },
})

/**
 * Remove the Pollinations API key for the current user.
 */
export const removePollinationsApiKey = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique()

        if (!user) {
            throw new Error("User not found")
        }

        await ctx.db.patch(user._id, {
            pollinationsApiKey: undefined,
            updatedAt: Date.now(),
        })

        return { success: true }
    },
})

/**
 * Update the current user's username.
 */
export const updateUsername = mutation({
    args: {
        username: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        // Validate username
        const username = args.username.trim()
        if (username.length < 3) {
            throw new Error("Username must be at least 3 characters")
        }
        if (username.length > 30) {
            throw new Error("Username must be 30 characters or less")
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            throw new Error("Username can only contain letters, numbers, and underscores")
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .unique()

        if (!user) {
            throw new Error("User not found")
        }

        await ctx.db.patch(user._id, {
            username,
            updatedAt: Date.now(),
        })

        return { success: true }
    },
})

/**
 * Get a user's public profile by username.
 */
export const getUserProfile = query({
    args: {
        username: v.string(),
    },
    handler: async (ctx, args) => {
        // Query users table, scan for username match (since it's not indexed by username yet)
        // Optimization: Use an index on username if this becomes slow.
        // For now, identity scan on small userbase is acceptable, but let's check if we can index.
        // We added a username field, but didn't index it in schema.ts.
        // Let's rely on filter for now or index it.
        // Actually, we should probably add an index "by_username" to schema.ts if we want this to be fast.
        // But for this change, I'll restrict to just scanning or filtering.
        // Wait, schema.ts allows defining indexes.

        // Let's filter for now to avoid re-editing schema immediately if not strictly required,
        // but for a real profile page, filtering is bad.
        // However, I can't effectively filter without a full table scan without an index.
        // I will assume for now I will filter.

        // Efficiently lookup by username using the index
        const user = await ctx.db
            .query("users")
            .withIndex("by_username", q => q.eq("username", args.username))
            .unique()

        if (!user) {
            return null
        }

        return {
            _id: user._id,
            clerkId: user.clerkId,
            username: user.username,
            pictureUrl: user.pictureUrl,
            followersCount: user.followersCount ?? 0,
            followingCount: user.followingCount ?? 0,
            imagesCount: user.imagesCount ?? 0,
            createdAt: user.createdAt,
        }
    },
})
