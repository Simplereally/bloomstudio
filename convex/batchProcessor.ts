"use node"

/**
 * Batch Processing Action (Node.js Runtime)
 * 
 * This file uses the Node.js runtime to enable:
 * - AWS SDK for R2 uploads
 * - Full Node.js Buffer support
 * 
 * BYOP (Bring Your Own Pollen) Flow:
 * The action reads the API key from the batch job record (stored when job was created).
 * No server-side key decryption is needed.
 * 
 * Implements retry logic with exponential backoff for transient failures.
 */

import { v } from "convex/values"
import { internal } from "./_generated/api"
import { internalAction } from "./_generated/server"
import {
    buildPollinationsUrl,
    calculateBackoffDelay,
    cropDirtberryImageBuffer,
    fetchPollinationsWithTimeout,
    getDirtberrySourceDimensions,
    isDirtberryModel,
    generateR2Key,
    generateThumbnailKey,
    uploadMediaWithThumbnail,
    type RetryConfig,
} from "./lib"

// ============================================================
// Retry Configuration
// ============================================================

/** Retry configuration for Pollinations API calls in batch processing */
const POLLINATIONS_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 2000,
    maxDelayMs: 30000,
}
const POLLINATIONS_FETCH_TIMEOUT_MS = 45_000
const MAX_POLLINATIONS_ATTEMPTS = POLLINATIONS_RETRY_CONFIG.maxRetries + 1
const ENABLE_DEV_GENERATION_MOCK = process.env.CONVEX_ENABLE_DEV_GENERATION_MOCK === "true"
const MOCK_PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7k6xwAAAAASUVORK5CYII="
const MOCK_IMAGE_BUFFER = Buffer.from(MOCK_PNG_BASE64, "base64")

function shouldUseDevGenerationMock(isVideoRequest: boolean): boolean {
    const deployment = process.env.CONVEX_DEPLOYMENT ?? ""
    const isDevDeployment = deployment.startsWith("dev:")
    return ENABLE_DEV_GENERATION_MOCK && isDevDeployment && !isVideoRequest
}

// ============================================================
// Internal Action
// ============================================================

/**
 * Internal action to process a single batch item.
 * This action runs in the Node.js runtime and directly:
 * 1. Calls Pollinations API to generate the image (with retry logic)
 * 2. Uploads the image to R2 storage
 * 3. Stores the metadata in Convex
 * 4. Schedules the next item
 * 
 * No external API route needed - everything happens on Convex servers.
 */
export const processBatchItem = internalAction({
    args: {
        batchJobId: v.id("batchJobs"),
        itemIndex: v.number(),
        attempt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const logger = `[BatchProcessor]`
        const attempt = args.attempt ?? 1

        // Fire-and-forget scheduling of the NEXT item immediately, but only
        // for the first attempt of this item (retries should not fan out).
        if (attempt === 1) {
            try {
                await ctx.runMutation(internal.batchGeneration.scheduleNextBatchItem, {
                    batchJobId: args.batchJobId,
                    currentItemIndex: args.itemIndex,
                })
            } catch (error) {
                console.error(`${logger} Failed to schedule next item:`, error)
                // Continue processing current item even if scheduling next fails
            }
        }

        // Get the batch job to check status and get params
        const batchJob = await ctx.runQuery(internal.batchGeneration.getBatchJobInternal, {
            batchJobId: args.batchJobId,
        })

        if (!batchJob) {
            console.error(`${logger} Batch job ${args.batchJobId} not found`)
            return
        }

        // Don't process if cancelled, paused, completed, or failed
        // Note: We check this AFTER scheduling next, so we might have scheduled one more
        // but that one will also check status and stop.
        // We must decrement in-flight count since this item won't be processed.
        if (batchJob.status !== "pending" && batchJob.status !== "processing") {
            console.log(`${logger} Batch ${args.batchJobId} status is ${batchJob.status}, stopping (decrementing in-flight)`)
            await ctx.runMutation(internal.batchGeneration.decrementInFlightCount, {
                batchJobId: args.batchJobId,
            })
            return
        }

        console.log(
            `${logger} Processing item ${args.itemIndex + 1}/${batchJob.totalCount} for batch ${args.batchJobId} (attempt ${attempt}/${MAX_POLLINATIONS_ATTEMPTS})`
        )

        // Use the API key stored in the batch job (BYOP flow)
        const pollinationsApiKey = batchJob.apiKey

        // Validate API key
        if (!pollinationsApiKey || pollinationsApiKey.trim().length === 0) {
            console.error(`${logger} No Pollinations API key in batch job`)
            await ctx.runMutation(internal.batchGeneration.recordBatchItemResult, {
                batchJobId: args.batchJobId,
                itemIndex: args.itemIndex,
                success: false,
                errorMessage: "No Pollinations API key configured. Please connect to Pollinations first.",
                retryCount: attempt > 1 ? attempt - 1 : undefined,
            })
            return
        }

        try {
            const shouldCropDirtberry = isDirtberryModel(batchJob.generationParams.model)
            const dirtberrySourceDimensions = shouldCropDirtberry ? getDirtberrySourceDimensions() : null
            // Pollinations API only accepts seeds up to int32 max (2147483647)
            const INT32_MAX = 2147483647
            const rawSeed = batchJob.generationParams.seed ?? Math.floor(Math.random() * INT32_MAX)
            const seed = Math.min(rawSeed, INT32_MAX)
            const isVideoRequest =
                batchJob.generationParams.duration !== undefined ||
                batchJob.generationParams.audio !== undefined ||
                batchJob.generationParams.aspectRatio !== undefined ||
                batchJob.generationParams.lastFrameImage !== undefined

            let imageBuffer: Buffer
            let contentType: string

            if (shouldUseDevGenerationMock(isVideoRequest)) {
                imageBuffer = Buffer.from(MOCK_IMAGE_BUFFER)
                contentType = "image/png"
                console.log(
                    `${logger} Dev mock enabled, using placeholder image for batch ${args.batchJobId} item ${args.itemIndex + 1}`
                )
            } else {
                // Build the generation URL
                const generationUrl = buildPollinationsUrl({
                    prompt: batchJob.generationParams.prompt,
                    negativePrompt: batchJob.generationParams.negativePrompt,
                    model: batchJob.generationParams.model,
                    width: dirtberrySourceDimensions?.width ?? batchJob.generationParams.width,
                    height: dirtberrySourceDimensions?.height ?? batchJob.generationParams.height,
                    seed,
                    enhance: batchJob.generationParams.enhance,
                    private: batchJob.generationParams.private,
                    safe: batchJob.generationParams.safe,
                    image: batchJob.generationParams.image,
                    // Video-specific parameters
                    duration: batchJob.generationParams.duration,
                    audio: batchJob.generationParams.audio,
                    aspectRatio: batchJob.generationParams.aspectRatio,
                    lastFrameImage: batchJob.generationParams.lastFrameImage,
                })

                console.log(
                    `${logger} Generating with model=${batchJob.generationParams.model}, size=${batchJob.generationParams.width}x${batchJob.generationParams.height}, seed=${seed}`
                )

                const pollinationsAttempt = await fetchPollinationsWithTimeout(
                    generationUrl,
                    pollinationsApiKey,
                    POLLINATIONS_FETCH_TIMEOUT_MS,
                    `${logger} Item ${args.itemIndex + 1}`,
                    true
                )

                if (!pollinationsAttempt.success) {
                    const canRetry =
                        pollinationsAttempt.retryable && attempt < MAX_POLLINATIONS_ATTEMPTS

                    if (canRetry) {
                        await ctx.runMutation(internal.batchGeneration.adjustAdaptiveDelay, {
                            batchJobId: args.batchJobId,
                            outcome:
                                pollinationsAttempt.retryKind === "throttle"
                                    ? "throttle"
                                    : "transient_error",
                        })

                        const delayMs = Math.round(
                            calculateBackoffDelay(
                                attempt - 1,
                                POLLINATIONS_RETRY_CONFIG.baseDelayMs,
                                POLLINATIONS_RETRY_CONFIG.maxDelayMs
                            )
                        )
                        await ctx.scheduler.runAfter(delayMs, internal.batchProcessor.processBatchItem, {
                            batchJobId: args.batchJobId,
                            itemIndex: args.itemIndex,
                            attempt: attempt + 1,
                        })
                        console.error(
                            `${logger} Item ${args.itemIndex + 1} failed (attempt ${attempt}/${MAX_POLLINATIONS_ATTEMPTS}), retrying in ${delayMs}ms: ${pollinationsAttempt.errorMessage}`
                        )
                        return
                    }

                    await ctx.runMutation(internal.batchGeneration.recordBatchItemResult, {
                        batchJobId: args.batchJobId,
                        itemIndex: args.itemIndex,
                        success: false,
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

            let uploadBuffer = imageBuffer
            let outputWidth = batchJob.generationParams.width ?? 1024
            let outputHeight = batchJob.generationParams.height ?? 1024

            // Crop Dirtberry outputs before upload/persistence so every surface
            // (canvas, gallery, downloads, lightbox) uses the same native asset.
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

            // Upload to R2 (and thumbnail for images — videos defer secondary assets)
            const r2Key = generateR2Key(batchJob.ownerId, contentType)
            console.log(`${logger} Uploading to R2: ${r2Key}`)

            const { media: uploadResult, thumbnail: thumbnailResult } = await uploadMediaWithThumbnail(
                uploadBuffer,
                r2Key,
                contentType
            )

            console.log(`${logger} Upload complete: ${uploadResult.url}`)
            if (thumbnailResult) {
                console.log(`${logger} Thumbnail complete: ${thumbnailResult.url} (${thumbnailResult.sizeBytes} bytes)`)
            }

            // Store the image in Convex database — immediately, without waiting for secondary assets
            const imageId = await ctx.runMutation(internal.batchGeneration.storeGeneratedImage, {
                ownerId: batchJob.ownerId,
                r2Key,
                url: uploadResult.url,
                thumbnailR2Key: thumbnailResult?.url ? generateThumbnailKey(r2Key) : undefined,
                thumbnailUrl: thumbnailResult?.url,
                // Preview is always deferred for videos; not applicable for images
                previewR2Key: undefined,
                previewUrl: undefined,
                prompt: batchJob.generationParams.prompt,
                width: outputWidth,
                height: outputHeight,
                model: batchJob.generationParams.model ?? "flux",
                seed,
                contentType,
                sizeBytes: uploadResult.sizeBytes,
                generationParams: shouldCropDirtberry
                    ? {
                        ...batchJob.generationParams,
                        seed,
                        width: outputWidth,
                        height: outputHeight,
                    }
                    : {
                        ...batchJob.generationParams,
                        seed,
                    },
                visibility: batchJob.generationParams.private ? "unlisted" : "public",
            })

            console.log(
                `${logger} Item ${args.itemIndex + 1} completed successfully${attempt > 1 ? ` (after ${attempt} attempts)` : ""}`
            )
            await ctx.runMutation(internal.batchGeneration.adjustAdaptiveDelay, {
                batchJobId: args.batchJobId,
                outcome: "success",
            })

            // Record the result
            await ctx.runMutation(internal.batchGeneration.recordBatchItemResult, {
                batchJobId: args.batchJobId,
                itemIndex: args.itemIndex,
                success: true,
                imageId,
                retryCount: attempt > 1 ? attempt - 1 : undefined,
            })

            // Schedule background secondary asset processing for videos
            // (thumbnail extraction + preview transcode). This runs AFTER the
            // batch item is already recorded as successful — failures here are non-fatal.
            if (contentType.startsWith("video/")) {
                await ctx.scheduler.runAfter(0, internal.secondaryAssetsProcessor.processSecondaryAssets, {
                    imageId,
                    videoUrl: uploadResult.url,
                    r2Key,
                })
                console.log(`${logger} Scheduled background secondary asset processing for ${imageId}`)
            }

        } catch (error) {
            console.error(`${logger} Error processing item ${args.itemIndex}:`, error)
            await ctx.runMutation(internal.batchGeneration.recordBatchItemResult, {
                batchJobId: args.batchJobId,
                itemIndex: args.itemIndex,
                success: false,
                errorMessage: error instanceof Error ? error.message : "Unknown error",
                retryCount: attempt > 1 ? attempt - 1 : undefined,
            })
        }
    },
})
