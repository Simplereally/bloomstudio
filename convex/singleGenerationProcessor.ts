"use node"

/**
 * Single Generation Processor Action (Node.js Runtime)
 * 
 * This file uses the Node.js runtime to enable:
 * - AWS SDK for R2 uploads
 * 
 * BYOP (Bring Your Own Pollen) Flow:
 * The action receives the API key directly from the mutation (passed from client).
 * No server-side key storage or decryption is needed.
 * 
 * Implements retry logic with exponential backoff for transient failures.
 */

import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { internal } from "./_generated/api"
import { action, internalAction, type ActionCtx } from "./_generated/server"
import {
    POLLINATIONS_FETCH_TIMEOUT_MS,
    buildPollinationsUrl,
    calculateBackoffDelay,
    cropDirtberryImageBuffer,
    fetchPollinationsWithTimeout,
    getDirtberrySourceDimensions,
    isDirtberryModel,
    generateR2Key,
    generateThumbnailKey,
    uploadMediaWithThumbnail,
    deleteR2Objects,
    type RetryConfig,
} from "./lib"

// ============================================================
// Retry Configuration
// ============================================================

/** Retry configuration for Pollinations API calls */
const POLLINATIONS_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 2000,
    maxDelayMs: 30000,
}
const MAX_POLLINATIONS_ATTEMPTS = POLLINATIONS_RETRY_CONFIG.maxRetries + 1

/**
 * Dev-only cost safety valve.
 * When enabled, image requests complete with a tiny placeholder image
 * instead of hitting Pollinations. This keeps UX flow intact while
 * eliminating provider compute/bandwidth during local dev.
 */
const ENABLE_DEV_GENERATION_MOCK = process.env.CONVEX_ENABLE_DEV_GENERATION_MOCK === "true"
const MOCK_PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7k6xwAAAAASUVORK5CYII="
const MOCK_IMAGE_BUFFER = Buffer.from(MOCK_PNG_BASE64, "base64")

type ProcessGenerationArgs = {
    generationId: Id<"pendingGenerations">
    apiKey: string
    attempt?: number
}

function shouldUseDevGenerationMock(isVideoRequest: boolean): boolean {
    const deployment = process.env.CONVEX_DEPLOYMENT ?? ""
    const isDevDeployment = deployment.startsWith("dev:")
    return ENABLE_DEV_GENERATION_MOCK && isDevDeployment && !isVideoRequest
}

async function runGenerationProcessor(
    ctx: ActionCtx,
    args: ProcessGenerationArgs,
    expectedOwnerId?: string
): Promise<void> {
    const logger = "[SingleGeneration]"
    const attempt = args.attempt ?? 1

    const getGeneration = async () =>
        ctx.runQuery(internal.singleGeneration.getGenerationInternal, {
            generationId: args.generationId,
        })

    const isCancelled = async () => {
        const current = await getGeneration()
        return current?.status === "cancelled"
    }

    const initialGeneration = await getGeneration()
    if (!initialGeneration || (expectedOwnerId && initialGeneration.ownerId !== expectedOwnerId)) {
        throw new Error("Generation not found")
    }

    if (attempt === 1) {
        const claimResult = await ctx.runMutation(internal.singleGeneration.claimPendingGeneration, {
            generationId: args.generationId,
        })
        if (!claimResult.claimed) {
            const current = await getGeneration()
            console.log(
                `${logger} Generation ${args.generationId} status is ${current?.status ?? "missing"}, skipping`
            )
            return
        }
    } else if (initialGeneration.status !== "processing") {
        console.log(
            `${logger} Generation ${args.generationId} status is ${initialGeneration.status}, skipping retry attempt ${attempt}`
        )
        return
    }

    const generation = await getGeneration()
    if (!generation) {
        console.error(`${logger} Generation ${args.generationId} disappeared before processing`)
        return
    }

    console.log(
        `${logger} Processing generation ${args.generationId} (attempt ${attempt}/${MAX_POLLINATIONS_ATTEMPTS})`
    )

    const pollinationsApiKey = args.apiKey
    if (!pollinationsApiKey || pollinationsApiKey.trim().length === 0) {
        console.error(`${logger} No Pollinations API key provided`)
        await ctx.runMutation(internal.singleGeneration.updateGenerationStatus, {
            generationId: args.generationId,
            status: "failed",
            errorMessage: "No Pollinations API key provided. Please connect to Pollinations first.",
        })
        return
    }

    try {
        const params = generation.generationParams
        const shouldCropDirtberry = isDirtberryModel(params.model)
        const dirtberrySourceDimensions = shouldCropDirtberry ? getDirtberrySourceDimensions() : null
        const INT32_MAX = 2147483647
        const rawSeed = params.seed ?? Math.floor(Math.random() * INT32_MAX)
        const seed = Math.min(rawSeed, INT32_MAX)
        const isVideoRequest =
            params.duration !== undefined ||
            params.audio !== undefined ||
            params.aspectRatio !== undefined ||
            params.lastFrameImage !== undefined

        if (await isCancelled()) {
            console.log(`${logger} Generation ${args.generationId} was cancelled before provider request`)
            return
        }

        let imageBuffer: Buffer
        let contentType: string

        if (shouldUseDevGenerationMock(isVideoRequest)) {
            imageBuffer = Buffer.from(MOCK_IMAGE_BUFFER)
            contentType = "image/png"
            console.log(
                `${logger} Dev mock enabled, using placeholder image for generation ${args.generationId}`
            )
        } else {
            const generationUrl = buildPollinationsUrl({
                prompt: params.prompt,
                negativePrompt: params.negativePrompt,
                model: params.model,
                width: dirtberrySourceDimensions?.width ?? params.width,
                height: dirtberrySourceDimensions?.height ?? params.height,
                seed,
                enhance: params.enhance,
                private: params.private,
                safe: params.safe,
                image: params.image,
                duration: params.duration,
                audio: params.audio,
                aspectRatio: params.aspectRatio,
                lastFrameImage: params.lastFrameImage,
                quality: params.quality ?? "high",
            })

            console.log(`${logger} Calling Pollinations: ${generationUrl}`)
            const pollinationsAttempt = await fetchPollinationsWithTimeout(
                generationUrl,
                pollinationsApiKey,
                POLLINATIONS_FETCH_TIMEOUT_MS,
                logger
            )

            if (!pollinationsAttempt.success) {
                const canRetry =
                    pollinationsAttempt.retryable &&
                    attempt < MAX_POLLINATIONS_ATTEMPTS &&
                    !(await isCancelled())

                if (canRetry) {
                    const delayMs = Math.round(
                        calculateBackoffDelay(
                            attempt - 1,
                            POLLINATIONS_RETRY_CONFIG.baseDelayMs,
                            POLLINATIONS_RETRY_CONFIG.maxDelayMs
                        )
                    )

                    await ctx.runMutation(internal.singleGeneration.updateGenerationStatus, {
                        generationId: args.generationId,
                        status: "processing",
                        retryCount: attempt,
                    })

                    await ctx.scheduler.runAfter(
                        delayMs,
                        internal.singleGenerationProcessor.processGenerationInternal,
                        {
                            generationId: args.generationId,
                            apiKey: pollinationsApiKey,
                            attempt: attempt + 1,
                        }
                    )

                    console.error(
                        `${logger} Pollinations call failed (attempt ${attempt}/${MAX_POLLINATIONS_ATTEMPTS}), retrying in ${delayMs}ms: ${pollinationsAttempt.errorMessage}`
                    )
                    return
                }

                await ctx.runMutation(internal.singleGeneration.updateGenerationStatus, {
                    generationId: args.generationId,
                    status: "failed",
                    errorMessage: pollinationsAttempt.errorMessage,
                    errorCode: pollinationsAttempt.statusCode,
                    retryCount: attempt > 1 ? attempt - 1 : undefined,
                })
                return
            }

            const response = pollinationsAttempt.response
            imageBuffer = Buffer.from(await response.arrayBuffer())
            contentType = response.headers.get("content-type") || "image/jpeg"
        }

        if (await isCancelled()) {
            console.log(`${logger} Generation ${args.generationId} was cancelled after provider response`)
            return
        }

        let uploadBuffer = imageBuffer
        let outputWidth = params.width ?? 1024
        let outputHeight = params.height ?? 1024

        if (shouldCropDirtberry) {
            try {
                const cropped = await cropDirtberryImageBuffer(imageBuffer)
                uploadBuffer = Buffer.from(cropped.buffer)
                outputWidth = cropped.width
                outputHeight = cropped.height

                if (cropped.wasCropped) {
                    console.log(
                        `${logger} Applied Dirtberry crop (${cropped.processor}): ${cropped.inputWidth}x${cropped.inputHeight} -> ${cropped.width}x${cropped.height} (trim=${cropped.trimPixels}px)`
                    )
                } else {
                    console.log(
                        `${logger} Dirtberry crop skipped: source=${cropped.inputWidth}x${cropped.inputHeight} (image too small to trim safely)`
                    )
                }
            } catch (cropError) {
                console.error(
                    `${logger} Dirtberry crop failed, falling back to original image:`,
                    cropError
                )
            }
        }

        const r2Key = generateR2Key(generation.ownerId, contentType)
        console.log(`${logger} Uploading to R2: ${r2Key}`)

        const { media: uploadResult, thumbnail: thumbnailResult } = await uploadMediaWithThumbnail(
            uploadBuffer,
            r2Key,
            contentType
        )

        console.log(`${logger} Upload complete: ${uploadResult.url}`)
        if (thumbnailResult) {
            console.log(
                `${logger} Thumbnail complete: ${thumbnailResult.url} (${thumbnailResult.sizeBytes} bytes)`
            )
        } else if (!contentType.startsWith("video/")) {
            console.log(`${logger} Thumbnail generation skipped or failed`)
        }

        if (await isCancelled()) {
            console.log(
                `${logger} Generation ${args.generationId} was cancelled before persistence, cleaning up R2 objects`
            )
            const keysToDelete = [r2Key]
            if (thumbnailResult?.url) keysToDelete.push(generateThumbnailKey(r2Key))
            try {
                await deleteR2Objects(keysToDelete)
                console.log(`${logger} R2 cleanup succeeded for generation ${args.generationId}`)
            } catch (err) {
                console.error(`${logger} R2 cleanup failed for generation ${args.generationId}:`, err)
            }
            return
        }

        const imageId = await ctx.runMutation(internal.singleGeneration.storeGeneratedImage, {
            ownerId: generation.ownerId,
            r2Key,
            url: uploadResult.url,
            thumbnailR2Key: thumbnailResult?.url ? generateThumbnailKey(r2Key) : undefined,
            thumbnailUrl: thumbnailResult?.url,
            previewR2Key: undefined,
            previewUrl: undefined,
            prompt: params.prompt,
            width: outputWidth,
            height: outputHeight,
            model: params.model ?? "flux",
            seed,
            contentType,
            sizeBytes: uploadResult.sizeBytes,
            generationParams: shouldCropDirtberry
                ? {
                    ...params,
                    seed,
                    width: outputWidth,
                    height: outputHeight,
                }
                : {
                    ...params,
                    seed,
                },
            visibility: params.private ? "unlisted" : "public",
        })

        console.log(`${logger} Generation ${args.generationId} completed successfully`)

        await ctx.runMutation(internal.singleGeneration.updateGenerationStatus, {
            generationId: args.generationId,
            status: "completed",
            imageId,
            retryCount: attempt > 1 ? attempt - 1 : undefined,
        })

        if (contentType.startsWith("video/")) {
            await ctx.scheduler.runAfter(0, internal.secondaryAssetsProcessor.processSecondaryAssets, {
                imageId,
                videoUrl: uploadResult.url,
                r2Key,
            })
            console.log(`${logger} Scheduled background secondary asset processing for ${imageId}`)
        }
    } catch (error) {
        console.error(`${logger} Error processing generation:`, error)
        await ctx.runMutation(internal.singleGeneration.updateGenerationStatus, {
            generationId: args.generationId,
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            retryCount: attempt > 1 ? attempt - 1 : undefined,
        })
    }
}

// ============================================================
// Public + Internal Actions
// ============================================================

/**
 * Public entrypoint used by clients to immediately start processing
 * a persisted generation without an intermediate wrapper action.
 */
export const processGeneration = action({
    args: {
        generationId: v.id("pendingGenerations"),
        apiKey: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }
        await runGenerationProcessor(ctx, args, identity.subject)
    },
})

/**
 * Internal entrypoint used for scheduled recovery/retries.
 */
export const processGenerationInternal = internalAction({
    args: {
        generationId: v.id("pendingGenerations"),
        apiKey: v.string(),
        attempt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await runGenerationProcessor(ctx, args)
    },
})
