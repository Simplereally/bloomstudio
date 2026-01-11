"use node"

/**
 * Single Generation Processor Action (Node.js Runtime)
 * 
 * This file uses the Node.js runtime to enable:
 * - AWS SDK for R2 uploads
 * - Node.js crypto for API key decryption
 * 
 * The action directly calls Pollinations API and uploads to R2,
 * using the user's stored (encrypted) Pollinations API key.
 * 
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
 * Includes retry logic with exponential backoff for transient failures.
 */
export const processGeneration = internalAction({
    args: {
        generationId: v.id("pendingGenerations"),
    },
    handler: async (ctx, args) => {
        const logger = "[SingleGeneration]"

        // Get the generation record
        const generation = await ctx.runQuery(internal.singleGeneration.getGenerationInternal, {
            generationId: args.generationId,
        })

        if (!generation) {
            console.error(`${logger} Generation ${args.generationId} not found`)
            return
        }

        if (generation.status !== "pending") {
            console.log(`${logger} Generation ${args.generationId} status is ${generation.status}, skipping`)
            return
        }

        // Update status to processing
        await ctx.runMutation(internal.singleGeneration.updateGenerationStatus, {
            generationId: args.generationId,
            status: "processing",
        })

        console.log(`${logger} Processing generation ${args.generationId}`)

        // Get user's encrypted API key
        const encryptedApiKey = await ctx.runQuery(internal.users.getEncryptedApiKeyByClerkId, {
            clerkId: generation.ownerId,
        })

        if (!encryptedApiKey) {
            console.error(`${logger} User has no Pollinations API key configured`)
            await ctx.runMutation(internal.singleGeneration.updateGenerationStatus, {
                generationId: args.generationId,
                status: "failed",
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
            await ctx.runMutation(internal.singleGeneration.updateGenerationStatus, {
                generationId: args.generationId,
                status: "failed",
                errorMessage: "Failed to decrypt API key. Please re-enter your API key in settings.",
            })
            return
        }

        try {
            const params = generation.generationParams
            // Pollinations API only accepts seeds up to int32 max (2147483647)
            const INT32_MAX = 2147483647
            const rawSeed = params.seed ?? Math.floor(Math.random() * INT32_MAX)
            const seed = Math.min(rawSeed, INT32_MAX)

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
                    retryCount: result.attemptsMade - 1,
                })
                return
            }

            const response = result.data

            // Get the image data
            const imageBuffer = Buffer.from(await response.arrayBuffer())
            const contentType = response.headers.get("content-type") || "image/jpeg"

            // Upload to R2 and generate thumbnail in parallel (for videos)
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
            } else {
                console.log(`${logger} Thumbnail generation skipped or failed`)
            }

            // Store the image in Convex database
            const imageId = await ctx.runMutation(internal.singleGeneration.storeGeneratedImage, {
                ownerId: generation.ownerId,
                r2Key,
                url: uploadResult.url,
                thumbnailR2Key: thumbnailResult?.url ? generateThumbnailKey(r2Key) : undefined,
                thumbnailUrl: thumbnailResult?.url,
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

            // Update generation status to completed
            await ctx.runMutation(internal.singleGeneration.updateGenerationStatus, {
                generationId: args.generationId,
                status: "completed",
                imageId,
                retryCount: result.attemptsMade > 1 ? result.attemptsMade - 1 : undefined,
            })

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
