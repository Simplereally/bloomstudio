/**
 * Single Image Generation Functions
 * 
 * Server-side image generation using the client-provided Pollinations API key.
 * This is a "fire and forget" pattern - the generation happens asynchronously
 * in the external Cloudflare worker plane while Convex remains the source of truth.
 * 
 * BYOP (Bring Your Own Pollen) Flow:
 * 1. Client obtains API key from PollenAuth context (stored in localStorage)
 * 2. Client calls startGeneration mutation with the API key
 * 3. Mutation creates a pending generation record and schedules Cloudflare dispatch immediately
 * 4. Cloudflare Worker claims the generation, calls Pollinations, uploads media, and finalizes via Convex
 * 5. Client observes the generation record status to know when complete
 */

import { ConvexError, v } from "convex/values"
import { internal } from "./_generated/api"
import { internalMutation, internalQuery, mutation, query, type MutationCtx } from "./_generated/server"
import { decryptApiKey } from "./lib/crypto"
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

const generationLifecycleStatusValidator = v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("cancelled")
)

// ============================================================
// Public Mutations & Queries
// ============================================================

/**
 * Start a single image generation.
 * Creates a pending generation record and schedules the external dispatch action.
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
            dispatchStatus: "pending",
            dispatchAttempts: 0,
            generationParams: args.generationParams,
            createdAt: now,
            updatedAt: now,
        })

        // Schedule external dispatch immediately so the job is truly
        // fire-and-forget and does not depend on a follow-up client action.
        await ctx.scheduler.runAfter(0, internal.cloudflareDispatch.dispatchSingleGeneration, {
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
            dispatchStatus: "cancelled",
            updatedAt: Date.now(),
        })

        return { success: true }
    },
})

/**
 * Cancel all active generations for the current user.
 * This is useful when many queued/processing items need to be cleared at once.
 */
export const cancelAllActiveGenerations = mutation({
    args: {},
    returns: v.object({
        success: v.boolean(),
        cancelledCount: v.number(),
    }),
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const [pending, processing] = await Promise.all([
            ctx.db
                .query("pendingGenerations")
                .withIndex("by_owner_status", (q) =>
                    q.eq("ownerId", identity.subject).eq("status", "pending")
                )
                .collect(),
            ctx.db
                .query("pendingGenerations")
                .withIndex("by_owner_status", (q) =>
                    q.eq("ownerId", identity.subject).eq("status", "processing")
                )
                .collect(),
        ])

        const active = [...pending, ...processing]
        const now = Date.now()

        for (const generation of active) {
            await ctx.db.patch(generation._id, {
                status: "cancelled",
                dispatchStatus: "cancelled",
                updatedAt: now,
            })
        }

        return {
            success: true,
            cancelledCount: active.length,
        }
    },
})

// ============================================================
// Internal Functions
// ============================================================

// ---- Stuck Generation Cleanup ----

/**
 * Maximum age (in ms) before a pending/processing generation is considered stuck.
 *
 * Image generations typically complete in <60s.  Video generations can take
 * several minutes but should never exceed 10 min (Convex action timeout).
 * We use 15 minutes as a conservative threshold that accommodates retries +
 * backoff while still cleaning up genuinely orphaned records.
 */
const STUCK_GENERATION_THRESHOLD_MS = 15 * 60 * 1000 // 15 minutes
const STUCK_GENERATION_CLEANUP_BATCH_SIZE = 100

/**
 * Clean up stuck generations — marks any pending/processing record older than
 * STUCK_GENERATION_THRESHOLD_MS as failed.
 *
 * Designed to be called by a cron job.  Safe to call repeatedly (idempotent).
 */
export const cleanupStuckGenerations = internalMutation({
    args: {},
    handler: async (ctx) => {
        const cutoff = Date.now() - STUCK_GENERATION_THRESHOLD_MS
        const logger = "[StuckCleanup]"

        // Query by dispatch status + updatedAt so the cron only reads stale
        // worker-plane rows instead of scanning every active generation.
        const [pendingDispatch, dispatched, processingDispatch] = await Promise.all([
            ctx.db
                .query("pendingGenerations")
                .withIndex("by_dispatch_status", (q) =>
                    q.eq("dispatchStatus", "pending").lt("updatedAt", cutoff)
                )
                .take(STUCK_GENERATION_CLEANUP_BATCH_SIZE),
            ctx.db
                .query("pendingGenerations")
                .withIndex("by_dispatch_status", (q) =>
                    q.eq("dispatchStatus", "dispatched").lt("updatedAt", cutoff)
                )
                .take(STUCK_GENERATION_CLEANUP_BATCH_SIZE),
            ctx.db
                .query("pendingGenerations")
                .withIndex("by_dispatch_status", (q) =>
                    q.eq("dispatchStatus", "processing").lt("updatedAt", cutoff)
                )
                .take(STUCK_GENERATION_CLEANUP_BATCH_SIZE),
        ])

        const stuck = [...pendingDispatch, ...dispatched, ...processingDispatch].filter(
            (g) => g.status === "pending" || g.status === "processing"
        )

        if (stuck.length === 0) {
            return { cleaned: 0 }
        }

        console.log(`${logger} Found ${stuck.length} stuck generation(s), marking as failed`)

        for (const generation of stuck) {
            const ageMinutes = Math.round((Date.now() - generation.updatedAt) / 60_000)
            console.log(
                `${logger} Failing generation ${generation._id} ` +
                `(status=${generation.status}, age=${ageMinutes}min, owner=${generation.ownerId})`
            )

            await ctx.db.patch(generation._id, {
                status: "failed",
                dispatchStatus: "failed",
                errorMessage: `Generation timed out after ${ageMinutes} minutes (cleaned up by system)`,
                updatedAt: Date.now(),
            })
        }

        return { cleaned: stuck.length }
    },
})

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
 * Atomically claims a pending generation for processing.
 * Only the first dispatcher to claim it should proceed.
 */
export const claimPendingGeneration = internalMutation({
    args: {
        generationId: v.id("pendingGenerations"),
    },
    returns: v.object({
        claimed: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const generation = await ctx.db.get(args.generationId)
        if (!generation || generation.status !== "pending") {
            return { claimed: false }
        }

        await ctx.db.patch(args.generationId, {
            status: "processing",
            dispatchStatus: "processing",
            updatedAt: Date.now(),
        })

        return { claimed: true }
    },
})

/**
 * Internal mutation to update generation status.
 */
export const updateGenerationStatus = internalMutation({
    args: {
        generationId: v.id("pendingGenerations"),
        status: generationLifecycleStatusValidator,
        errorMessage: v.optional(v.string()),
        /** HTTP error code from Pollinations API (401=auth, 402=budget, 403=access) */
        errorCode: v.optional(v.number()),
        imageId: v.optional(v.id("generatedImages")),
        retryCount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const updates: {
            status: typeof args.status
            dispatchStatus: typeof args.status
            updatedAt: number
            errorMessage?: string
            errorCode?: number
            imageId?: typeof args.imageId
            retryCount?: number
        } = {
            status: args.status,
            dispatchStatus: args.status,
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
 * Mark a generation as dispatched to the external worker plane.
 * This is the control-plane handoff step before Cloudflare claims the job.
 */
export const markGenerationDispatched = internalMutation({
    args: {
        generationId: v.id("pendingGenerations"),
    },
    returns: v.object({
        dispatched: v.boolean(),
        dispatchAttempts: v.number(),
    }),
    handler: async (ctx, args) => {
        const generation = await ctx.db.get(args.generationId)
        if (!generation) {
            return { dispatched: false, dispatchAttempts: 0 }
        }

        if (generation.status === "completed" || generation.status === "failed" || generation.status === "cancelled") {
            return {
                dispatched: false,
                dispatchAttempts: generation.dispatchAttempts ?? 0,
            }
        }

        if (generation.dispatchStatus === "dispatched" || generation.dispatchStatus === "processing") {
            return {
                dispatched: false,
                dispatchAttempts: generation.dispatchAttempts ?? 0,
            }
        }

        const nextAttempts = (generation.dispatchAttempts ?? 0) + 1
        await ctx.db.patch(args.generationId, {
            dispatchStatus: "dispatched",
            dispatchAttempts: nextAttempts,
            dispatchedAt: Date.now(),
            lastDispatchError: undefined,
            updatedAt: Date.now(),
        })

        return {
            dispatched: true,
            dispatchAttempts: nextAttempts,
        }
    },
})

/**
 * Records a failed attempt to hand a generation off to the external worker plane.
 */
export const recordGenerationDispatchFailure = internalMutation({
    args: {
        generationId: v.id("pendingGenerations"),
        errorMessage: v.string(),
    },
    handler: async (ctx, args) => {
        const generation = await ctx.db.get(args.generationId)
        if (!generation) return

        if (generation.status === "completed" || generation.status === "cancelled") {
            return
        }

        await ctx.db.patch(args.generationId, {
            dispatchStatus: "pending",
            lastDispatchError: args.errorMessage,
            updatedAt: Date.now(),
        })
    },
})

/**
 * Claim a generation for external worker execution.
 * The claim token must match on finalize/fail so duplicate callbacks become no-ops.
 */
export const claimGenerationForWorker = internalMutation({
    args: {
        generationId: v.id("pendingGenerations"),
        claimToken: v.string(),
        workerAttempt: v.number(),
        providerRequestId: v.optional(v.string()),
    },
    returns: v.object({
        claimed: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const generation = await ctx.db.get(args.generationId)
        if (!generation) {
            return { claimed: false }
        }

        if (generation.status === "completed" || generation.status === "failed" || generation.status === "cancelled") {
            return { claimed: false }
        }

        const currentAttempt = generation.workerAttempt ?? 0
        const canClaimPending =
            generation.status === "pending" &&
            (generation.dispatchStatus === undefined ||
                generation.dispatchStatus === "pending" ||
                generation.dispatchStatus === "dispatched")

        const canReclaimProcessing =
            generation.status === "processing" &&
            args.workerAttempt > currentAttempt

        if (!canClaimPending && !canReclaimProcessing) {
            return { claimed: false }
        }

        await ctx.db.patch(args.generationId, {
            status: "processing",
            dispatchStatus: "processing",
            claimToken: args.claimToken,
            workerAttempt: args.workerAttempt,
            providerRequestId: args.providerRequestId,
            updatedAt: Date.now(),
        })

        return { claimed: true }
    },
})

/**
 * Finalize a worker-owned generation exactly once.
 */
export const finalizeGenerationFromWorker = internalMutation({
    args: {
        generationId: v.id("pendingGenerations"),
        claimToken: v.string(),
        imageId: v.id("generatedImages"),
        retryCount: v.optional(v.number()),
        providerRequestId: v.optional(v.string()),
    },
    returns: v.object({
        completed: v.boolean(),
        duplicate: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const generation = await ctx.db.get(args.generationId)
        if (!generation) {
            return { completed: false, duplicate: false }
        }

        if (generation.status === "completed") {
            return { completed: false, duplicate: true }
        }

        if (generation.status === "failed" || generation.status === "cancelled") {
            return { completed: false, duplicate: false }
        }

        if (generation.claimToken !== args.claimToken) {
            return { completed: false, duplicate: false }
        }

        await ctx.db.patch(args.generationId, {
            status: "completed",
            dispatchStatus: "completed",
            imageId: args.imageId,
            retryCount: args.retryCount,
            providerRequestId: args.providerRequestId ?? generation.providerRequestId,
            errorMessage: undefined,
            errorCode: undefined,
            updatedAt: Date.now(),
        })

        return { completed: true, duplicate: false }
    },
})

/**
 * Fail a worker-owned generation exactly once.
 */
export const failGenerationFromWorker = internalMutation({
    args: {
        generationId: v.id("pendingGenerations"),
        claimToken: v.string(),
        errorMessage: v.string(),
        errorCode: v.optional(v.number()),
        retryCount: v.optional(v.number()),
        providerRequestId: v.optional(v.string()),
        /** Skip claim token check — used by the queue error handler on final attempt */
        skipClaimTokenCheck: v.optional(v.boolean()),
    },
    returns: v.object({
        failed: v.boolean(),
        duplicate: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const generation = await ctx.db.get(args.generationId)
        if (!generation) {
            return { failed: false, duplicate: false }
        }

        if (generation.status === "failed") {
            return { failed: false, duplicate: true }
        }

        if (generation.status === "completed" || generation.status === "cancelled") {
            return { failed: false, duplicate: false }
        }

        if (!args.skipClaimTokenCheck && generation.claimToken !== args.claimToken) {
            return { failed: false, duplicate: false }
        }

        await ctx.db.patch(args.generationId, {
            status: "failed",
            dispatchStatus: "failed",
            errorMessage: args.errorMessage,
            errorCode: args.errorCode,
            retryCount: args.retryCount,
            providerRequestId: args.providerRequestId ?? generation.providerRequestId,
            updatedAt: Date.now(),
        })

        return { failed: true, duplicate: false }
    },
})

export const getGenerationWorkerContinuationState = internalQuery({
    args: {
        generationId: v.id("pendingGenerations"),
        claimToken: v.string(),
    },
    returns: v.object({
        canContinue: v.boolean(),
        ownerId: v.optional(v.string()),
        generationParams: v.optional(generationParamsValidator),
        apiKey: v.optional(v.string()),
    }),
    handler: async (ctx, args) => {
        const generation = await ctx.db.get(args.generationId)
        if (!generation) {
            return { canContinue: false }
        }

        if (
            generation.status !== "processing" ||
            generation.dispatchStatus !== "processing" ||
            generation.claimToken !== args.claimToken
        ) {
            return { canContinue: false }
        }

        let apiKey: string | undefined
        try {
            const owner = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", generation.ownerId))
                .unique()

            if (owner?.pollinationsApiKey) {
                apiKey = await decryptApiKey(owner.pollinationsApiKey)
            }
        } catch {
            apiKey = undefined
        }

        return {
            canContinue: true,
            ownerId: generation.ownerId,
            generationParams: generation.generationParams,
            apiKey,
        }
    },
})

type PersistGeneratedImageArgs = {
    ownerId: string
    r2Key: string
    url: string
    thumbnailR2Key?: string
    thumbnailUrl?: string
    previewR2Key?: string
    previewUrl?: string
    prompt: string
    width: number
    height: number
    model: string
    seed?: number
    contentType: string
    sizeBytes: number
    generationParams: unknown
    visibility: "public" | "unlisted"
}

async function persistGeneratedImageRecord(
    ctx: MutationCtx,
    args: PersistGeneratedImageArgs
) {
    const now = Date.now()
    const isPrivate = args.visibility === "unlisted"
    const needsModeration = !isPrivate
    const needsSecondaryAssets = args.contentType.startsWith("video/")

    let isSensitive: boolean | null = false
    let sensitiveSource: "prompt_analysis" | undefined = undefined
    let sensitiveConfidence = 0

    if (!isPrivate) {
        const promptAnalysis = analyzePromptForNSFW(args.prompt)
        console.log(
            `[Prompt Analysis] Score: ${promptAnalysis.confidence}, Sensitive: ${promptAnalysis.isSensitive}, Terms: ${promptAnalysis.matchedTerms.join(", ")}`
        )

        isSensitive = promptAnalysis.confidence >= 0.9 ? true : null
        sensitiveSource = promptAnalysis.confidence >= 0.9 ? "prompt_analysis" : undefined
        sensitiveConfidence = promptAnalysis.confidence
    } else {
        console.log("[Prompt Analysis] Skipped — private image")
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
        moderationStage: needsModeration && sensitiveConfidence < 0.9 ? "prompt_inference" : undefined,
        moderationDispatchStatus: needsModeration && sensitiveConfidence < 0.9 ? "pending" : undefined,
        moderationDispatchAttempts: needsModeration && sensitiveConfidence < 0.9 ? 0 : undefined,
        moderationUpdatedAt: needsModeration && sensitiveConfidence < 0.9 ? now : undefined,
        secondaryAssetsDispatchStatus: needsSecondaryAssets ? "pending" : undefined,
        secondaryAssetsDispatchAttempts: needsSecondaryAssets ? 0 : undefined,
        secondaryAssetsUpdatedAt: needsSecondaryAssets ? now : undefined,
    })

    await ctx.db.insert("generatedImageDetails", {
        imageId,
        generationParams: args.generationParams,
    })

    if (!isPrivate && sensitiveConfidence < 0.9) {
        await ctx.scheduler.runAfter(0, internal.promptInference.analyzePromptImage, {
            imageId,
            prompt: args.prompt,
        })
    }

    return imageId
}

export const completeGenerationFromWorkerResult = internalMutation({
    args: {
        generationId: v.id("pendingGenerations"),
        claimToken: v.string(),
        r2Key: v.string(),
        url: v.string(),
        width: v.number(),
        height: v.number(),
        seed: v.optional(v.number()),
        contentType: v.string(),
        sizeBytes: v.number(),
        retryCount: v.optional(v.number()),
        providerRequestId: v.optional(v.string()),
    },
    returns: v.object({
        completed: v.boolean(),
        duplicate: v.boolean(),
        imageId: v.optional(v.id("generatedImages")),
    }),
    handler: async (ctx, args) => {
        const generation = await ctx.db.get(args.generationId)
        if (!generation) {
            return { completed: false, duplicate: false }
        }

        if (generation.status === "completed") {
            return {
                completed: false,
                duplicate: true,
                imageId: generation.imageId,
            }
        }

        if (generation.status === "failed" || generation.status === "cancelled") {
            return { completed: false, duplicate: false }
        }

        if (generation.claimToken !== args.claimToken) {
            return { completed: false, duplicate: false }
        }

        const params = generation.generationParams
        const imageId = await persistGeneratedImageRecord(ctx, {
            ownerId: generation.ownerId,
            r2Key: args.r2Key,
            url: args.url,
            thumbnailR2Key: undefined,
            thumbnailUrl: undefined,
            previewR2Key: undefined,
            previewUrl: undefined,
            prompt: params.prompt,
            width: args.width,
            height: args.height,
            model: params.model ?? "flux",
            seed: args.seed,
            contentType: args.contentType,
            sizeBytes: args.sizeBytes,
            generationParams: {
                ...params,
                seed: args.seed ?? params.seed,
                width: args.width,
                height: args.height,
            },
            visibility: params.private ? "unlisted" : "public",
        })

        await ctx.db.patch(args.generationId, {
            status: "completed",
            dispatchStatus: "completed",
            imageId,
            retryCount: args.retryCount,
            providerRequestId: args.providerRequestId ?? generation.providerRequestId,
            errorMessage: undefined,
            errorCode: undefined,
            updatedAt: Date.now(),
        })

        if (args.contentType.startsWith("video/")) {
            await ctx.scheduler.runAfter(0, internal.cloudflareDispatch.dispatchSecondaryAssets, {
                imageId,
            })
        }

        return {
            completed: true,
            duplicate: false,
            imageId,
        }
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
        return await persistGeneratedImageRecord(ctx, args)
    },
})
