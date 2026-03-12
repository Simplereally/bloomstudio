/**
 * Orphan Cleanup Queries
 * 
 * Internal queries for the orphan cleanup system.
 * Provides data access patterns for R2 key lookups.
 */

import { internalQuery } from "./_generated/server"

/**
 * Get all R2 keys referenced in the database.
 * 
 * Collects main, thumbnail, and preview keys from generatedImages plus
 * reference-image keys from referenceImages.
 * Used by the orphan cleanup action to identify which R2 objects
 * have matching Convex records.
 * 
 * Note: This scans the entire tables. For very large datasets (100k+ images),
 * consider implementing pagination or batch processing.
 */
export const getAllR2Keys = internalQuery({
    args: {},
    handler: async (ctx): Promise<string[]> => {
        const keys: string[] = []

        // Get all generated images
        const generatedImages = await ctx.db.query("generatedImages").collect()
        for (const img of generatedImages) {
            if (img.r2Key) {
                keys.push(img.r2Key)
            }
            if (img.thumbnailR2Key) {
                keys.push(img.thumbnailR2Key)
            }
            if (img.previewR2Key) {
                keys.push(img.previewR2Key)
            }
        }

        // Get all reference images
        const referenceImages = await ctx.db.query("referenceImages").collect()
        for (const img of referenceImages) {
            if (img.r2Key) {
                keys.push(img.r2Key)
            }
        }

        console.log(`[OrphanCleanup] Query returned ${keys.length} R2 keys from ${generatedImages.length} generated + ${referenceImages.length} reference images`)

        return keys
    },
})

