/**
 * Secondary Assets — Mutations
 *
 * Database mutations for patching generatedImages records with
 * thumbnail and preview URLs. These run in the default Convex runtime
 * (not Node.js) and are called by the Node.js action in
 * `secondaryAssetsProcessor.ts`.
 */

import { v } from "convex/values"
import { internalMutation } from "./_generated/server"

// ============================================================
// Internal Mutation: Patch Image with Secondary Asset URLs
// ============================================================

/**
 * Patches an existing generatedImages record with thumbnail and/or preview URLs.
 *
 * Only updates the fields that are provided (non-undefined).
 * This is safe to call even if the image record has since been deleted
 * (e.g., user deleted the generation while secondary processing was in flight).
 */
export const updateSecondaryAssets = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
        thumbnailR2Key: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        previewR2Key: v.optional(v.string()),
        previewUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const image = await ctx.db.get(args.imageId)
        if (!image) {
            console.warn(`[SecondaryAssets] Image ${args.imageId} not found (may have been deleted), skipping patch`)
            return
        }

        const updates: Record<string, string> = {}

        if (args.thumbnailR2Key !== undefined) {
            updates.thumbnailR2Key = args.thumbnailR2Key
        }
        if (args.thumbnailUrl !== undefined) {
            updates.thumbnailUrl = args.thumbnailUrl
        }
        if (args.previewR2Key !== undefined) {
            updates.previewR2Key = args.previewR2Key
        }
        if (args.previewUrl !== undefined) {
            updates.previewUrl = args.previewUrl
        }

        if (Object.keys(updates).length > 0) {
            await ctx.db.patch(args.imageId, updates)
        }
    },
})
