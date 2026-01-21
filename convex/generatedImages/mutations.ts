/**
 * Public mutations for generated images.
 */
import { v } from "convex/values"
import { mutation } from "../_generated/server"
import { internal } from "../_generated/api"
import { analyzePromptForNSFW } from "../lib/nsfwDetection"
import { MAX_BULK_OPERATION_SIZE, generationParamsValidator } from "./types"

/**
 * Create a new generated image record.
 */
export const create = mutation({
    args: {
        r2Key: v.string(),
        url: v.string(),
        filename: v.string(),
        contentType: v.string(),
        sizeBytes: v.number(),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        aspectRatio: v.optional(v.number()),
        prompt: v.string(),
        negativePrompt: v.optional(v.string()),
        model: v.string(),
        seed: v.optional(v.number()),
        generationParams: generationParamsValidator,
        visibility: v.optional(v.union(v.literal("public"), v.literal("unlisted"))),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        // Analyze prompt for NSFW content
        const promptAnalysis = analyzePromptForNSFW(args.prompt)
        console.warn(`[Prompt Analysis] Score: ${promptAnalysis.confidence}, Sensitive: ${promptAnalysis.isSensitive}, Terms: ${promptAnalysis.matchedTerms.join(", ")}`)

        const imageId = await ctx.db.insert("generatedImages", {
            ownerId: identity.subject,
            visibility: args.visibility ?? "public",
            r2Key: args.r2Key,
            url: args.url,
            filename: args.filename,
            contentType: args.contentType,
            sizeBytes: args.sizeBytes,
            width: args.width,
            height: args.height,
            aspectRatio: args.width && args.height
                ? Math.max(args.width, args.height) / Math.min(args.width, args.height)
                : undefined,
            prompt: args.prompt,
            negativePrompt: args.negativePrompt,
            model: args.model,
            seed: args.seed,
            createdAt: Date.now(),
            // Initial sensitive content tagging based on prompt
            // Tri-state logic: true=NSFW, false=Safe, null=Pending/Unknown
            // If explicit (>= 0.9), mark Sensitive.
            // If any less, mark Pending (null) to run Phase 3 Prompt Inference.
            isSensitive: promptAnalysis.confidence >= 0.9 ? true : null,

            sensitiveSource: promptAnalysis.confidence >= 0.9 ? "prompt_analysis" : undefined,
            sensitiveConfidence: promptAnalysis.confidence,
        })

        // Store heavy details in side table (P0 Optimization)
        await ctx.db.insert("generatedImageDetails", {
            imageId,
            generationParams: args.generationParams,
        })

        // Schedule async Prompt Inference (Phase 3) if prompt was not explicitly flagged
        // This ensures "Gate 2" runs on everything that isn't already caught by Gate 1.
        if (promptAnalysis.confidence < 0.9) {
            await ctx.scheduler.runAfter(0, internal.promptInference.analyzePromptImage, {
                imageId,
                prompt: args.prompt,
            })
        }

        return imageId
    },
})

/**
 * Update the visibility of a generated image.
 * Only the owner can change visibility.
 */
export const setVisibility = mutation({
    args: {
        imageId: v.id("generatedImages"),
        visibility: v.union(v.literal("public"), v.literal("unlisted")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const image = await ctx.db.get(args.imageId)
        if (!image) {
            throw new Error("Image not found")
        }

        if (image.ownerId !== identity.subject) {
            throw new Error("Not authorized to modify this image")
        }

        await ctx.db.patch(args.imageId, {
            visibility: args.visibility,
        })

        return { success: true }
    },
})

/**
 * Bulk update visibility for multiple images.
 * Only the owner can change visibility of their images.
 * Returns the count of successfully updated images.
 *
 * @param imageIds - Array of image IDs to update (max 100 to avoid Convex limits)
 */
export const setBulkVisibility = mutation({
    args: {
        imageIds: v.array(v.id("generatedImages")),
        visibility: v.union(v.literal("public"), v.literal("unlisted")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        // Input validation: enforce upper bound to avoid hitting Convex limits
        if (args.imageIds.length > MAX_BULK_OPERATION_SIZE) {
            throw new Error(
                `Too many items: maximum ${MAX_BULK_OPERATION_SIZE} images can be updated at once, received ${args.imageIds.length}`
            )
        }

        if (args.imageIds.length === 0) {
            return {
                success: true,
                successCount: 0,
                totalRequested: 0,
                errors: undefined,
            }
        }

        let successCount = 0
        const errors: string[] = []


        await Promise.all(
            args.imageIds.map(async (imageId) => {
                try {
                    const image = await ctx.db.get(imageId)
                    if (!image) {
                        errors.push(`Image ${imageId} not found`)
                        return
                    }

                    if (image.ownerId !== identity.subject) {
                        errors.push(`Not authorized to modify image ${imageId}`)
                        return
                    }

                    await ctx.db.patch(imageId, {
                        visibility: args.visibility,
                    })
                    successCount++
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error"
                    errors.push(`Failed to update image ${imageId}: ${errorMessage}`)
                }
            })
        )

        return {
            success: successCount > 0,
            successCount,
            totalRequested: args.imageIds.length,
            errors: errors.length > 0 ? errors : undefined,
        }
    },
})

/**
 * Delete a generated image record.
 * Only the owner can delete their images.
 * Returns the r2Key and thumbnailR2Key so the caller can also delete from R2.
 */
export const remove = mutation({
    args: {
        imageId: v.id("generatedImages"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const image = await ctx.db.get(args.imageId)
        if (!image) {
            throw new Error("Image not found")
        }

        if (image.ownerId !== identity.subject) {
            throw new Error("Not authorized to delete this image")
        }

        const r2Key = image.r2Key
        const thumbnailR2Key = image.thumbnailR2Key

        await ctx.db.delete(args.imageId)

        return { r2Key, thumbnailR2Key }
    },
})

/**
 * Bulk delete multiple generated image records.
 * Only the owner can delete their images.
 * Returns all r2Keys and thumbnailR2Keys so the caller can delete them from R2.
 *
 * @param imageIds - Array of image IDs to delete (max 100 to avoid Convex limits)
 */
export const removeMany = mutation({
    args: {
        imageIds: v.array(v.id("generatedImages")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        // Input validation: enforce upper bound to avoid hitting Convex limits
        if (args.imageIds.length > MAX_BULK_OPERATION_SIZE) {
            throw new Error(
                `Too many items: maximum ${MAX_BULK_OPERATION_SIZE} images can be deleted at once, received ${args.imageIds.length}`
            )
        }

        if (args.imageIds.length === 0) {
            return {
                success: true,
                successCount: 0,
                totalRequested: 0,
                r2Keys: [],
                thumbnailR2Keys: [],
                errors: undefined,
            }
        }

        const r2Keys: string[] = []
        const thumbnailR2Keys: string[] = []
        const errors: string[] = []
        let successCount = 0

        await Promise.all(
            args.imageIds.map(async (imageId) => {
                try {
                    const image = await ctx.db.get(imageId)
                    if (!image) {
                        errors.push(`Image ${imageId} not found`)
                        return
                    }

                    if (image.ownerId !== identity.subject) {
                        errors.push(`Not authorized to delete image ${imageId}`)
                        return
                    }

                    // Collect R2 keys for deletion
                    if (image.r2Key) {
                        r2Keys.push(image.r2Key)
                    }
                    if (image.thumbnailR2Key) {
                        thumbnailR2Keys.push(image.thumbnailR2Key)
                    }

                    await ctx.db.delete(imageId)
                    successCount++
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error"
                    errors.push(`Failed to delete image ${imageId}: ${errorMessage}`)
                }
            })
        )

        return {
            success: successCount > 0,
            successCount,
            totalRequested: args.imageIds.length,
            r2Keys,
            thumbnailR2Keys,
            errors: errors.length > 0 ? errors : undefined,
        }
    },
})
