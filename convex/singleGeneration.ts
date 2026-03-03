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
 * Get statuses for multiple generations in one query.
 */
export const getGenerationsStatus = query({
    args: {
        generationIds: v.array(v.id("pendingGenerations")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity || args.generationIds.length === 0) {
            return []
        }

        // Dedupe and cap the number of IDs to prevent unbounded fan-out
        const MAX_IDS = 100
        const uniqueIds = [...new Set(args.generationIds)]
        if (uniqueIds.length > MAX_IDS) {
            throw new ConvexError({
                code: "TOO_MANY_IDS",
                message: `Cannot query more than ${MAX_IDS} generation IDs at once (got ${uniqueIds.length}).`,
            })
        }

        const generations = await Promise.all(
            uniqueIds.map((generationId) => ctx.db.get(generationId))
        )

        return generations.filter(
            (generation): generation is NonNullable<typeof generation> =>
                generation !== null && generation.ownerId === identity.subject
        )
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

        // Use indexed queries to only fetch active statuses (P0 Optimization)
        const [pending, processing] = await Promise.all([
            ctx.db
                .query("pendingGenerations")
                .withIndex("by_owner_status", (q) =>
                    q.eq("ownerId", identity.subject).eq("status", "pending")
                )
                .order("desc")
                .collect(),
            ctx.db
                .query("pendingGenerations")
                .withIndex("by_owner_status", (q) =>
                    q.eq("ownerId", identity.subject).eq("status", "processing")
                )
                .order("desc")
                .collect(),
        ])

        return [...pending, ...processing].sort((a, b) => b.createdAt - a.createdAt)
    },
})

/**
 * Cancel a single generation by ID.
 * This is a soft-cancel: processor actions check status and skip persistence.
 */
export const cancelGeneration = mutation({
    args: {
        generationId: v.id("pendingGenerations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const generation = await ctx.db.get(args.generationId)
        if (!generation || generation.ownerId !== identity.subject) {
            throw new Error("Generation not found")
        }

        if (generation.status !== "pending" && generation.status !== "processing") {
            return { success: false }
        }

        await ctx.db.patch(args.generationId, {
            status: "cancelled",
            updatedAt: Date.now(),
        })

        return { success: true }
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
            v.literal("failed"),
            v.literal("cancelled")
        ),
        errorMessage: v.optional(v.string()),
        /** HTTP error code from Pollinations API (401=auth, 402=budget, 403=access) */
        errorCode: v.optional(v.number()),
        imageId: v.optional(v.id("generatedImages")),
        retryCount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const updates: {
            status: typeof args.status
            updatedAt: number
            errorMessage?: string
            errorCode?: number
            imageId?: typeof args.imageId
            retryCount?: number
        } = {
            status: args.status,
            updatedAt: Date.now(),
        }

        if (args.errorMessage !== undefined) {
            updates.errorMessage = args.errorMessage
        }
        if (args.errorCode !== undefined) {
            updates.errorCode = args.errorCode
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
        previewR2Key: v.optional(v.string()),
        previewUrl: v.optional(v.string()),
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

        // Private images (unlisted) bypass NSFW detection entirely.
        // They are never shown in public feeds, so content analysis is unnecessary.
        const isPrivate = args.visibility === "unlisted"

        let isSensitive: boolean | null = false
        let sensitiveSource: "prompt_analysis" | undefined = undefined
        let sensitiveConfidence = 0

        if (!isPrivate) {
            // Analyze prompt for NSFW content (public images only)
            const promptAnalysis = analyzePromptForNSFW(args.prompt)
            console.log(`[Prompt Analysis] Score: ${promptAnalysis.confidence}, Sensitive: ${promptAnalysis.isSensitive}, Terms: ${promptAnalysis.matchedTerms.join(", ")}`)

            isSensitive = promptAnalysis.confidence >= 0.9 ? true : null
            sensitiveSource = promptAnalysis.confidence >= 0.9 ? "prompt_analysis" : undefined
            sensitiveConfidence = promptAnalysis.confidence
        } else {
            console.log(`[Prompt Analysis] Skipped — private image`)
        }

        const imageId = await ctx.db.insert("generatedImages", {
            ownerId: args.ownerId,
            r2Key: args.r2Key,
            url: args.url,
            thumbnailR2Key: args.thumbnailR2Key,
            thumbnailUrl: args.thumbnailUrl,
            previewR2Key: args.previewR2Key,
            previewUrl: args.previewUrl,
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
            visibility: args.visibility,
            createdAt: now,

            isSensitive,
            sensitiveSource,
            sensitiveConfidence,
        })

        // Store heavy details in side table (P0 Optimization)
        await ctx.db.insert("generatedImageDetails", {
            imageId,
            generationParams: args.generationParams,
        })

        // Schedule async Prompt Inference (Phase 3) only for public images
        // that were not explicitly flagged by Gate 1.
        if (!isPrivate && sensitiveConfidence < 0.9) {
            await ctx.scheduler.runAfter(0, internal.promptInference.analyzePromptImage, {
                imageId,
                prompt: args.prompt,
            })
        }

        return imageId
    },
})
