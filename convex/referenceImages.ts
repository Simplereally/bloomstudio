/**
 * Convex Reference Images Functions
 *
 * Queries and mutations for managing user-uploaded reference images.
 * Reference images are always private (unlisted) and belong only to their owner.
 */
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { paginationOptsValidator } from "convex/server"

/**
 * Create a new reference image record.
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
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const imageId = await ctx.db.insert("referenceImages", {
            ownerId: identity.subject,
            r2Key: args.r2Key,
            url: args.url,
            filename: args.filename,
            contentType: args.contentType,
            sizeBytes: args.sizeBytes,
            width: args.width,
            height: args.height,
            createdAt: Date.now(),
        })

        return imageId
    },
})

/**
 * Get a single reference image by ID.
 * Only the owner can access their reference images.
 */
export const getById = query({
    args: {
        imageId: v.id("referenceImages"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return null
        }

        const image = await ctx.db.get(args.imageId)
        if (!image) {
            return null
        }

        // Reference images are always private - owner only
        if (image.ownerId !== identity.subject) {
            return null
        }

        return image
    },
})

/**
 * Get the current user's reference images (paginated).
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
            .query("referenceImages")
            .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
            .order("desc")
            .paginate(args.paginationOpts)
    },
})

/**
 * Delete a reference image record.
 * Only the owner can delete their images.
 * Returns the r2Key so the caller can also delete from R2.
 */
export const remove = mutation({
    args: {
        imageId: v.id("referenceImages"),
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
 * Get a reference image by its R2 key.
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
            .query("referenceImages")
            .withIndex("by_r2_key", (q) => q.eq("r2Key", args.r2Key))
            .unique()

        // Reference images are private - only return if owned by user
        if (!image || image.ownerId !== identity.subject) {
            return null
        }

        return image
    },
})

/**
 * Get the current user's most recent reference images (non-paginated).
 * Limited to 50 items.
 */
export const getRecent = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return []
        }

        return await ctx.db
            .query("referenceImages")
            .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
            .order("desc")
            .take(50)
    },
})
