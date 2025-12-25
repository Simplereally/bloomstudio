/**
 * Convex User Functions
 *
 * Queries and mutations for user management and API key storage.
 */
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

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
            // Update user info if changed
            const needsUpdate =
                existingUser.email !== identity.email ||
                existingUser.name !== identity.name

            if (needsUpdate) {
                await ctx.db.patch(existingUser._id, {
                    email: identity.email,
                    name: identity.name,
                    updatedAt: Date.now(),
                })
            }

            return existingUser._id
        }

        // Create new user
        const userId = await ctx.db.insert("users", {
            clerkId,
            email: identity.email,
            name: identity.name,
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
