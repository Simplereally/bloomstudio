/**
 * Thumbnail Migration Queries and Mutations
 * 
 * These run in the V8 runtime for database operations.
 * See thumbnailMigrationActions.ts for the Node.js actions.
 */

import { v } from "convex/values"
import { internalMutation, internalQuery, mutation, query } from "./_generated/server"

/** Batch size for migration (balance between throughput and memory) */
export const MIGRATION_BATCH_SIZE = 10

// ============================================================
// Queries
// ============================================================

/**
 * Get a batch of images that need thumbnail generation.
 */
export const getImagesNeedingThumbnails = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? MIGRATION_BATCH_SIZE

        // Find images without thumbnailUrl
        const images = await ctx.db
            .query("generatedImages")
            .filter((q) => q.eq(q.field("thumbnailUrl"), undefined))
            .take(limit)

        return images
    },
})

/**
 * Get a page of images (for full re-generation)
 */
export const getAllImagesBatch = query({
    args: {
        paginationOpts: v.any(), // paginatedQuery options
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("generatedImages")
            .order("desc") // Process newest first
            .paginate(args.paginationOpts)
    },
})

/**
 * Public debug query to see what's left.
 */
export const debugGetImagesNeedingThumbnails = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 10
        return await ctx.db
            .query("generatedImages")
            .filter((q) => q.eq(q.field("thumbnailUrl"), undefined))
            .take(limit)
    },
})


/**
 * Get migration statistics.
 */
export const getMigrationStats = query({
    args: {},
    handler: async (ctx) => {
        // This is O(n) but acceptable for one-time migration status checks
        const allImages = await ctx.db.query("generatedImages").collect()

        const total = allImages.length
        const withThumbnails = allImages.filter(img => img.thumbnailUrl).length
        const needingThumbnails = total - withThumbnails

        return {
            total,
            withThumbnails,
            needingThumbnails,
            percentComplete: total > 0 ? Math.round((withThumbnails / total) * 100) : 100,
        }
    },
})

// ============================================================
// Mutations
// ============================================================

/**
 * Update an image with its thumbnail URLs.
 */
export const updateImageThumbnail = mutation({
    args: {
        imageId: v.id("generatedImages"),
        thumbnailR2Key: v.string(),
        thumbnailUrl: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.imageId, {
            thumbnailR2Key: args.thumbnailR2Key,
            thumbnailUrl: args.thumbnailUrl,
        })
    },
})

/**
 * Get statistics specifically for video thumbnails.
 */
export const getVideoThumbnailStats = query({
    args: {},
    handler: async (ctx) => {
        const videos = await ctx.db
            .query("generatedImages")
            .filter((q) =>
                // Check if contentType starts with "video/"
                // Note: Convex filters on string prefixes are capable via partial comparison or by collecting
                // But generally "contentType" is a field. We can't use regex in filter.
                // We'll collect and filter in JS for this stat check as it's a one-off.
                q.neq(q.field("contentType"), undefined)
            )
            .collect();

        const actualVideos = videos.filter(v => v.contentType.startsWith("video/"));

        const totalVideos = actualVideos.length;
        const withThumbnails = actualVideos.filter(v => v.thumbnailUrl).length;
        const missingThumbnails = totalVideos - withThumbnails;

        return {
            totalVideos,
            withThumbnails,
            missingThumbnails,
            percentComplete: totalVideos > 0 ? (withThumbnails / totalVideos) * 100 : 100
        };
    },
});
