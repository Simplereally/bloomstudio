"use node"

/**
 * Batch Processing Action (Node.js Runtime)
 * 
 * This file uses the Node.js runtime to enable:
 * - AWS SDK for R2 uploads
 * - Full Node.js Buffer support
 * - Node.js crypto for API key decryption
 * 
 * The action directly calls Pollinations API and uploads to R2,
 * without needing to go through the Next.js API route.
 * 
 * Uses the user's stored (encrypted) Pollinations API key from Convex.
 * Implements retry logic with exponential backoff for transient failures.
 */

import { v } from "convex/values"
import { internal } from "./_generated/api"
import { internalAction } from "./_generated/server"
import {
    decryptApiKey,
    buildPollinationsUrl,
    classifyApiError,
    generateR2Key,
    generateThumbnailKey,
    uploadMediaWithThumbnail,
    fetchWithRetry,
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
    },
    handler: async (ctx, args) => {
        const logger = `[BatchProcessor]`

        // 1. Fire-and-forget scheduling of the NEXT item immediately
        // This ensures high throughput (10 req/s) by pipelining requests
        // independent of how long the current generation takes.
        try {
            await ctx.runMutation(internal.batchGeneration.scheduleNextBatchItem, {
                batchJobId: args.batchJobId,
                currentItemIndex: args.itemIndex,
            })
        } catch (error) {
            console.error(`${logger} Failed to schedule next item:`, error)
            // Continue processing current item even if scheduling next fails
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

        console.log(`${logger} Processing item ${args.itemIndex + 1}/${batchJob.totalCount} for batch ${args.batchJobId}`)

        // Get the user's encrypted API key from the database
        const encryptedApiKey = await ctx.runQuery(internal.users.getEncryptedApiKeyByClerkId, {
            clerkId: batchJob.ownerId,
        })

        if (!encryptedApiKey) {
            console.error(`${logger} User has no Pollinations API key configured`)
            await ctx.runMutation(internal.batchGeneration.recordBatchItemResult, {
                batchJobId: args.batchJobId,
                itemIndex: args.itemIndex,
                success: false,
                errorMessage: "No Pollinations API key configured. Please add your API key in settings.",
            })
            return
        }

        // Decrypt the API key
        let pollinationsApiKey: string
        try {
            pollinationsApiKey = decryptApiKey(encryptedApiKey)
        } catch (error) {
            console.error(`${logger} Failed to decrypt API key:`, error)
            await ctx.runMutation(internal.batchGeneration.recordBatchItemResult, {
                batchJobId: args.batchJobId,
                itemIndex: args.itemIndex,
                success: false,
                errorMessage: "Failed to decrypt API key. Please re-enter your API key in settings.",
            })
            return
        }

        try {
            // Pollinations API only accepts seeds up to int32 max (2147483647)
            const INT32_MAX = 2147483647
            const rawSeed = batchJob.generationParams.seed ?? Math.floor(Math.random() * INT32_MAX)
            const seed = Math.min(rawSeed, INT32_MAX)

            // Build the generation URL
            const generationUrl = buildPollinationsUrl({
                prompt: batchJob.generationParams.prompt,
                negativePrompt: batchJob.generationParams.negativePrompt,
                model: batchJob.generationParams.model,
                width: batchJob.generationParams.width,
                height: batchJob.generationParams.height,
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

            // Log generation request without prompt (which may contain PII)
            console.log(`${logger} Generating with model=${batchJob.generationParams.model}, size=${batchJob.generationParams.width}x${batchJob.generationParams.height}, seed=${seed}`)

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
                `${logger} Item ${args.itemIndex + 1}`
            )

            if (!result.success || !result.data) {
                console.error(`${logger} Pollinations API error after ${result.attemptsMade} attempts:`, result.error)
                await ctx.runMutation(internal.batchGeneration.recordBatchItemResult, {
                    batchJobId: args.batchJobId,
                    itemIndex: args.itemIndex,
                    success: false,
                    errorMessage: result.error ?? "Generation failed after retries",
                    retryCount: result.attemptsMade - 1,
                })
                return
            }

            const response = result.data

            // Get the image data
            const imageBuffer = Buffer.from(await response.arrayBuffer())
            const contentType = response.headers.get("content-type") || "image/jpeg"

            // Upload to R2 and generate thumbnail in parallel (for videos)
            const r2Key = generateR2Key(batchJob.ownerId, contentType)
            console.log(`${logger} Uploading to R2: ${r2Key}`)

            const { media: uploadResult, thumbnail: thumbnailResult } = await uploadMediaWithThumbnail(
                imageBuffer,
                r2Key,
                contentType
            )

            console.log(`${logger} Upload complete: ${uploadResult.url}`)
            if (thumbnailResult) {
                console.log(`${logger} Thumbnail complete: ${thumbnailResult.url} (${thumbnailResult.sizeBytes} bytes)`)
            }

            // Store the image in Convex database
            const imageId = await ctx.runMutation(internal.batchGeneration.storeGeneratedImage, {
                ownerId: batchJob.ownerId,
                r2Key,
                url: uploadResult.url,
                thumbnailR2Key: thumbnailResult?.url ? generateThumbnailKey(r2Key) : undefined,
                thumbnailUrl: thumbnailResult?.url,
                prompt: batchJob.generationParams.prompt,
                width: batchJob.generationParams.width ?? 1024,
                height: batchJob.generationParams.height ?? 1024,
                model: batchJob.generationParams.model ?? "flux",
                seed,
                contentType,
                sizeBytes: uploadResult.sizeBytes,
                generationParams: {
                    ...batchJob.generationParams,
                    seed,
                },
                visibility: batchJob.generationParams.private ? "unlisted" : "public",
            })

            console.log(`${logger} Item ${args.itemIndex + 1} completed successfully${result.attemptsMade > 1 ? ` (after ${result.attemptsMade} attempts)` : ""}`)

            // Record the result
            await ctx.runMutation(internal.batchGeneration.recordBatchItemResult, {
                batchJobId: args.batchJobId,
                itemIndex: args.itemIndex,
                success: true,
                imageId,
                retryCount: result.attemptsMade > 1 ? result.attemptsMade - 1 : undefined,
            })

        } catch (error) {
            console.error(`${logger} Error processing item ${args.itemIndex}:`, error)
            await ctx.runMutation(internal.batchGeneration.recordBatchItemResult, {
                batchJobId: args.batchJobId,
                itemIndex: args.itemIndex,
                success: false,
                errorMessage: error instanceof Error ? error.message : "Unknown error",
            })
        }
    },
})
