"use node"

/**
 * Secondary Asset Processor (Node.js Runtime)
 *
 * Handles thumbnail extraction and preview generation for videos AFTER
 * the generation has already been marked as completed. This decouples
 * the slow ffmpeg transcode (~30-40s) from the critical path, letting
 * users see their generation result as soon as the video is in R2.
 *
 * Flow:
 * 1. Processor uploads video to R2 and marks generation "completed"
 * 2. Processor schedules `processSecondaryAssets` via `ctx.scheduler.runAfter(0, ...)`
 * 3. This action fetches the video from R2, generates thumbnail + preview
 * 4. Uploads secondary assets to R2 and patches the image record
 *
 * Error handling: Failures are logged but NEVER fail the generation.
 * The image record simply won't have thumbnail/preview URLs, and the
 * feed falls back to using the raw video.
 */

import { v } from "convex/values"
import { internal } from "./_generated/api"
import { internalAction } from "./_generated/server"
import {
    generateAndUploadVideoSecondaryAssets,
    generateThumbnailKey,
    generatePreviewKey,
} from "./lib"

// ============================================================
// Internal Action: Process Secondary Assets
// ============================================================

/**
 * Background action to generate and upload thumbnail + preview for a video.
 *
 * Fetches the original video from its public R2 URL, runs ffmpeg to extract
 * a thumbnail frame and generate a compressed preview, then patches the
 * image record with the new URLs.
 *
 * This action is fire-and-forget from the caller's perspective. Any failure
 * here is logged but does not affect the generation status.
 */
export const processSecondaryAssets = internalAction({
    args: {
        imageId: v.id("generatedImages"),
        videoUrl: v.string(),
        r2Key: v.string(),
    },
    handler: async (ctx, args) => {
        const logger = "[SecondaryAssets]"

        try {
            console.log(`${logger} Starting background processing for image ${args.imageId}`)

            // Fetch the video from R2
            const response = await fetch(args.videoUrl)
            if (!response.ok) {
                console.error(`${logger} Failed to fetch video from ${args.videoUrl}: ${response.status} ${response.statusText}`)
                return
            }

            const videoBuffer = Buffer.from(await response.arrayBuffer())
            console.log(`${logger} Fetched video: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`)

            // Generate and upload thumbnail + preview
            const { thumbnail, preview } = await generateAndUploadVideoSecondaryAssets(
                videoBuffer,
                args.r2Key,
            )

            // Only patch the image record if we produced at least one asset
            if (thumbnail || preview) {
                await ctx.runMutation(internal.secondaryAssets.updateSecondaryAssets, {
                    imageId: args.imageId,
                    thumbnailR2Key: thumbnail ? generateThumbnailKey(args.r2Key) : undefined,
                    thumbnailUrl: thumbnail?.url,
                    previewR2Key: preview ? generatePreviewKey(args.r2Key) : undefined,
                    previewUrl: preview?.url,
                })
                console.log(`${logger} Patched image ${args.imageId} with secondary assets (thumbnail: ${!!thumbnail}, preview: ${!!preview})`)
            } else {
                console.warn(`${logger} No secondary assets produced for image ${args.imageId}`)
            }

            console.log(`${logger} Background processing complete for image ${args.imageId}`)
        } catch (error) {
            // Log but NEVER throw — this must not fail the generation
            console.error(`${logger} Background processing failed for image ${args.imageId} (non-fatal):`, error)
        }
    },
})
