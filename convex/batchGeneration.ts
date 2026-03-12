/**
 * Convex Batch Generation Functions
 *
 * Handles async batch image generation with Cloudflare-backed worker dispatch.
 * Items are seeded in fixed-size chunks so the UX stays fast without burning
 * Convex action compute on provider waits.
 * 
 * BYOP (Bring Your Own Pollen) Architecture:
 * - Client obtains API key from PollenAuth context (fetched from encrypted Convex storage)
 * - startBatchJob: Receives API key, creates batch record + batchItems, schedules the first chunk
 * - Cloudflare worker: Claims each batch item, calls Pollinations, uploads media, finalizes in Convex
 * - storeGeneratedImage: Stores image metadata in Convex
 * 
 * This is a true "fire and forget" implementation - users can close their browser
 * and the batch will continue processing on the server using the stored API key.
 */
import { ConvexError, v } from "convex/values"
import { internal } from "./_generated/api"
import type { Doc } from "./_generated/dataModel"
import {
    internalMutation,
    internalQuery,
    mutation,
    query,
} from "./_generated/server"
import {
    buildRecordBatchItemResultTransition,
    getBatchStatusAfterItemSettlement,
} from "./lib/batchGenerationState"
import { analyzePromptForNSFW } from "./lib/nsfwDetection"
import { canUserGenerate } from "./lib/subscription"

/** Maximum batch size */
const MAX_BATCH_SIZE = 1000

/** Minimum batch size */
const MIN_BATCH_SIZE = 1

/** Seed work in chunks of 10 with 1.5s spacing between chunks. */
const BATCH_DISPATCH_CHUNK_SIZE = 10
const BATCH_DISPATCH_CHUNK_DELAY_MS = 1_500

/** Legacy adaptive delay state retained for backward compatibility with existing docs/UI. */
const BASE_RATE_LIMIT_DELAY_MS = 100
const MAX_ADAPTIVE_DELAY_MS = 2_000
const MIN_JITTER_MS = 0
const MAX_JITTER_MS = 250
const THROTTLE_BACKOFF_MULTIPLIER = 1.5
const TRANSIENT_BACKOFF_MULTIPLIER = 1.25
const SUCCESS_RECOVERY_MULTIPLIER = 0.9

/**
 * Lightweight batch job data for list views.
 * Excludes heavy fields (generationParams, apiKey, imageIds) to reduce bandwidth.
 */
type BatchJobSummary = {
    _id: Doc<"batchJobs">["_id"]
    _creationTime: number
    status: Doc<"batchJobs">["status"]
    totalCount: number
    completedCount: number
    failedCount: number
    currentIndex: number
    inFlightCount?: number
    adaptiveDelayMs?: number
    createdAt: number
    updatedAt: number
    lastErrorCode?: number
}

/**
 * Convert a full batch job document to a lightweight summary.
 * Strips generationParams (can be 10-50KB for complex workflows),
 * apiKey (sensitive), and imageIds (only needed for detail views).
 */
function toBatchJobSummary(job: Doc<"batchJobs">): BatchJobSummary {
    return {
        _id: job._id,
        _creationTime: job._creationTime,
        status: job.status,
        totalCount: job.totalCount,
        completedCount: job.completedCount,
        failedCount: job.failedCount,
        currentIndex: job.currentIndex,
        inFlightCount: job.inFlightCount,
        adaptiveDelayMs: job.adaptiveDelayMs,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        lastErrorCode: job.lastErrorCode,
    }
}

/**
 * Generation params validator (shared between functions)
 */
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
})

/**
 * Start a new batch generation job.
 * Creates the batch job record and schedules the first item for processing.
 */
export const startBatchJob = mutation({
    args: {
        count: v.number(),
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

        // Validate batch size
        if (args.count < MIN_BATCH_SIZE || args.count > MAX_BATCH_SIZE) {
            throw new Error(`Batch size must be between ${MIN_BATCH_SIZE} and ${MAX_BATCH_SIZE}`)
        }

        const now = Date.now()

        // Create the aggregate batch job document. Per-item execution lives in
        // batchItems so the parent doc no longer acts as the queue itself.
        const batchJobId = await ctx.db.insert("batchJobs", {
            ownerId: identity.subject,
            status: "pending",
            totalCount: args.count,
            completedCount: 0,
            failedCount: 0,
            currentIndex: 0,
            inFlightCount: 0,
            adaptiveDelayMs: BASE_RATE_LIMIT_DELAY_MS,
            generationParams: args.generationParams,
            apiKey: args.apiKey, // Store the API key for use by processor actions
            imageIds: [],
            createdAt: now,
            updatedAt: now,
        })

        for (let itemIndex = 0; itemIndex < args.count; itemIndex += 1) {
            await ctx.db.insert("batchItems", {
                batchJobId,
                ownerId: identity.subject,
                itemIndex,
                status: "pending",
                dispatchStatus: "pending",
                dispatchAttempts: 0,
                createdAt: now,
                updatedAt: now,
            })
        }

        // Seed the first chunk immediately. Additional chunks self-schedule.
        await ctx.scheduler.runAfter(0, internal.batchGeneration.seedBatchDispatchChunk, {
            batchJobId,
            startIndex: 0,
        })

        return batchJobId
    },
})

/**
 * Internal mutation to store a generated image in the database.
 * Called by the worker-backed batch completion path after successful generation.
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
        const needsSecondaryAssets = args.contentType.startsWith("video/")

        // Private images (unlisted) bypass NSFW detection entirely.
        // They are never shown in public feeds, so content analysis is unnecessary.
        const isPrivate = args.visibility === "unlisted"
        const needsModeration = !isPrivate

        let isSensitive: boolean | null = false
        let sensitiveSource: "prompt_analysis" | undefined = undefined
        let sensitiveConfidence = 0

        if (!isPrivate) {
            // Analyze prompt for NSFW content (public images only)
            const promptAnalysis = analyzePromptForNSFW(args.prompt)
            console.log(`[Batch Prompt Analysis] Score: ${promptAnalysis.confidence}, Sensitive: ${promptAnalysis.isSensitive}, Terms: ${promptAnalysis.matchedTerms.join(", ")}`)

            isSensitive = promptAnalysis.confidence >= 0.9 ? true : null
            sensitiveSource = promptAnalysis.confidence >= 0.9 ? "prompt_analysis" : undefined
            sensitiveConfidence = promptAnalysis.confidence
        } else {
            console.log(`[Batch Prompt Analysis] Skipped — private image`)
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

/**
 * Seed a batch dispatch chunk into the Cloudflare worker plane.
 *
 * This is the pacing primitive for batch throughput:
 * - schedule up to 10 items immediately
 * - schedule the next chunk 1.5s later
 * - stop seeding while paused/cancelled/completed
 */
export const seedBatchDispatchChunk = internalMutation({
    args: {
        batchJobId: v.id("batchJobs"),
        startIndex: v.number(),
    },
    returns: v.object({
        scheduledCount: v.number(),
        nextStartIndex: v.union(v.number(), v.null()),
    }),
    handler: async (ctx, args) => {
        const batchJob = await ctx.db.get(args.batchJobId)
        if (!batchJob || (batchJob.status !== "pending" && batchJob.status !== "processing")) {
            return { scheduledCount: 0, nextStartIndex: null }
        }

        const endExclusive = Math.min(args.startIndex + BATCH_DISPATCH_CHUNK_SIZE, batchJob.totalCount)
        let scheduledCount = 0

        for (let itemIndex = args.startIndex; itemIndex < endExclusive; itemIndex += 1) {
            const batchItems = await ctx.db
                .query("batchItems")
                .withIndex("by_batch_item", (q) =>
                    q.eq("batchJobId", args.batchJobId).eq("itemIndex", itemIndex)
                )
                .take(1)

            const batchItem = batchItems[0]
            if (!batchItem) {
                continue
            }

            if (batchItem.status !== "pending" || batchItem.dispatchStatus !== "pending") {
                continue
            }

            await ctx.scheduler.runAfter(0, internal.cloudflareDispatch.dispatchBatchItem, {
                batchJobId: args.batchJobId,
                itemIndex,
            })
            scheduledCount += 1
        }

        const nextStartIndex = endExclusive < batchJob.totalCount ? endExclusive : null

        if (nextStartIndex !== null) {
            await ctx.scheduler.runAfter(BATCH_DISPATCH_CHUNK_DELAY_MS, internal.batchGeneration.seedBatchDispatchChunk, {
                batchJobId: args.batchJobId,
                startIndex: nextStartIndex,
            })
        }

        return { scheduledCount, nextStartIndex }
    },
})

/**
 * Internal query to fetch a batch item by parent/id coordinates.
 */
export const getBatchItemInternal = internalQuery({
    args: {
        batchJobId: v.id("batchJobs"),
        itemIndex: v.number(),
    },
    handler: async (ctx, args) => {
        const items = await ctx.db
            .query("batchItems")
            .withIndex("by_batch_item", (q) =>
                q.eq("batchJobId", args.batchJobId).eq("itemIndex", args.itemIndex)
            )
            .take(1)

        return items[0] ?? null
    },
})

/**
 * Mark a batch item as dispatched to the Cloudflare worker plane.
 */
export const markBatchItemDispatched = internalMutation({
    args: {
        batchJobId: v.id("batchJobs"),
        itemIndex: v.number(),
    },
    returns: v.object({
        dispatched: v.boolean(),
        dispatchAttempts: v.number(),
    }),
    handler: async (ctx, args) => {
        const batchJob = await ctx.db.get(args.batchJobId)
        if (!batchJob || (batchJob.status !== "pending" && batchJob.status !== "processing")) {
            return { dispatched: false, dispatchAttempts: 0 }
        }

        const items = await ctx.db
            .query("batchItems")
            .withIndex("by_batch_item", (q) =>
                q.eq("batchJobId", args.batchJobId).eq("itemIndex", args.itemIndex)
            )
            .take(1)

        const batchItem = items[0]
        if (!batchItem) {
            return { dispatched: false, dispatchAttempts: 0 }
        }

        if (batchItem.status === "completed" || batchItem.status === "failed" || batchItem.status === "cancelled") {
            return {
                dispatched: false,
                dispatchAttempts: batchItem.dispatchAttempts ?? 0,
            }
        }

        if (batchItem.dispatchStatus === "dispatched" || batchItem.dispatchStatus === "processing") {
            return {
                dispatched: false,
                dispatchAttempts: batchItem.dispatchAttempts ?? 0,
            }
        }

        const nextAttempts = (batchItem.dispatchAttempts ?? 0) + 1
        const now = Date.now()

        await ctx.db.patch(batchItem._id, {
            dispatchStatus: "dispatched",
            dispatchAttempts: nextAttempts,
            dispatchedAt: now,
            lastDispatchError: undefined,
            updatedAt: now,
        })

        await ctx.db.patch(args.batchJobId, {
            status: batchJob.status === "pending" ? "processing" : batchJob.status,
            currentIndex: Math.max(batchJob.currentIndex, args.itemIndex + 1),
            inFlightCount: (batchJob.inFlightCount ?? 0) + 1,
            updatedAt: now,
        })

        return {
            dispatched: true,
            dispatchAttempts: nextAttempts,
        }
    },
})

/**
 * Record a failed dispatch attempt for a batch item and release the in-flight slot.
 */
export const recordBatchItemDispatchFailure = internalMutation({
    args: {
        batchJobId: v.id("batchJobs"),
        itemIndex: v.number(),
        errorMessage: v.string(),
    },
    handler: async (ctx, args) => {
        const batchJob = await ctx.db.get(args.batchJobId)
        const items = await ctx.db
            .query("batchItems")
            .withIndex("by_batch_item", (q) =>
                q.eq("batchJobId", args.batchJobId).eq("itemIndex", args.itemIndex)
            )
            .take(1)

        const batchItem = items[0]
        if (!batchItem) {
            return
        }

        const now = Date.now()
        await ctx.db.patch(batchItem._id, {
            dispatchStatus: "pending",
            lastDispatchError: args.errorMessage,
            updatedAt: now,
        })

        if (batchJob) {
            await ctx.db.patch(args.batchJobId, {
                inFlightCount: Math.max(0, (batchJob.inFlightCount ?? 0) - 1),
                updatedAt: now,
            })
        }
    },
})

/**
 * Claim a batch item for Cloudflare worker execution.
 */
export const claimBatchItemForWorker = internalMutation({
    args: {
        batchJobId: v.id("batchJobs"),
        itemIndex: v.number(),
        claimToken: v.string(),
        workerAttempt: v.number(),
        providerRequestId: v.optional(v.string()),
    },
    returns: v.object({
        claimed: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const batchJob = await ctx.db.get(args.batchJobId)
        if (
            !batchJob ||
            (batchJob.status !== "pending" &&
                batchJob.status !== "processing" &&
                batchJob.status !== "paused")
        ) {
            return { claimed: false }
        }

        const items = await ctx.db
            .query("batchItems")
            .withIndex("by_batch_item", (q) =>
                q.eq("batchJobId", args.batchJobId).eq("itemIndex", args.itemIndex)
            )
            .take(1)

        const batchItem = items[0]
        if (!batchItem) {
            return { claimed: false }
        }

        if (batchItem.status === "completed" || batchItem.status === "failed" || batchItem.status === "cancelled") {
            return { claimed: false }
        }

        const currentAttempt = batchItem.workerAttempt ?? 0
        const canClaimPending =
            batchItem.status === "pending" &&
            batchItem.dispatchStatus === "dispatched" &&
            (batchJob.status === "pending" || batchJob.status === "processing" || batchJob.status === "paused")

        const canReclaimProcessing =
            batchItem.status === "processing" &&
            args.workerAttempt > currentAttempt

        if (!canClaimPending && !canReclaimProcessing) {
            return { claimed: false }
        }

        await ctx.db.patch(batchItem._id, {
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
 * Return the continuation state for a claimed batch item.
 */
export const getBatchItemWorkerContinuationState = internalQuery({
    args: {
        batchJobId: v.id("batchJobs"),
        itemIndex: v.number(),
        claimToken: v.string(),
    },
    returns: v.object({
        canContinue: v.boolean(),
        ownerId: v.optional(v.string()),
        generationParams: v.optional(generationParamsValidator),
    }),
    handler: async (ctx, args) => {
        const batchJob = await ctx.db.get(args.batchJobId)
        if (
            !batchJob ||
            (batchJob.status !== "pending" &&
                batchJob.status !== "processing" &&
                batchJob.status !== "paused")
        ) {
            return { canContinue: false }
        }

        const items = await ctx.db
            .query("batchItems")
            .withIndex("by_batch_item", (q) =>
                q.eq("batchJobId", args.batchJobId).eq("itemIndex", args.itemIndex)
            )
            .take(1)

        const batchItem = items[0]
        if (
            !batchItem ||
            batchItem.claimToken !== args.claimToken ||
            batchItem.status !== "processing" ||
            batchItem.dispatchStatus !== "processing"
        ) {
            return { canContinue: false }
        }

        return {
            canContinue: true,
            ownerId: batchJob.ownerId,
            generationParams: batchJob.generationParams,
        }
    },
})

/**
 * Finalize a worker-owned batch item exactly once and schedule the next item.
 */
export const completeBatchItemFromWorkerResult = internalMutation({
    args: {
        batchJobId: v.id("batchJobs"),
        itemIndex: v.number(),
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
    handler: async (
        ctx,
        args
    ): Promise<{ completed: boolean; duplicate: boolean; imageId?: Doc<"generatedImages">["_id"] }> => {
        const batchJob = await ctx.db.get(args.batchJobId)
        if (!batchJob || batchJob.status === "cancelled") {
            return { completed: false, duplicate: false }
        }

        const items = await ctx.db
            .query("batchItems")
            .withIndex("by_batch_item", (q) =>
                q.eq("batchJobId", args.batchJobId).eq("itemIndex", args.itemIndex)
            )
            .take(1)

        const batchItem = items[0]
        if (!batchItem) {
            return { completed: false, duplicate: false }
        }

        if (batchItem.status === "completed") {
            return {
                completed: false,
                duplicate: true,
                imageId: batchItem.imageId,
            }
        }

        if (batchItem.status === "failed" || batchItem.status === "cancelled") {
            return { completed: false, duplicate: false }
        }

        if (batchItem.claimToken !== args.claimToken) {
            return { completed: false, duplicate: false }
        }

        const imageId: Doc<"generatedImages">["_id"] = await ctx.runMutation(internal.batchGeneration.storeGeneratedImage, {
            ownerId: batchJob.ownerId,
            r2Key: args.r2Key,
            url: args.url,
            thumbnailR2Key: undefined,
            thumbnailUrl: undefined,
            previewR2Key: undefined,
            previewUrl: undefined,
            prompt: batchJob.generationParams.prompt,
            width: args.width,
            height: args.height,
            model: batchJob.generationParams.model ?? "flux",
            seed: args.seed,
            contentType: args.contentType,
            sizeBytes: args.sizeBytes,
            generationParams: {
                ...batchJob.generationParams,
                seed: args.seed ?? batchJob.generationParams.seed,
                width: args.width,
                height: args.height,
            },
            visibility: batchJob.generationParams.private ? "unlisted" : "public",
        })

        const now = Date.now()
        await ctx.db.patch(batchItem._id, {
            status: "completed",
            dispatchStatus: "completed",
            imageId,
            retryCount: args.retryCount,
            providerRequestId: args.providerRequestId ?? batchItem.providerRequestId,
            errorMessage: undefined,
            errorCode: undefined,
            updatedAt: now,
        })

        const nextCompletedCount = batchJob.completedCount + 1
        const nextFailedCount = batchJob.failedCount
        const nextInFlightCount = Math.max(0, (batchJob.inFlightCount ?? 0) - 1)
        const totalProcessed = nextCompletedCount + nextFailedCount
        const nextStatus = getBatchStatusAfterItemSettlement({
            completedCount: nextCompletedCount,
            failedCount: nextFailedCount,
            totalCount: batchJob.totalCount,
            status: batchJob.status,
        })

        await ctx.db.patch(args.batchJobId, {
            status: nextStatus,
            completedCount: nextCompletedCount,
            failedCount: nextFailedCount,
            inFlightCount: nextInFlightCount,
            currentIndex: Math.max(batchJob.currentIndex, args.itemIndex + 1),
            apiKey: totalProcessed >= batchJob.totalCount ? undefined : batchJob.apiKey,
            updatedAt: now,
        })

        if (args.contentType.startsWith("video/")) {
            await ctx.scheduler.runAfter(0, internal.cloudflareDispatch.dispatchSecondaryAssets, {
                imageId,
            })
        }

        return { completed: true, duplicate: false, imageId }
    },
})

/**
 * Fail a worker-owned batch item exactly once and schedule the next item when appropriate.
 */
export const failBatchItemFromWorker = internalMutation({
    args: {
        batchJobId: v.id("batchJobs"),
        itemIndex: v.number(),
        claimToken: v.string(),
        errorMessage: v.string(),
        errorCode: v.optional(v.number()),
        retryCount: v.optional(v.number()),
        providerRequestId: v.optional(v.string()),
    },
    returns: v.object({
        failed: v.boolean(),
        duplicate: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const batchJob = await ctx.db.get(args.batchJobId)
        if (!batchJob || batchJob.status === "cancelled") {
            return { failed: false, duplicate: false }
        }

        const items = await ctx.db
            .query("batchItems")
            .withIndex("by_batch_item", (q) =>
                q.eq("batchJobId", args.batchJobId).eq("itemIndex", args.itemIndex)
            )
            .take(1)

        const batchItem = items[0]
        if (!batchItem) {
            return { failed: false, duplicate: false }
        }

        if (batchItem.status === "failed") {
            return { failed: false, duplicate: true }
        }

        if (batchItem.status === "completed" || batchItem.status === "cancelled") {
            return { failed: false, duplicate: false }
        }

        if (batchItem.claimToken !== args.claimToken) {
            return { failed: false, duplicate: false }
        }

        const now = Date.now()
        await ctx.db.patch(batchItem._id, {
            status: "failed",
            dispatchStatus: "failed",
            errorMessage: args.errorMessage,
            errorCode: args.errorCode,
            retryCount: args.retryCount,
            providerRequestId: args.providerRequestId ?? batchItem.providerRequestId,
            updatedAt: now,
        })

        const nextCompletedCount = batchJob.completedCount
        const nextFailedCount = batchJob.failedCount + 1
        const nextInFlightCount = Math.max(0, (batchJob.inFlightCount ?? 0) - 1)
        const totalProcessed = nextCompletedCount + nextFailedCount
        const nextStatus = getBatchStatusAfterItemSettlement({
            completedCount: nextCompletedCount,
            failedCount: nextFailedCount,
            totalCount: batchJob.totalCount,
            status: batchJob.status,
        })

        await ctx.db.patch(args.batchJobId, {
            status: nextStatus,
            completedCount: nextCompletedCount,
            failedCount: nextFailedCount,
            inFlightCount: nextInFlightCount,
            currentIndex: Math.max(batchJob.currentIndex, args.itemIndex + 1),
            lastErrorCode: args.errorCode,
            apiKey: totalProcessed >= batchJob.totalCount ? undefined : batchJob.apiKey,
            updatedAt: now,
        })

        return { failed: true, duplicate: false }
    },
})

/**
 * Schedule the next item in the batch.
 * Should be called at the START of processing an item to pipeline requests.
 */
export const scheduleNextBatchItem = internalMutation({
    args: {
        batchJobId: v.id("batchJobs"),
        currentItemIndex: v.number(),
    },
    handler: async (ctx, args) => {
        const batchJob = await ctx.db.get(args.batchJobId)
        if (!batchJob) {
            // Gracefully handle missing job (likely deleted/completed)
            return { seeded: false }
        }

        // Don't schedule if cancelled or paused
        // Note: We check this at the moment of scheduling.
        // If the user pauses *during* the delay, the next dispatch action
        // mimics this check and will abort.
        if (batchJob.status !== "pending" && batchJob.status !== "processing") {
            return { seeded: false }
        }

        const nextIndex = args.currentItemIndex + 1

        // Stop if we've reached the end
        if (nextIndex >= batchJob.totalCount) {
            return { seeded: false }
        }

        // Update current index and increment in-flight count
        // This tracks that we're about to have another request in the pipeline
        const currentInFlight = batchJob.inFlightCount ?? 0
        if (nextIndex > batchJob.currentIndex) {
            await ctx.db.patch(args.batchJobId, {
                currentIndex: nextIndex,
                inFlightCount: currentInFlight + 1,
                updatedAt: Date.now(),
            })
        } else {
            // Still increment in-flight even if index doesn't change (edge case)
            await ctx.db.patch(args.batchJobId, {
                inFlightCount: currentInFlight + 1,
                updatedAt: Date.now(),
            })
        }

        // Calculate delay with jitter.
        // Delay dynamically adapts based on recent provider pressure.
        const baseDelay = Math.min(
            MAX_ADAPTIVE_DELAY_MS,
            Math.max(BASE_RATE_LIMIT_DELAY_MS, batchJob.adaptiveDelayMs ?? BASE_RATE_LIMIT_DELAY_MS)
        )
        const jitter = Math.floor(Math.random() * (MAX_JITTER_MS - MIN_JITTER_MS + 1)) + MIN_JITTER_MS
        const delay = baseDelay + jitter

        await ctx.scheduler.runAfter(delay, internal.cloudflareDispatch.dispatchBatchItem, {
            batchJobId: args.batchJobId,
            itemIndex: nextIndex,
        })

        return { seeded: true, nextIndex, delay }
    },
})

/**
 * Adaptive throttling signal from the batch processor.
 * Speeds up slowly after success and backs off quickly on provider pressure.
 */
export const adjustAdaptiveDelay = internalMutation({
    args: {
        batchJobId: v.id("batchJobs"),
        outcome: v.union(
            v.literal("success"),
            v.literal("throttle"),
            v.literal("transient_error")
        ),
    },
    handler: async (ctx, args) => {
        const batchJob = await ctx.db.get(args.batchJobId)
        if (!batchJob) return

        const currentDelay = Math.min(
            MAX_ADAPTIVE_DELAY_MS,
            Math.max(BASE_RATE_LIMIT_DELAY_MS, batchJob.adaptiveDelayMs ?? BASE_RATE_LIMIT_DELAY_MS)
        )

        let nextDelay = currentDelay
        if (args.outcome === "throttle") {
            nextDelay = Math.min(
                MAX_ADAPTIVE_DELAY_MS,
                Math.round(currentDelay * THROTTLE_BACKOFF_MULTIPLIER)
            )
        } else if (args.outcome === "transient_error") {
            nextDelay = Math.min(
                MAX_ADAPTIVE_DELAY_MS,
                Math.round(currentDelay * TRANSIENT_BACKOFF_MULTIPLIER)
            )
        } else {
            nextDelay = Math.max(
                BASE_RATE_LIMIT_DELAY_MS,
                Math.round(currentDelay * SUCCESS_RECOVERY_MULTIPLIER)
            )
        }

        if (nextDelay !== (batchJob.adaptiveDelayMs ?? BASE_RATE_LIMIT_DELAY_MS)) {
            await ctx.db.patch(args.batchJobId, {
                adaptiveDelayMs: nextDelay,
                updatedAt: Date.now(),
            })
        }
    },
})

/**
 * Record the result of a batch item processing.
 * Called at the END of processing an item.
 * Does NOT schedule the next item (that's done by scheduleNextBatchItem).
 */
export const recordBatchItemResult = internalMutation({
    args: {
        batchJobId: v.id("batchJobs"),
        itemIndex: v.number(),
        success: v.boolean(),
        imageId: v.optional(v.id("generatedImages")),
        errorMessage: v.optional(v.string()),
        /** HTTP error code from Pollinations API (401=auth, 402=budget, 403=access) */
        errorCode: v.optional(v.number()),
        retryCount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const batchJob = await ctx.db.get(args.batchJobId)
        if (!batchJob) {
            // Gracefully handle missing job (likely deleted/cancelled)
            return { success: false }
        }

        const now = Date.now()

        const transition = buildRecordBatchItemResultTransition(batchJob, {
            itemIndex: args.itemIndex,
            success: args.success,
            imageId: args.imageId,
            errorCode: args.errorCode,
            retryCount: args.retryCount,
        })

        const updates: Partial<Doc<"batchJobs">> = {
            ...transition.updates,
            updatedAt: now,
        }

        if (transition.shouldDelete) {
            // Job complete - delete the record ("nuke" policy)
            // This removes the API key from the database immediately
            await ctx.db.delete(args.batchJobId)
            return { success: true, duplicate: transition.isDuplicate }
        }

        await ctx.db.patch(args.batchJobId, updates)

        return { success: true, duplicate: transition.isDuplicate }
    },
})

/**
 * Decrement the in-flight count when an item is skipped.
 * Called when the worker-backed batch path detects the batch is paused/cancelled
 * and doesn't process the item.
 */
export const decrementInFlightCount = internalMutation({
    args: {
        batchJobId: v.id("batchJobs"),
    },
    handler: async (ctx, args) => {
        const batchJob = await ctx.db.get(args.batchJobId)
        if (!batchJob) {
            return
        }

        const currentInFlight = batchJob.inFlightCount ?? 0
        if (currentInFlight > 0) {
            await ctx.db.patch(args.batchJobId, {
                inFlightCount: currentInFlight - 1,
                updatedAt: Date.now(),
            })
        }
    },
})

/**
 * Internal query to get batch job (for use in actions).
 */
export const getBatchJobInternal = internalQuery({
    args: {
        batchJobId: v.id("batchJobs"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.batchJobId)
    },
})

/**
 * Get a batch job by ID (public query).
 * Only returns the job if owned by the current user.
 */
export const getBatchJob = query({
    args: {
        batchJobId: v.id("batchJobs"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return null
        }

        const batchJob = await ctx.db.get(args.batchJobId)
        if (!batchJob || batchJob.ownerId !== identity.subject) {
            return null
        }

        // Filter out apiKey to prevent exposing sensitive data to clients
        const { apiKey: _, ...safeBatchJob } = batchJob
        return safeBatchJob
    },
})

/**
 * Get the current user's active batch jobs.
 */
export const getUserActiveBatches = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return []
        }

        // Use indexed queries to only fetch active statuses
        // This avoids scanning through thousands of completed/failed jobs (P0 Optimization)
        const [pending, processing, paused] = await Promise.all([
            ctx.db
                .query("batchJobs")
                .withIndex("by_owner_status", (q) => 
                    q.eq("ownerId", identity.subject).eq("status", "pending")
                )
                .order("desc")
                .collect(),
            ctx.db
                .query("batchJobs")
                .withIndex("by_owner_status", (q) => 
                    q.eq("ownerId", identity.subject).eq("status", "processing")
                )
                .order("desc")
                .collect(),
            ctx.db
                .query("batchJobs")
                .withIndex("by_owner_status", (q) => 
                    q.eq("ownerId", identity.subject).eq("status", "paused")
                )
                .order("desc")
                .collect()
        ])

        const jobs = [...pending, ...processing, ...paused].sort((a, b) => b.createdAt - a.createdAt)

        return jobs.map(toBatchJobSummary)
    },
})

/**
 * Get the current user's recent batch jobs (including completed).
 */
export const getUserBatchJobs = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return []
        }

        const limit = args.limit ?? 10

        const jobs = await ctx.db
            .query("batchJobs")
            .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
            .order("desc")
            .take(limit)

        // Use summary type to reduce bandwidth (strips generationParams, apiKey, imageIds)
        // This dramatically reduces payload size for list views (generationParams can be 10-50KB)
        return jobs.map(toBatchJobSummary)
    },
})

/**
 * Get images for a specific batch job.
 */
export const getBatchImages = query({
    args: {
        batchJobId: v.id("batchJobs"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return []
        }

        const batchJob = await ctx.db.get(args.batchJobId)
        if (!batchJob || batchJob.ownerId !== identity.subject) {
            return []
        }

        const completedBatchItems = await ctx.db
            .query("batchItems")
            .withIndex("by_batch_status", (q) =>
                q.eq("batchJobId", args.batchJobId).eq("status", "completed")
            )
            .order("asc")
            .collect()

        const itemImageIds = completedBatchItems
            .map((item) => item.imageId)
            .filter((imageId): imageId is NonNullable<Doc<"batchItems">["imageId"]> => imageId !== undefined)

        const imageIds = itemImageIds.length > 0 ? itemImageIds : batchJob.imageIds
        const images = await Promise.all(imageIds.map((id) => ctx.db.get(id)))

        return images.filter((img): img is Doc<"generatedImages"> => img !== null)
    },
})

/**
 * Cancel an active batch job.
 * Prevents future scheduled items from executing.
 */
export const cancelBatchJob = mutation({
    args: {
        batchJobId: v.id("batchJobs"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const batchJob = await ctx.db.get(args.batchJobId)
        if (!batchJob) {
            throw new Error("Batch job not found")
        }

        if (batchJob.ownerId !== identity.subject) {
            throw new Error("Not authorized to cancel this batch job")
        }

        // Only cancel if still active (including paused)
        if (batchJob.status !== "pending" && batchJob.status !== "processing" && batchJob.status !== "paused") {
            throw new Error("Batch job is not active")
        }

        await ctx.db.patch(args.batchJobId, {
            status: "cancelled",
            apiKey: undefined,
            updatedAt: Date.now(),
        })

        return { success: true }
    },
})

/**
 * Pause an active batch job.
 * Stops processing until resumed.
 * Note: The currently processing item will complete, but no new items will be scheduled.
 */
export const pauseBatchJob = mutation({
    args: {
        batchJobId: v.id("batchJobs"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const batchJob = await ctx.db.get(args.batchJobId)
        if (!batchJob) {
            throw new Error("Batch job not found")
        }

        if (batchJob.ownerId !== identity.subject) {
            throw new Error("Not authorized to pause this batch job")
        }

        // Only pause if actively processing or pending
        if (batchJob.status !== "pending" && batchJob.status !== "processing") {
            throw new Error("Batch job is not active")
        }

        await ctx.db.patch(args.batchJobId, {
            status: "paused",
            updatedAt: Date.now(),
        })

        return { success: true }
    },
})

/**
 * Resume a paused batch job.
 * Continues processing from the first remaining pending item by restarting chunk seeding.
 */
export const resumeBatchJob = mutation({
    args: {
        batchJobId: v.id("batchJobs"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const batchJob = await ctx.db.get(args.batchJobId)
        if (!batchJob) {
            throw new Error("Batch job not found")
        }

        if (batchJob.ownerId !== identity.subject) {
            throw new Error("Not authorized to resume this batch job")
        }

        // Only resume if paused
        if (batchJob.status !== "paused") {
            throw new Error("Batch job is not paused")
        }

        const nextPendingItems = await ctx.db
            .query("batchItems")
            .withIndex("by_batch_status", (q) =>
                q.eq("batchJobId", args.batchJobId).eq("status", "pending")
            )
            .order("asc")
            .take(1)

        const nextPendingItem = nextPendingItems[0]

        await ctx.db.patch(args.batchJobId, {
            status: "processing",
            updatedAt: Date.now(),
        })

        if (nextPendingItem) {
            await ctx.scheduler.runAfter(0, internal.batchGeneration.seedBatchDispatchChunk, {
                batchJobId: args.batchJobId,
                startIndex: nextPendingItem.itemIndex,
            })
        }

        return { success: true }
    },
})
