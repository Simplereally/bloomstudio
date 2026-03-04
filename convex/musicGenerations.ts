/**
 * Convex Music Generations Functions
 *
 * Queries and mutations for persisting music generation history
 * and managing like/dislike reactions on tracks.
 */
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

/**
 * Create a new music generation record.
 * Called after a track is successfully generated and its audio uploaded to R2.
 */
export const create = mutation({
    args: {
        prompt: v.string(),
        model: v.string(),
        instrumental: v.boolean(),
        lyrics: v.optional(v.string()),
        estimatedDuration: v.optional(v.number()),
        r2Key: v.optional(v.string()),
        audioUrl: v.optional(v.string()),
        audioSizeBytes: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const id = await ctx.db.insert("musicGenerations", {
            ownerId: identity.subject,
            prompt: args.prompt,
            model: args.model,
            instrumental: args.instrumental,
            lyrics: args.lyrics ?? undefined,
            estimatedDuration: args.estimatedDuration ?? undefined,
            r2Key: args.r2Key ?? undefined,
            audioUrl: args.audioUrl ?? undefined,
            audioSizeBytes: args.audioSizeBytes ?? undefined,
            createdAt: Date.now(),
        })

        return id
    },
})

/**
 * Set or clear a reaction (like/dislike) on a music generation.
 * Passing the same reaction again clears it (toggle behavior).
 */
export const setReaction = mutation({
    args: {
        generationId: v.id("musicGenerations"),
        reaction: v.union(v.literal("like"), v.literal("dislike")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const generation = await ctx.db.get(args.generationId)
        if (!generation) {
            throw new Error("Music generation not found")
        }

        if (generation.ownerId !== identity.subject) {
            throw new Error("Not authorized to modify this generation")
        }

        // Toggle: if same reaction already set, clear it; otherwise set it
        const newReaction =
            generation.reaction === args.reaction ? undefined : args.reaction

        await ctx.db.patch(args.generationId, { reaction: newReaction })

        return { reaction: newReaction ?? null }
    },
})

/**
 * List music generations for the current user (newest first).
 * Supports optional reaction filtering.
 */
export const listByOwner = query({
    args: {
        reaction: v.optional(v.union(v.literal("like"), v.literal("dislike"))),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return []
        }

        const userId = identity.subject

        if (args.reaction !== undefined) {
            return await ctx.db
                .query("musicGenerations")
                .withIndex("by_owner_reaction", (q) =>
                    q.eq("ownerId", userId).eq("reaction", args.reaction)
                )
                .order("desc")
                .collect()
        }

        return await ctx.db
            .query("musicGenerations")
            .withIndex("by_owner", (q) => q.eq("ownerId", userId))
            .order("desc")
            .collect()
    },
})
