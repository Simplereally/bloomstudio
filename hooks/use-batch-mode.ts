"use client"

/**
 * useBatchMode Hook
 * 
 * Manages batch generation mode settings and active batch state.
 * Isolated from single-image generation for cleaner separation of concerns.
 * 
 * Features:
 * - Batch mode enable/disable toggle
 * - Batch count configuration
 * - Active batch job tracking
 * - Server-side processing (fire and forget)
 * 
 * This hook follows the "Headless UI" pattern - pure logic with stable callbacks.
 * 
 * Note: Batch processing now happens entirely on the Convex server.
 * Users can close their browser and the batch will continue processing.
 */

import type { BatchModeSettings } from "@/components/studio/batch"
import type { Id } from "@/convex/_generated/dataModel"
import {
    type BatchGenerationParams,
    useBatchGeneration,
    useBatchJob
} from "@/hooks/queries"
import { ClientErrorCodeConst, showErrorToast } from "@/lib/errors"
import type { GeneratedImage } from "@/types/pollinations"
import { ConvexError } from "convex/values"
import * as React from "react"

/**
 * Extract error code from a ConvexError's data payload.
 */
function getConvexErrorCode(err: unknown): string | undefined {
    if (err instanceof ConvexError) {
        const data = err.data as { code?: string } | string
        if (typeof data === "object" && data !== null && "code" in data) {
            return data.code
        }
    }
    return undefined
}

/**
 * Return type for useBatchMode hook
 */
export interface UseBatchModeReturn {
    // Settings state
    batchSettings: BatchModeSettings
    setBatchSettings: React.Dispatch<React.SetStateAction<BatchModeSettings>>

    // Active batch state
    activeBatchId: Id<"batchJobs"> | null
    setActiveBatchId: React.Dispatch<React.SetStateAction<Id<"batchJobs"> | null>>
    isBatchActive: boolean
    isBatchPaused: boolean

    // Batch processor status
    batchStatus: "pending" | "processing" | "paused" | "completed" | "cancelled" | "failed" | undefined
    batchProgress: {
        currentIndex: number
        totalCount: number
        completedCount: number
        /** Number of items still being processed (will complete even after pause) */
        inFlightCount: number
    }

    // Handlers
    startBatchGeneration: (params: BatchGenerationParams, count: number) => Promise<void>
    cancelBatchGeneration: () => Promise<void>
    pauseBatchGeneration: () => Promise<void>
    resumeBatchGeneration: () => Promise<void>

    // Batch item generation callback (kept for backward compatibility, but deprecated)
    /** @deprecated Not used with server-side processing */
    handleBatchGenerateItem: (
        params: BatchGenerationParams, 
        itemIndex: number
    ) => Promise<{ success: boolean; imageId?: Id<"generatedImages"> }>
}

/**
 * Hook for managing batch generation mode.
 * 
 * Batch processing now happens entirely on the Convex server using scheduled
 * functions. This means:
 * - Users can start a batch, close the browser, and come back later
 * - All images will be generated regardless of client connection
 * - Real-time progress updates when the page is open
 * 
 * @param generateSeed - Function to generate random seeds (from useRandomSeed)
 * @param addImage - Function to add generated image to gallery (deprecated, not used)
 * 
 * @example
 * ```tsx
 * const {
 *     batchSettings,
 *     setBatchSettings,
 *     isBatchActive,
 *     startBatchGeneration,
 *     cancelBatchGeneration,
 * } = useBatchMode({ generateSeed, addImage })
 * 
 * // Toggle batch mode
 * setBatchSettings(prev => ({ ...prev, enabled: !prev.enabled }))
 * 
 * // Start batch (fire and forget - will continue on server!)
 * await startBatchGeneration({ prompt: "A sunset" }, 10)
 * ```
 */
export function useBatchMode({
    generateSeed: _generateSeed,
    addImage: _addImage,
    onTrialExpired,
}: {
    generateSeed: () => number
    addImage: (image: GeneratedImage) => void
    /** Callback when trial expiration is detected */
    onTrialExpired?: () => void
}): UseBatchModeReturn {
    // Suppress unused parameter warnings (kept for API compatibility)
    void _generateSeed
    void _addImage

    // ========================================
    // Batch Settings State
    // ========================================
    const [batchSettings, setBatchSettings] = React.useState<BatchModeSettings>({
        enabled: false,
        count: 10,
    })
    const [activeBatchId, setActiveBatchId] = React.useState<Id<"batchJobs"> | null>(null)

    // ========================================
    // Batch Generation Hooks
    // ========================================
    const { startBatch, cancelBatch, pauseBatch, resumeBatch, hasActiveBatch, activeBatches } = useBatchGeneration()
    
    // Use DB batch if no local activeBatchId (handles page reload with existing batch)
    const dbActiveBatch = activeBatches[0] ?? null
    const effectiveBatchId = activeBatchId ?? dbActiveBatch?._id ?? null
    const isBatchActive = hasActiveBatch || activeBatchId !== null

    // Get batch job status reactively
    const { batchJob } = useBatchJob(effectiveBatchId ?? undefined)

    // Computed paused state
    const isBatchPaused = batchJob?.status === "paused"

    // Clear activeBatchId when batch job completes or is cancelled (but NOT when paused)
    React.useEffect(() => {
        if (batchJob?.status === "completed" || batchJob?.status === "cancelled") {
            setActiveBatchId(null)
        }
    }, [batchJob?.status])

    // ========================================
    // Batch Start Handler
    // ========================================
    const startBatchGeneration = React.useCallback(async (params: BatchGenerationParams, count: number) => {
        try {
            // The server will handle all processing via scheduled functions
            const batchId = await startBatch(params, count)
            setActiveBatchId(batchId)
        } catch (error) {
            console.error("Failed to start batch job:", error)
            // Check for trial expiration via ConvexError code
            const errorCode = getConvexErrorCode(error)
            if (errorCode === ClientErrorCodeConst.TRIAL_EXPIRED) {
                onTrialExpired?.()
            } else {
                showErrorToast(error as Error)
            }
        }
    }, [startBatch, onTrialExpired])

    // ========================================
    // Batch Cancel Handler
    // ========================================
    const cancelBatchGeneration = React.useCallback(async () => {
        // Use effectiveBatchId to support cancelling batches from previous sessions
        if (effectiveBatchId) {
            try {
                await cancelBatch(effectiveBatchId)
                setActiveBatchId(null)
            } catch (error) {
                console.error("Failed to cancel batch:", error)
            }
        }
    }, [effectiveBatchId, cancelBatch])

    // ========================================
    // Batch Pause Handler
    // ========================================
    const pauseBatchGeneration = React.useCallback(async () => {
        if (effectiveBatchId) {
            try {
                await pauseBatch(effectiveBatchId)
                // Don't clear activeBatchId - batch is still active, just paused
            } catch (error) {
                console.error("Failed to pause batch:", error)
            }
        }
    }, [effectiveBatchId, pauseBatch])

    // ========================================
    // Batch Resume Handler
    // ========================================
    const resumeBatchGeneration = React.useCallback(async () => {
        if (effectiveBatchId) {
            try {
                await resumeBatch(effectiveBatchId)
            } catch (error) {
                console.error("Failed to resume batch:", error)
            }
        }
    }, [effectiveBatchId, resumeBatch])

    // ========================================
    // Deprecated: Client-side batch item handler
    // ========================================
    // Kept for backward compatibility but no longer used
    const handleBatchGenerateItem = React.useCallback(
        async (_params: BatchGenerationParams, _itemIndex: number): Promise<{ success: boolean; imageId?: Id<"generatedImages"> }> => {
            console.warn(
                "[useBatchMode] handleBatchGenerateItem is deprecated. " +
                "Batch processing now happens entirely on the server."
            )
            return { success: false }
        },
        []
    )

    return {
        // Settings state
        batchSettings,
        setBatchSettings,

        // Active batch state
        activeBatchId,
        setActiveBatchId,
        isBatchActive,
        isBatchPaused,

        // Batch processor status
        batchStatus: batchJob?.status,
        batchProgress: {
            currentIndex: batchJob?.currentIndex ?? 0,
            totalCount: batchJob?.totalCount ?? 0,
            completedCount: batchJob?.completedCount ?? 0,
            inFlightCount: batchJob?.inFlightCount ?? 0,
        },

        // Handlers
        startBatchGeneration,
        cancelBatchGeneration,
        pauseBatchGeneration,
        resumeBatchGeneration,
        handleBatchGenerateItem,
    }
}
