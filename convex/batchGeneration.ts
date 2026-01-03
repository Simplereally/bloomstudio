/**
 * Convex Batch Generation Functions
 *
 * Handles async batch image generation with scheduled server-side processing.
 * Images are generated with configurable intervals using Convex scheduled functions.
 * 
 * Architecture:
 * - startBatchJob: Creates batch record and schedules first item
 * - processBatchItem (batchProcessor.ts): Node.js action that generates images directly
 * - storeGeneratedImage: Stores image metadata in Convex
 * - recordBatchItemAndScheduleNext: Updates DB and schedules next item
 * 
 * This is a true "fire and forget" implementation - users can close their browser
 * and the batch will continue processing on the server.
 */
import { ConvexError, v } from "convex/values"
import { internal } from "./_generated/api"
import type { Doc } from "./_generated/dataModel"
import {
    internalMutation,
    internalQuery,
    mutation,
    query
} from "./_generated/server"
import { canUserGenerate } from "./lib/subscription"

/** Maximum batch size */
const MAX_BATCH_SIZE = 1000

/** Minimum batch size */
const MIN_BATCH_SIZE = 1

/** Interval between generations in milliseconds (5 seconds) */
const BATCH_INTERVAL_MS = 5_000

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
})

/**
 * Start a new batch generation job.
 * Creates the batch job record and schedules the first item for processing.
 */
export const startBatchJob = mutation({
    args: {
        count: v.number(),
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

        // Validate batch size
        if (args.count < MIN_BATCH_SIZE || args.count > MAX_BATCH_SIZE) {
            throw new Error(`Batch size must be between ${MIN_BATCH_SIZE} and ${MAX_BATCH_SIZE}`)
        }

        const now = Date.now()

        // Create the batch job document
        const batchJobId = await ctx.db.insert("batchJobs", {
            ownerId: identity.subject,
            status: "pending",
            totalCount: args.count,
            completedCount: 0,
            failedCount: 0,
            currentIndex: 0,
            generationParams: args.generationParams,
            imageIds: [],
            createdAt: now,
            updatedAt: now,
        })

        // Schedule the first item to process immediately
        // Using scheduler.runAfter(0) starts it as soon as possible
        // The processBatchItem action runs in Node.js runtime (batchProcessor.ts)
        await ctx.scheduler.runAfter(0, internal.batchProcessor.processBatchItem, {
            batchJobId,
            itemIndex: 0,
        })

        return batchJobId
    },
})

/**
 * Internal mutation to store a generated image in the database.
 * Called by processBatchItem after successful image generation.
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

/**
 * Internal mutation to record a batch item result and schedule the next item.
 * This is a mutation (not action) to ensure atomic updates to the database.
 */
export const recordBatchItemAndScheduleNext = internalMutation({
    args: {
        batchJobId: v.id("batchJobs"),
        itemIndex: v.number(),
        success: v.boolean(),
        imageId: v.optional(v.id("generatedImages")),
        errorMessage: v.optional(v.string()),
        retryCount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const batchJob = await ctx.db.get(args.batchJobId)
        if (!batchJob) {
            throw new Error("Batch job not found")
        }

        // Don't update if cancelled
        if (batchJob.status === "cancelled") {
            return { shouldContinue: false }
        }

        // Don't update if paused (but allow the current item to complete)
        // The next item will not be scheduled if paused
        const isPaused = batchJob.status === "paused"

        const now = Date.now()
        const nextIndex = args.itemIndex + 1
        const isComplete = nextIndex >= batchJob.totalCount

        // Prepare updates
        const updates: Partial<Doc<"batchJobs">> = {
            currentIndex: nextIndex,
            updatedAt: now,
            // Reset retry count for the next item
            currentItemRetryCount: 0,
        }

        if (args.success) {
            updates.completedCount = batchJob.completedCount + 1
            if (args.imageId) {
                updates.imageIds = [...batchJob.imageIds, args.imageId]
            }
        } else {
            updates.failedCount = batchJob.failedCount + 1
        }

        // Track the retry count for the completed item (for metrics/debugging)
        if (args.retryCount !== undefined && args.retryCount > 0) {
            updates.currentItemRetryCount = args.retryCount
        }

        // Update status
        if (isComplete) {
            updates.status = "completed"
        } else if (!isPaused && batchJob.status === "pending") {
            updates.status = "processing"
        }
        // Keep status as "paused" if it was paused

        await ctx.db.patch(args.batchJobId, updates)

        // Schedule next item if not complete and not paused
        if (!isComplete && !isPaused) {
            await ctx.scheduler.runAfter(BATCH_INTERVAL_MS, internal.batchProcessor.processBatchItem, {
                batchJobId: args.batchJobId,
                itemIndex: nextIndex,
            })
        }

        return { shouldContinue: !isComplete && !isPaused }
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

        return batchJob
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

        // Get pending and processing jobs
        const jobs = await ctx.db
            .query("batchJobs")
            .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
            .order("desc")
            .collect()

        // Filter to only active (pending/processing/paused) jobs
        return jobs.filter((job) => job.status === "pending" || job.status === "processing" || job.status === "paused")
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

        return jobs
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

        // Fetch all images by their IDs
        const images = await Promise.all(
            batchJob.imageIds.map((id) => ctx.db.get(id))
        )

        // Filter out any null results and return
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
 * Continues processing from where it left off by scheduling the next item.
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

        // Update status to processing
        await ctx.db.patch(args.batchJobId, {
            status: "processing",
            updatedAt: Date.now(),
        })

        // Schedule the next item for processing
        if (batchJob.currentIndex < batchJob.totalCount) {
            await ctx.scheduler.runAfter(0, internal.batchProcessor.processBatchItem, {
                batchJobId: args.batchJobId,
                itemIndex: batchJob.currentIndex,
            })
        }

        return { success: true }
    },
})
