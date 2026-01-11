"use node"

/**
 * Thumbnail Migration Actions (Node.js Runtime)
 * 
 * OPTIMIZED: All processing happens inline within a single action.
 * No nested action calls - maximum parallelism with Promise.all.
 * 
 * Usage:
 * Run `npx convex run thumbnailMigrationActions:migrateAllImages` for full migration
 */

import { v } from "convex/values"
import { action } from "./_generated/server"
import { api, internal } from "./_generated/api"
import { generateAndUploadThumbnail, generateThumbnailKey } from "./lib/r2"
import type { Id } from "./_generated/dataModel"

// ============================================================
// Configuration
// ============================================================

/** 
 * Process 100 images per batch, all in parallel.
 * Larger = faster but more memory. 100 is a good balance.
 */
const BATCH_SIZE = 100

// ============================================================
// Types
// ============================================================

type ImageToProcess = {
    _id: Id<"generatedImages">
    r2Key: string
    url: string
    contentType: string
}

type ProcessResult = {
    imageId: Id<"generatedImages">
    success: boolean
    thumbnailUrl?: string
    error?: string
}

// ============================================================
// Inline Processing Helper (no action overhead)
// ============================================================

/**
 * Process a single media item inline - no separate action call.
 * Works for both images and videos.
 */
async function processImageInline(image: ImageToProcess): Promise<ProcessResult> {
    try {
        // Fetch the original media from R2
        const response = await fetch(image.url)
        if (!response.ok) {
            return {
                imageId: image._id,
                success: false,
                error: `Fetch failed: ${response.status}`
            }
        }

        const mediaBuffer = Buffer.from(await response.arrayBuffer())

        // Generate and upload thumbnail
        const thumbnailResult = await generateAndUploadThumbnail(
            mediaBuffer,
            image.r2Key,
            image.contentType
        )

        if (!thumbnailResult) {
            return {
                imageId: image._id,
                success: false,
                error: "Thumbnail generation failed"
            }
        }

        return {
            imageId: image._id,
            success: true,
            thumbnailUrl: thumbnailResult.url
        }
    } catch (error) {
        return {
            imageId: image._id,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        }
    }
}

// ============================================================
// Main Migration Action
// ============================================================

/**
 * Migrate all images that need thumbnails.
 * 
 * OPTIMIZED: 
 * - Processes BATCH_SIZE images in parallel per batch
 * - All processing is inline (no nested action calls)
 * - DB updates happen in parallel too
 */
export const migrateAllImages = action({
    args: {},
    handler: async (ctx) => {
        const logger = "[ThumbnailMigration]"

        // Get initial stats
        const initialStats = await ctx.runQuery(
            api.thumbnailMigration.getMigrationStats,
            {}
        )

        console.log(`${logger} Starting migration: ${initialStats.needingThumbnails} images need thumbnails`)

        let totalProcessed = 0
        let totalSuccess = 0
        let totalFailed = 0

        // Process in batches until done
        while (true) {
            // Get next batch of images
            const images = await ctx.runQuery(
                api.thumbnailMigration.getImagesNeedingThumbnails,
                { limit: BATCH_SIZE }
            ) as ImageToProcess[]

            if (images.length === 0) {
                console.log(`${logger} No more images - migration complete!`)
                break
            }

            console.log(`${logger} Processing batch of ${images.length} images...`)

            // Process ALL images in parallel - no action overhead!
            const results = await Promise.all(
                images.map(image => processImageInline(image))
            )

            // Build Map of images by ID for safe lookup
            const imagesMap = new Map(images.map(i => [i._id, i]));

            // Update DB for successful thumbnails - also in parallel!
            const dbUpdates = results
                .filter(r => r.success && r.thumbnailUrl)
                .map(r => {
                    const image = imagesMap.get(r.imageId);
                    if (image) {
                        return ctx.runMutation(api.thumbnailMigration.updateImageThumbnail, {
                            imageId: r.imageId,
                            thumbnailR2Key: generateThumbnailKey(image.r2Key),
                            thumbnailUrl: r.thumbnailUrl!,
                        });
                    }
                    console.warn(`[ThumbnailMigration] Image ${r.imageId} not found in batch, skipping update.`);
                    return null;
                })
                .filter(update => update !== null);

            await Promise.all(dbUpdates)

            const batchSuccess = results.filter(r => r.success).length
            const batchFailed = results.filter(r => !r.success).length

            totalProcessed += images.length
            totalSuccess += batchSuccess
            totalFailed += batchFailed

            console.log(`${logger} Batch: ${batchSuccess} success, ${batchFailed} failed | Total: ${totalProcessed}/${initialStats.total}`)
        }

        console.log(`${logger} Migration complete: ${totalSuccess} success, ${totalFailed} failed out of ${totalProcessed} processed`)

        return {
            totalProcessed,
            totalSuccess,
            totalFailed,
        }
    },
})
