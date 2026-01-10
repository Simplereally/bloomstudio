/**
 * Single Image Generation Functions
 * 
 * Server-side image generation using the user's stored Pollinations API key.
 * This is a "fire and forget" pattern - the generation happens on Convex servers.
 * 
 * Flow:
 * 1. Client calls startGeneration mutation
 * 2. Mutation creates a pending generation record and schedules processGeneration
 * 3. processGeneration action (in singleGenerationProcessor.ts) generates image
 * 4. Client observes the generation record status to know when complete
 */

import { ConvexError, v } from "convex/values"
import { internal } from "./_generated/api"
import { internalMutation, internalQuery, mutation, query } from "./_generated/server"
import { canUserGenerate } from "./lib/subscription"

// ============================================================
// Generation Params Validator
// ============================================================
const generationParamsValidator = v.object({
    prompt: v.string(),
    negativePrompt: v.optional(v.string()),
    model: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    seed: v.optional(v.number()),
    enhance: v.optional(v.boolean()),
    private: v.optional(v.boolean()),
    safe: v.optional(v.boolean()),
    image: v.optional(v.string()),
    quality: v.optional(v.string()),
})

// ============================================================
// Public Mutations & Queries
// ============================================================

/**
 * Start a single image generation.
 * Creates a pending generation record and schedules the processing action.
 * Returns a generation ID that can be used to track progress.
 */
export const startGeneration = mutation({
    args: {
        generationParams: generationParamsValidator,
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        // Check if user can generate (has active subscription or is in trial)
        const accessCheck = await canUserGenerate(ctx, identity.subject)
        if (!accessCheck.allowed) {
            throw new ConvexError({
                code: "TRIAL_EXPIRED",
                message: accessCheck.reason,
            })
        }

        const now = Date.now()

        // Create pending generation record
        const generationId = await ctx.db.insert("pendingGenerations", {
            ownerId: identity.subject,
            status: "pending",
            generationParams: args.generationParams,
            createdAt: now,
            updatedAt: now,
        })

        // Schedule the processing action to run immediately
        await ctx.scheduler.runAfter(0, internal.singleGenerationProcessor.processGeneration, {
            generationId,
        })

        return generationId
    },
})

/**
 * Get the status of a pending generation.
 */
export const getGenerationStatus = query({
    args: {
        generationId: v.id("pendingGenerations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return null
        }

        const generation = await ctx.db.get(args.generationId)
        if (!generation || generation.ownerId !== identity.subject) {
            return null
        }

        return generation
    },
})

/**
 * Get the current user's active (pending/processing) generations.
 */
export const getActiveGenerations = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return []
        }

        const generations = await ctx.db
            .query("pendingGenerations")
            .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
            .order("desc")
            .collect()

        return generations.filter(
            (g) => g.status === "pending" || g.status === "processing"
        )
    },
})

// ============================================================
// Internal Functions
// ============================================================

/**
 * Internal query to get generation record.
 */
export const getGenerationInternal = internalQuery({
    args: {
        generationId: v.id("pendingGenerations"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.generationId)
    },
})

/**
 * Internal mutation to update generation status.
 */
export const updateGenerationStatus = internalMutation({
    args: {
        generationId: v.id("pendingGenerations"),
        status: v.union(
            v.literal("pending"),
            v.literal("processing"),
            v.literal("completed"),
            v.literal("failed")
        ),
        errorMessage: v.optional(v.string()),
        imageId: v.optional(v.id("generatedImages")),
        retryCount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const updates: {
            status: typeof args.status
            updatedAt: number
            errorMessage?: string
            imageId?: typeof args.imageId
            retryCount?: number
        } = {
            status: args.status,
            updatedAt: Date.now(),
        }

        if (args.errorMessage !== undefined) {
            updates.errorMessage = args.errorMessage
        }
        if (args.imageId !== undefined) {
            updates.imageId = args.imageId
        }
        if (args.retryCount !== undefined) {
            updates.retryCount = args.retryCount
        }

        await ctx.db.patch(args.generationId, updates)
    },
})

/**
 * Internal mutation to store the generated image.
 */
export const storeGeneratedImage = internalMutation({
    args: {
        ownerId: v.string(),
        r2Key: v.string(),
        url: v.string(),
        prompt: v.string(),
        width: v.number(),
        height: v.number(),
        model: v.string(),
        seed: v.optional(v.number()),
        contentType: v.string(),
        sizeBytes: v.number(),
        generationParams: v.any(),
        visibility: v.union(v.literal("public"), v.literal("unlisted")),
    },
    handler: async (ctx, args) => {
        const now = Date.now()
        
        const imageId = await ctx.db.insert("generatedImages", {
            ownerId: args.ownerId,
            r2Key: args.r2Key,
            url: args.url,
            filename: `img_${now}_${Math.random().toString(36).substring(2, 9)}`,
            contentType: args.contentType,
            sizeBytes: args.sizeBytes,
            width: args.width,
            height: args.height,
            aspectRatio: Math.max(args.width, args.height) / Math.min(args.width, args.height),
            prompt: args.prompt,
            negativePrompt: undefined,
            model: args.model,
            seed: args.seed,
            generationParams: args.generationParams,
            visibility: args.visibility,
            createdAt: now,
        })

        return imageId
    },
})
