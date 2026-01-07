"use client"

/**
 * useBatchGeneration Hook
 *
 * Manages batch image generation jobs using Convex.
 * Provides reactive state for active batches and methods to start/cancel jobs.
 * 
 * Note: Batch processing now happens entirely on the server via Convex scheduled
 * functions. The client only needs to start the batch and observe progress.
 */

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"
import * as React from "react"

/**
 * Batch generation parameters (subset of ImageGenerationParams)
 */
export interface BatchGenerationParams {
    prompt: string
    negativePrompt?: string
    model?: string
    width?: number
    height?: number
    seed?: number
    enhance?: boolean
    private?: boolean
    safe?: boolean
    image?: string
    // Video-specific parameters
    /** Video duration in seconds */
    duration?: number
    /** Enable audio generation (veo only) */
    audio?: boolean
    /** Video aspect ratio (16:9 or 9:16) */
    aspectRatio?: string
    /** Second reference image for video interpolation (veo) */
    lastFrameImage?: string
}

/**
 * Batch job status type
 */
export type BatchJobStatus = "pending" | "processing" | "paused" | "completed" | "cancelled" | "failed"

/**
 * Batch job document type
 */
export interface BatchJob {
    _id: Id<"batchJobs">
    _creationTime: number
    ownerId: string
    status: BatchJobStatus
    totalCount: number
    completedCount: number
    failedCount: number
    currentIndex: number
    generationParams: BatchGenerationParams
    imageIds: Id<"generatedImages">[]
    createdAt: number
    updatedAt: number
}

/**
 * Return type for useBatchGeneration hook
 */
export interface UseBatchGenerationReturn {
    /** Start a new batch generation job */
    startBatch: (params: BatchGenerationParams, count: number) => Promise<Id<"batchJobs">>
    /** Cancel an active batch job */
    cancelBatch: (batchJobId: Id<"batchJobs">) => Promise<void>
    /** Pause an active batch job */
    pauseBatch: (batchJobId: Id<"batchJobs">) => Promise<void>
    /** Resume a paused batch job */
    resumeBatch: (batchJobId: Id<"batchJobs">) => Promise<void>
    /** User's active batch jobs (pending/processing/paused) */
    activeBatches: BatchJob[]
    /** User's recent batch jobs (all statuses) */
    recentBatches: BatchJob[]
    /** Whether any batch is currently active */
    hasActiveBatch: boolean
    /** Get a specific batch job by ID (or null if not the current user's) */
    getBatchJob: (batchJobId: Id<"batchJobs">) => BatchJob | null | undefined
    /** Whether batch operations are loading */
    isLoading: boolean
}

/**
 * Hook for managing batch image generation jobs.
 * 
 * Batch processing happens entirely on the Convex server using scheduled functions.
 * This means users can:
 * - Start a batch and close their browser
 * - Come back later to find all images generated
 * - Monitor progress in real-time while on the page
 *
 * @example
 * ```tsx
 * const { startBatch, activeBatches, cancelBatch } = useBatchGeneration()
 *
 * // Start a batch of 10 images (fire and forget!)
 * const batchId = await startBatch({ prompt: "A sunset" }, 10)
 *
 * // Monitor progress reactively
 * activeBatches.forEach(batch => {
 *   console.log(`${batch.completedCount}/${batch.totalCount}`)
 * })
 *
 * // Cancel if needed
 * await cancelBatch(batchId)
 * ```
 */
export function useBatchGeneration(): UseBatchGenerationReturn {
    const startBatchMutation = useMutation(api.batchGeneration.startBatchJob)
    const cancelBatchMutation = useMutation(api.batchGeneration.cancelBatchJob)
    const pauseBatchMutation = useMutation(api.batchGeneration.pauseBatchJob)
    const resumeBatchMutation = useMutation(api.batchGeneration.resumeBatchJob)

    // Reactive queries for batch jobs
    const activeBatchesQuery = useQuery(api.batchGeneration.getUserActiveBatches)
    const recentBatchesQuery = useQuery(api.batchGeneration.getUserBatchJobs, { limit: 10 })

    const activeBatches = (activeBatchesQuery ?? []) as BatchJob[]
    const recentBatches = (recentBatchesQuery ?? []) as BatchJob[]
    const hasActiveBatch = activeBatches.length > 0
    const isLoading = activeBatchesQuery === undefined

    const startBatch = React.useCallback(
        async (params: BatchGenerationParams, count: number): Promise<Id<"batchJobs">> => {
            // The server will handle all processing via scheduled functions
            return await startBatchMutation({
                count,
                generationParams: params,
            })
        },
        [startBatchMutation]
    )

    const cancelBatch = React.useCallback(
        async (batchJobId: Id<"batchJobs">): Promise<void> => {
            await cancelBatchMutation({ batchJobId })
        },
        [cancelBatchMutation]
    )

    const pauseBatch = React.useCallback(
        async (batchJobId: Id<"batchJobs">): Promise<void> => {
            await pauseBatchMutation({ batchJobId })
        },
        [pauseBatchMutation]
    )

    const resumeBatch = React.useCallback(
        async (batchJobId: Id<"batchJobs">): Promise<void> => {
            await resumeBatchMutation({ batchJobId })
        },
        [resumeBatchMutation]
    )

    // Helper to get a specific batch job from the recent list
    const getBatchJob = React.useCallback(
        (batchJobId: Id<"batchJobs">): BatchJob | null | undefined => {
            if (recentBatches === undefined) return undefined
            return recentBatches.find((batch) => batch._id === batchJobId) ?? null
        },
        [recentBatches]
    )

    return {
        startBatch,
        cancelBatch,
        pauseBatch,
        resumeBatch,
        activeBatches,
        recentBatches,
        hasActiveBatch,
        getBatchJob,
        isLoading,
    }
}

/**
 * Hook to get images for a specific batch job.
 * Returns reactive array of generated images.
 */
export function useBatchImages(batchJobId: Id<"batchJobs"> | undefined) {
    const images = useQuery(
        api.batchGeneration.getBatchImages,
        batchJobId ? { batchJobId } : "skip"
    )

    return {
        images: images ?? [],
        isLoading: images === undefined,
    }
}

/**
 * Hook to get a specific batch job by ID.
 * Returns reactive batch job data.
 */
export function useBatchJob(batchJobId: Id<"batchJobs"> | undefined) {
    const batchJob = useQuery(
        api.batchGeneration.getBatchJob,
        batchJobId ? { batchJobId } : "skip"
    )

    return {
        batchJob: batchJob as BatchJob | null | undefined,
        isLoading: batchJob === undefined,
    }
}

/**
 * Hook to observe batch progress.
 * This is now purely observational - all processing happens on the server.
 * 
 * @deprecated The useBatchProcessor hook is no longer needed for client-side processing.
 * Batch processing now happens entirely on the server. Use useBatchJob instead for
 * observing progress.
 */
export function useBatchProcessor(
    batchJobId: Id<"batchJobs"> | null,
    _onGenerateItem?: (params: BatchGenerationParams, itemIndex: number) => Promise<{ success: boolean; imageId?: Id<"generatedImages"> }>
) {
    const { batchJob } = useBatchJob(batchJobId ?? undefined)

    // Log deprecation warning in development
    React.useEffect(() => {
        if (process.env.NODE_ENV === "development" && _onGenerateItem) {
            console.warn(
                "[useBatchProcessor] This hook is deprecated. Batch processing now happens " +
                "entirely on the Convex server. The onGenerateItem callback is no longer used. " +
                "Use useBatchJob for observing progress instead."
            )
        }
    }, [_onGenerateItem])

    return {
        // Processing is always happening on the server now
        isProcessing: batchJob?.status === "pending" || batchJob?.status === "processing",
        currentIndex: batchJob?.currentIndex ?? 0,
        totalCount: batchJob?.totalCount ?? 0,
        completedCount: batchJob?.completedCount ?? 0,
        status: batchJob?.status,
    }
}
