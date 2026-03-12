"use node"

import { v } from "convex/values"
import { internal } from "./_generated/api"
import { internalAction } from "./_generated/server"

const DISPATCH_MAX_ATTEMPTS = 5
const DISPATCH_BASE_DELAY_MS = 2_000
const DISPATCH_MAX_DELAY_MS = 30_000

type SingleGenerationDispatchPayload = {
    jobType: "single_generation"
    generationId: string
    apiKey: string
    attempt: number
    enqueuedAt: number
}

type BatchItemDispatchPayload = {
    jobType: "batch_item"
    batchJobId: string
    itemIndex: number
    apiKey: string
    attempt: number
    enqueuedAt: number
}

type PromptInferenceDispatchPayload = {
    jobType: "prompt_inference"
    imageId: string
    attempt: number
    enqueuedAt: number
}

type VisionAnalysisDispatchPayload = {
    jobType: "vision_analysis"
    imageId: string
    attempt: number
    enqueuedAt: number
}

type SecondaryAssetsDispatchPayload = {
    jobType: "secondary_assets"
    imageId: string
    attempt: number
    enqueuedAt: number
}

type DispatchSingleGenerationResult =
    | { dispatched: false; reason: "missing" | "terminal" | "already_dispatched" }
    | { dispatched: true; attempt: number }

type DispatchBatchItemResult =
    | { dispatched: false; reason: "missing" | "terminal" | "already_dispatched" | "missing_api_key" }
    | { dispatched: true; attempt: number }

type DispatchModerationResult =
    | { dispatched: false; reason: "missing" | "terminal" | "already_dispatched" | "not_needed" }
    | { dispatched: true; attempt: number }

type DispatchSecondaryAssetsResult =
    | { dispatched: false; reason: "missing" | "terminal" | "already_dispatched" | "not_needed" }
    | { dispatched: true; attempt: number }

function getRequiredWorkerConfig() {
    const baseUrl = process.env.CLOUDFLARE_WORKER_BASE_URL
    const sharedSecret = process.env.BLOOMSTUDIO_WORKER_SHARED_SECRET

    if (!baseUrl || !sharedSecret) {
        throw new Error(
            "Missing Cloudflare worker configuration. Expected CLOUDFLARE_WORKER_BASE_URL and BLOOMSTUDIO_WORKER_SHARED_SECRET."
        )
    }

    return { baseUrl, sharedSecret }
}

function calculateDispatchDelayMs(attempt: number): number {
    const exponential = DISPATCH_BASE_DELAY_MS * 2 ** Math.max(0, attempt - 1)
    return Math.min(DISPATCH_MAX_DELAY_MS, exponential)
}

export const dispatchSingleGeneration = internalAction({
    args: {
        generationId: v.id("pendingGenerations"),
        apiKey: v.string(),
    },
    handler: async (ctx, args): Promise<DispatchSingleGenerationResult> => {
        const generation = await ctx.runQuery(internal.singleGeneration.getGenerationInternal, {
            generationId: args.generationId,
        })

        if (!generation) {
            return { dispatched: false, reason: "missing" as const }
        }

        if (generation.status === "completed" || generation.status === "failed" || generation.status === "cancelled") {
            return { dispatched: false, reason: "terminal" as const }
        }

        const dispatchResult: { dispatched: boolean; dispatchAttempts: number } = await ctx.runMutation(internal.singleGeneration.markGenerationDispatched, {
            generationId: args.generationId,
        })

        if (!dispatchResult.dispatched) {
            return { dispatched: false, reason: "already_dispatched" as const }
        }

        try {
            const { baseUrl, sharedSecret } = getRequiredWorkerConfig()

            const payload: SingleGenerationDispatchPayload = {
                jobType: "single_generation",
                generationId: args.generationId,
                apiKey: args.apiKey,
                attempt: dispatchResult.dispatchAttempts,
                enqueuedAt: Date.now(),
            }

            const response = await fetch(`${baseUrl.replace(/\/$/, "")}/dispatch`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-bloomstudio-worker-secret": sharedSecret,
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const responseText = await response.text().catch(() => "")
                throw new Error(
                    `Cloudflare dispatch failed with ${response.status} ${response.statusText}${responseText ? `: ${responseText}` : ""}`
                )
            }

            return {
                dispatched: true,
                attempt: dispatchResult.dispatchAttempts,
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown dispatch error"

            await ctx.runMutation(internal.singleGeneration.recordGenerationDispatchFailure, {
                generationId: args.generationId,
                errorMessage,
            })

            if (dispatchResult.dispatchAttempts < DISPATCH_MAX_ATTEMPTS) {
                await ctx.scheduler.runAfter(
                    calculateDispatchDelayMs(dispatchResult.dispatchAttempts),
                    internal.cloudflareDispatch.dispatchSingleGeneration,
                    args
                )
            }

            throw error
        }
    },
})

export const dispatchBatchItem = internalAction({
    args: {
        batchJobId: v.id("batchJobs"),
        itemIndex: v.number(),
    },
    handler: async (ctx, args): Promise<DispatchBatchItemResult> => {
        const [batchJob, batchItem] = await Promise.all([
            ctx.runQuery(internal.batchGeneration.getBatchJobInternal, {
                batchJobId: args.batchJobId,
            }),
            ctx.runQuery(internal.batchGeneration.getBatchItemInternal, {
                batchJobId: args.batchJobId,
                itemIndex: args.itemIndex,
            }),
        ])

        if (!batchJob || !batchItem) {
            return { dispatched: false, reason: "missing" as const }
        }

        if (
            batchJob.status === "completed" ||
            batchJob.status === "failed" ||
            batchJob.status === "cancelled" ||
            batchJob.status === "paused" ||
            batchItem.status === "completed" ||
            batchItem.status === "failed" ||
            batchItem.status === "cancelled"
        ) {
            return { dispatched: false, reason: "terminal" as const }
        }

        if (!batchJob.apiKey || batchJob.apiKey.trim().length === 0) {
            return { dispatched: false, reason: "missing_api_key" as const }
        }

        const dispatchResult = await ctx.runMutation(internal.batchGeneration.markBatchItemDispatched, {
            batchJobId: args.batchJobId,
            itemIndex: args.itemIndex,
        })

        if (!dispatchResult.dispatched) {
            return { dispatched: false, reason: "already_dispatched" as const }
        }

        try {
            const { baseUrl, sharedSecret } = getRequiredWorkerConfig()

            const payload: BatchItemDispatchPayload = {
                jobType: "batch_item",
                batchJobId: args.batchJobId,
                itemIndex: args.itemIndex,
                apiKey: batchJob.apiKey,
                attempt: dispatchResult.dispatchAttempts,
                enqueuedAt: Date.now(),
            }

            const response = await fetch(`${baseUrl.replace(/\/$/, "")}/dispatch`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-bloomstudio-worker-secret": sharedSecret,
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const responseText = await response.text().catch(() => "")
                throw new Error(
                    `Cloudflare batch dispatch failed with ${response.status} ${response.statusText}${responseText ? `: ${responseText}` : ""}`
                )
            }

            return {
                dispatched: true,
                attempt: dispatchResult.dispatchAttempts,
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown dispatch error"

            await ctx.runMutation(internal.batchGeneration.recordBatchItemDispatchFailure, {
                batchJobId: args.batchJobId,
                itemIndex: args.itemIndex,
                errorMessage,
            })

            if (dispatchResult.dispatchAttempts < DISPATCH_MAX_ATTEMPTS) {
                await ctx.scheduler.runAfter(
                    calculateDispatchDelayMs(dispatchResult.dispatchAttempts),
                    internal.cloudflareDispatch.dispatchBatchItem,
                    args
                )
            }

            throw error
        }
    },
})

export const dispatchSecondaryAssets = internalAction({
    args: {
        imageId: v.id("generatedImages"),
    },
    handler: async (ctx, args): Promise<DispatchSecondaryAssetsResult> => {
        const image = await ctx.runQuery(internal.secondaryAssets.getSecondaryAssetsJobInternal, {
            imageId: args.imageId,
        })

        if (!image) {
            return { dispatched: false, reason: "missing" }
        }

        if (!image.contentType.startsWith("video/")) {
            return { dispatched: false, reason: "not_needed" }
        }

        if (image.secondaryAssetsDispatchStatus === "completed" || image.secondaryAssetsDispatchStatus === "cancelled") {
            return { dispatched: false, reason: "terminal" }
        }

        const dispatchResult = await ctx.runMutation(internal.secondaryAssets.markSecondaryAssetsDispatched, {
            imageId: args.imageId,
        })

        if (!dispatchResult.dispatched) {
            return { dispatched: false, reason: "already_dispatched" }
        }

        try {
            const { baseUrl, sharedSecret } = getRequiredWorkerConfig()

            const payload: SecondaryAssetsDispatchPayload = {
                jobType: "secondary_assets",
                imageId: args.imageId,
                attempt: dispatchResult.dispatchAttempts,
                enqueuedAt: Date.now(),
            }

            const response = await fetch(`${baseUrl.replace(/\/$/, "")}/dispatch`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-bloomstudio-worker-secret": sharedSecret,
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const responseText = await response.text().catch(() => "")
                throw new Error(
                    `Cloudflare secondary-assets dispatch failed with ${response.status} ${response.statusText}${responseText ? `: ${responseText}` : ""}`
                )
            }

            return {
                dispatched: true,
                attempt: dispatchResult.dispatchAttempts,
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown dispatch error"

            await ctx.runMutation(internal.secondaryAssets.recordSecondaryAssetsDispatchFailure, {
                imageId: args.imageId,
                errorMessage,
            })

            if (dispatchResult.dispatchAttempts < DISPATCH_MAX_ATTEMPTS) {
                await ctx.scheduler.runAfter(
                    calculateDispatchDelayMs(dispatchResult.dispatchAttempts),
                    internal.cloudflareDispatch.dispatchSecondaryAssets,
                    args
                )
            }

            throw error
        }
    },
})

export const dispatchPromptInference = internalAction({
    args: {
        imageId: v.id("generatedImages"),
    },
    handler: async (ctx, args): Promise<DispatchModerationResult> => {
        const moderationJob = await ctx.runQuery(internal.contentAnalysis.getModerationJobInternal, {
            imageId: args.imageId,
        })

        if (!moderationJob) {
            return { dispatched: false, reason: "missing" }
        }

        if (moderationJob.image.isSensitive !== undefined && moderationJob.image.isSensitive !== null) {
            return { dispatched: false, reason: "terminal" }
        }

        if (!moderationJob.image.prompt || moderationJob.image.prompt.trim().length === 0) {
            return { dispatched: false, reason: "not_needed" }
        }

        const dispatchResult = await ctx.runMutation(internal.contentAnalysis.markModerationDispatched, {
            imageId: args.imageId,
            stage: "prompt_inference",
        })

        if (!dispatchResult.dispatched) {
            return { dispatched: false, reason: "already_dispatched" }
        }

        try {
            const { baseUrl, sharedSecret } = getRequiredWorkerConfig()

            const payload: PromptInferenceDispatchPayload = {
                jobType: "prompt_inference",
                imageId: args.imageId,
                attempt: dispatchResult.dispatchAttempts,
                enqueuedAt: Date.now(),
            }

            const response = await fetch(`${baseUrl.replace(/\/$/, "")}/dispatch`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-bloomstudio-worker-secret": sharedSecret,
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const responseText = await response.text().catch(() => "")
                throw new Error(
                    `Cloudflare prompt inference dispatch failed with ${response.status} ${response.statusText}${responseText ? `: ${responseText}` : ""}`
                )
            }

            return {
                dispatched: true,
                attempt: dispatchResult.dispatchAttempts,
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown dispatch error"

            await ctx.runMutation(internal.contentAnalysis.recordModerationDispatchFailure, {
                imageId: args.imageId,
                stage: "prompt_inference",
                errorMessage,
            })

            if (dispatchResult.dispatchAttempts < DISPATCH_MAX_ATTEMPTS) {
                await ctx.scheduler.runAfter(
                    calculateDispatchDelayMs(dispatchResult.dispatchAttempts),
                    internal.cloudflareDispatch.dispatchPromptInference,
                    args
                )
            }

            throw error
        }
    },
})

export const dispatchVisionAnalysis = internalAction({
    args: {
        imageId: v.id("generatedImages"),
    },
    handler: async (ctx, args): Promise<DispatchModerationResult> => {
        const moderationJob = await ctx.runQuery(internal.contentAnalysis.getModerationJobInternal, {
            imageId: args.imageId,
        })

        if (!moderationJob) {
            return { dispatched: false, reason: "missing" }
        }

        if (moderationJob.image.isSensitive !== undefined && moderationJob.image.isSensitive !== null) {
            return { dispatched: false, reason: "terminal" }
        }

        if (!moderationJob.image.url) {
            return { dispatched: false, reason: "not_needed" }
        }

        const dispatchResult = await ctx.runMutation(internal.contentAnalysis.markModerationDispatched, {
            imageId: args.imageId,
            stage: "vision_analysis",
        })

        if (!dispatchResult.dispatched) {
            return { dispatched: false, reason: "already_dispatched" }
        }

        try {
            const { baseUrl, sharedSecret } = getRequiredWorkerConfig()

            const payload: VisionAnalysisDispatchPayload = {
                jobType: "vision_analysis",
                imageId: args.imageId,
                attempt: dispatchResult.dispatchAttempts,
                enqueuedAt: Date.now(),
            }

            const response = await fetch(`${baseUrl.replace(/\/$/, "")}/dispatch`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-bloomstudio-worker-secret": sharedSecret,
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const responseText = await response.text().catch(() => "")
                throw new Error(
                    `Cloudflare vision analysis dispatch failed with ${response.status} ${response.statusText}${responseText ? `: ${responseText}` : ""}`
                )
            }

            return {
                dispatched: true,
                attempt: dispatchResult.dispatchAttempts,
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown dispatch error"

            await ctx.runMutation(internal.contentAnalysis.recordModerationDispatchFailure, {
                imageId: args.imageId,
                stage: "vision_analysis",
                errorMessage,
            })

            if (dispatchResult.dispatchAttempts < DISPATCH_MAX_ATTEMPTS) {
                await ctx.scheduler.runAfter(
                    calculateDispatchDelayMs(dispatchResult.dispatchAttempts),
                    internal.cloudflareDispatch.dispatchVisionAnalysis,
                    args
                )
            }

            throw error
        }
    },
})
