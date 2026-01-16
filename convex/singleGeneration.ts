/**
 * Single Image Generation Functions
 * 
 * Server-side image generation using the client-provided Pollinations API key.
 * This is a "fire and forget" pattern - the generation happens on Convex servers.
 * 
 * BYOP (Bring Your Own Pollen) Flow:
 * 1. Client obtains API key from PollenAuth context (stored in localStorage)
 * 2. Client calls startGeneration mutation with the API key
 * 3. Mutation creates a pending generation record and schedules processGeneration with the key
 * 4. processGeneration action (in singleGenerationProcessor.ts) generates image using the key
 * 5. Client observes the generation record status to know when complete
 */

import { ConvexError, v } from "convex/values"
import { internal } from "./_generated/api"
import { internalMutation, internalQuery, mutation, query } from "./_generated/server"
import { analyzePromptForNSFW } from "./lib/nsfwDetection"
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
    // Video-specific parameters
    duration: v.optional(v.number()),
    audio: v.optional(v.boolean()),
    aspectRatio: v.optional(v.string()),
    lastFrameImage: v.optional(v.string()),
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
        /** The Pollinations API key from the client (BYOP flow) */
        apiKey: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        // Validate API key is provided
        if (!args.apiKey || args.apiKey.trim().length === 0) {
            throw new ConvexError({
                code: "MISSING_API_KEY",
                message: "Pollinations API key is required. Please connect to Pollinations first.",
            })
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

        // Schedule the processing action to run immediately with the API key
        await ctx.scheduler.runAfter(0, internal.singleGenerationProcessor.processGeneration, {
            generationId,
            apiKey: args.apiKey,
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
        thumbnailR2Key: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
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

        // Analyze prompt for NSFW content
        const promptAnalysis = analyzePromptForNSFW(args.prompt)
        console.log(`[Prompt Analysis] Score: ${promptAnalysis.confidence}, Sensitive: ${promptAnalysis.isSensitive}, Terms: ${promptAnalysis.matchedTerms.join(", ")}`)

        const imageId = await ctx.db.insert("generatedImages", {
            ownerId: args.ownerId,
            r2Key: args.r2Key,
            url: args.url,
            thumbnailR2Key: args.thumbnailR2Key,
            thumbnailUrl: args.thumbnailUrl,
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

            // Initial sensitive content tagging based on prompt
            // If explicit (>= 0.9), mark Sensitive.
            // If any less, mark Pending (null) to run Phase 3 Prompt Inference.
            isSensitive: promptAnalysis.confidence >= 0.9 ? true : null,
            sensitiveSource: promptAnalysis.confidence >= 0.9 ? "prompt_analysis" : undefined,
            sensitiveConfidence: promptAnalysis.confidence,
        })

        // Schedule async Prompt Inference (Phase 3) if prompt was not explicitly flagged
        // This ensures "Gate 2" runs on everything that isn't already caught by Gate 1.
        if (promptAnalysis.confidence < 0.9) {
            await ctx.scheduler.runAfter(0, internal.promptInference.analyzePromptImage, {
                imageId,
                prompt: args.prompt,
            })
        }

        return imageId
    },
})
