/**
 * Batch Generation Types & Validators
 *
 * Shared types, constants, and validators for batch generation.
 * This file is intentionally NOT marked as "use node" because it
 * only contains pure TypeScript types and Convex validators.
 */
import { v } from "convex/values"
import type { Doc } from "../_generated/dataModel"

// ============================================================
// Constants
// ============================================================

/** Maximum batch size */
export const MAX_BATCH_SIZE = 1000

/** Minimum batch size */
export const MIN_BATCH_SIZE = 1

/** Base delay between generations in milliseconds (100ms = 10 req/s) */
export const BASE_RATE_LIMIT_DELAY_MS = 100

/** Min jitter to add (20ms) */
export const MIN_JITTER_MS = 20

/** Max jitter to add (100ms) */
export const MAX_JITTER_MS = 100

// ============================================================
// Types
// ============================================================

/**
 * Lightweight batch job data for list views.
 * Excludes heavy fields (generationParams, apiKey, imageIds) to reduce bandwidth.
 */
export type BatchJobSummary = {
    _id: Doc<"batchJobs">["_id"]
    _creationTime: number
    status: Doc<"batchJobs">["status"]
    totalCount: number
    completedCount: number
    failedCount: number
    currentIndex: number
    inFlightCount?: number
    createdAt: number
    updatedAt: number
    lastErrorCode?: number
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Convert a full batch job document to a lightweight summary.
 * Strips generationParams (can be 10-50KB for complex workflows),
 * apiKey (sensitive), and imageIds (only needed for detail views).
 */
export function toBatchJobSummary(job: Doc<"batchJobs">): BatchJobSummary {
    return {
        _id: job._id,
        _creationTime: job._creationTime,
        status: job.status,
        totalCount: job.totalCount,
        completedCount: job.completedCount,
        failedCount: job.failedCount,
        currentIndex: job.currentIndex,
        inFlightCount: job.inFlightCount,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        lastErrorCode: job.lastErrorCode,
    }
}

// ============================================================
// Validators
// ============================================================

/**
 * Generation params validator (shared between functions)
 */
export const generationParamsValidator = v.object({
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
 * Args validator for storeGeneratedImage internal mutation.
 * Extracted to reduce line count in batchGeneration.ts.
 */
export const storeGeneratedImageArgsValidator = {
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
    generationParams: generationParamsValidator,
    visibility: v.union(v.literal("public"), v.literal("unlisted")),
}
