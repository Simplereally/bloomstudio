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
import { internal } from "./_generated/api"
import { internalAction } from "./_generated/server"
import {
    buildPollinationsUrl,
    classifyApiError,
    generateR2Key,
    generateThumbnailKey,
    uploadMediaWithThumbnail,
    deleteR2Objects,
    fetchWithRetry,
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

/**
 * Determine if an API error should be retried based on status and response.
 * 
 * Retryable:
 * - 429 (Rate limit)
 * - 5xx (Server errors)
 * - Known transient errors (e.g., "No active flux servers available")
 * 
 * Non-retryable:
 * - 400 (Bad request - invalid parameters)
 * - 401, 403 (Auth errors)
 */
function shouldRetryPollinationsError(status: number, errorText: string): boolean {
    const classification = classifyApiError(status, errorText)
    return classification.isRetryable
}

// ============================================================
// Internal Action
// ============================================================

/**
 * Internal action to process a single image generation.
 * Receives the API key directly from the mutation (BYOP flow).
 * Includes retry logic with exponential backoff for transient failures.
 */
export const processGeneration = internalAction({
    args: {
        generationId: v.id("pendingGenerations"),
        /** The Pollinations API key passed from the client (BYOP flow) */
        apiKey: v.string(),
    },
    handler: async (ctx, args) => {
        const logger = "[SingleGeneration]"

        const getGeneration = async () =>
            ctx.runQuery(internal.singleGeneration.getGenerationInternal, {
                generationId: args.generationId,
            })

        const isCancelled = async () => {
            const current = await getGeneration()
            return current?.status === "cancelled"
        }

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

        // Get the generation record after the claim succeeds.
        const generation = await getGeneration()
        if (!generation) {
            console.error(`${logger} Generation ${args.generationId} disappeared after claim`)
            return
        }

        console.log(`${logger} Processing generation ${args.generationId}`)

        // Use the API key passed from the client (BYOP flow)
        const pollinationsApiKey = args.apiKey

        // Validate API key
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
            // Pollinations API only accepts seeds up to int32 max (2147483647)
            const INT32_MAX = 2147483647
            const rawSeed = params.seed ?? Math.floor(Math.random() * INT32_MAX)
            const seed = Math.min(rawSeed, INT32_MAX)

            if (await isCancelled()) {
                console.log(`${logger} Generation ${args.generationId} was cancelled before provider request`)
                return
            }

            // Build the generation URL
            const generationUrl = buildPollinationsUrl({
                prompt: params.prompt,
                negativePrompt: params.negativePrompt,
                model: params.model,
                width: params.width,
                height: params.height,
                seed,
                enhance: params.enhance,
                private: params.private,
                safe: params.safe,
                image: params.image,
                // Video-specific parameters
                duration: params.duration,
                audio: params.audio,
                aspectRatio: params.aspectRatio,
                lastFrameImage: params.lastFrameImage,
                quality: params.quality ?? "high"
            })

            console.log(`${logger} Calling Pollinations: ${generationUrl}`)

            // Call Pollinations API with retry logic
            const result = await fetchWithRetry(
                generationUrl,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${pollinationsApiKey}`,
                    },
                },
                shouldRetryPollinationsError,
                POLLINATIONS_RETRY_CONFIG,
                logger
            )

            // Update retry count in the database
            if (result.attemptsMade > 1) {
                await ctx.runMutation(internal.singleGeneration.updateGenerationStatus, {
                    generationId: args.generationId,
                    status: "processing",
                    retryCount: result.attemptsMade - 1,
                })
            }

            if (!result.success || !result.data) {
                console.error(`${logger} Pollinations API error after ${result.attemptsMade} attempts:`, result.error)
                await ctx.runMutation(internal.singleGeneration.updateGenerationStatus, {
                    generationId: args.generationId,
                    status: "failed",
                    errorMessage: result.error ?? "Generation failed after retries",
                    // Include HTTP status code for client-side error detection (401=auth, 402=budget, 403=access)
                    errorCode: result.lastStatus,
                    retryCount: result.attemptsMade - 1,
                })
                return
            }

            const response = result.data

            if (await isCancelled()) {
                console.log(`${logger} Generation ${args.generationId} was cancelled after provider response`)
                return
            }

            // Get the image data
            const imageBuffer = Buffer.from(await response.arrayBuffer())
            const contentType = response.headers.get("content-type") || "image/jpeg"

            // Upload to R2 (and thumbnail for images — videos defer secondary assets)
            const r2Key = generateR2Key(generation.ownerId, contentType)
            console.log(`${logger} Uploading to R2: ${r2Key}`)

            const { media: uploadResult, thumbnail: thumbnailResult } = await uploadMediaWithThumbnail(
                imageBuffer,
                r2Key,
                contentType
            )

            console.log(`${logger} Upload complete: ${uploadResult.url}`)
            if (thumbnailResult) {
                console.log(`${logger} Thumbnail complete: ${thumbnailResult.url} (${thumbnailResult.sizeBytes} bytes)`)
            } else if (!contentType.startsWith("video/")) {
                console.log(`${logger} Thumbnail generation skipped or failed`)
            }

            if (await isCancelled()) {
                console.log(`${logger} Generation ${args.generationId} was cancelled before persistence, cleaning up R2 objects`)
                // Best-effort R2 cleanup to avoid orphan objects
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

            // Store the image in Convex database — immediately, without waiting for secondary assets
            const imageId = await ctx.runMutation(internal.singleGeneration.storeGeneratedImage, {
                ownerId: generation.ownerId,
                r2Key,
                url: uploadResult.url,
                thumbnailR2Key: thumbnailResult?.url ? generateThumbnailKey(r2Key) : undefined,
                thumbnailUrl: thumbnailResult?.url,
                // Preview is always deferred for videos; not applicable for images
                previewR2Key: undefined,
                previewUrl: undefined,
                prompt: params.prompt,
                width: params.width ?? 1024,
                height: params.height ?? 1024,
                model: params.model ?? "flux",
                seed,
                contentType,
                sizeBytes: uploadResult.sizeBytes,
                generationParams: {
                    ...params,
                    seed,
                },
                visibility: params.private ? "unlisted" : "public",
            })

            console.log(`${logger} Generation ${args.generationId} completed successfully`)

            // Update generation status to completed — user sees result NOW
            await ctx.runMutation(internal.singleGeneration.updateGenerationStatus, {
                generationId: args.generationId,
                status: "completed",
                imageId,
                retryCount: result.attemptsMade > 1 ? result.attemptsMade - 1 : undefined,
            })

            // Schedule background secondary asset processing for videos
            // (thumbnail extraction + preview transcode). This runs AFTER the
            // generation is already "completed" — failures here are non-fatal.
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
            })
        }
    },
})
