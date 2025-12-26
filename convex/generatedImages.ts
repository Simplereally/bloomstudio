/**
 * Convex Generated Images Functions
 *
 * Queries and mutations for managing AI-generated images.
 */
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

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
        prompt: v.string(),
        negativePrompt: v.optional(v.string()),
        model: v.string(),
        seed: v.optional(v.number()),
        generationParams: v.optional(v.any()),
        visibility: v.optional(v.union(v.literal("public"), v.literal("unlisted"))),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

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
            prompt: args.prompt,
            negativePrompt: args.negativePrompt,
            model: args.model,
            seed: args.seed,
            generationParams: args.generationParams,
            createdAt: Date.now(),
        })

        return imageId
    },
})

/**
 * Get a single generated image by ID.
 * Returns null if not found or if the user doesn't have access.
 */
export const getById = query({
    args: {
        imageId: v.id("generatedImages"),
    },
    handler: async (ctx, args) => {
        const image = await ctx.db.get(args.imageId)
        if (!image) {
            return null
        }

        // Public images are accessible to everyone
        if (image.visibility === "public") {
            return image
        }

        // Unlisted images require authentication and ownership
        const identity = await ctx.auth.getUserIdentity()
        if (!identity || identity.subject !== image.ownerId) {
            return null
        }

        return image
    },
})

/**
 * Get the current user's generated images (paginated).
 */
export const getMyImages = query({
    args: {
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return {
                page: [],
                isDone: true,
                continueCursor: "",
            }
        }

        return await ctx.db
            .query("generatedImages")
            .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
            .order("desc")
            .paginate(args.paginationOpts)
    },
})

/**
 * Get public images for the feed (paginated).
 * Includes owner information for display in community feed.
 */
export const getPublicFeed = query({
    args: {
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const paginatedResult = await ctx.db
            .query("generatedImages")
            .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
            .order("desc")
            .paginate(args.paginationOpts)

        // Enrich each image with owner info
        const enrichedPage = await Promise.all(
            paginatedResult.page.map(async (image) => {
                const owner = await ctx.db
                    .query("users")
                    .withIndex("by_clerk_id", (q) => q.eq("clerkId", image.ownerId))
                    .unique()

                return {
                    ...image,
                    ownerName: owner?.name ?? "Anonymous",
                    ownerPictureUrl: owner?.pictureUrl ?? null,
                }
            })
        )

        return {
            ...paginatedResult,
            page: enrichedPage,
        }
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
 * Delete a generated image record.
 * Only the owner can delete their images.
 * Returns the r2Key so the caller can also delete from R2.
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

        await ctx.db.delete(args.imageId)

        return { r2Key }
    },
})

/**
 * Get an image by its R2 key.
 * Used for deduplication checks.
 */
export const getByR2Key = query({
    args: {
        r2Key: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return null
        }

        const image = await ctx.db
            .query("generatedImages")
            .withIndex("by_r2_key", (q) => q.eq("r2Key", args.r2Key))
            .unique()

        // Only return if the user owns this image or it's public
        if (!image) {
            return null
        }

        if (image.visibility === "public" || image.ownerId === identity.subject) {
            return image
        }

        return null
    },
})
