/**
 * Convex Generated Images Functions
 *
 * Queries and mutations for managing AI-generated images.
 */
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import type { Doc } from "./_generated/dataModel"
import { mutation, query, type QueryCtx } from "./_generated/server"

/** Image with enriched owner display information */
type EnrichedImage = Doc<"generatedImages"> & {
    ownerName: string
    ownerPictureUrl: string | null
}

/**
 * Helper to batch-enrich images with owner display info.
 * Collects unique owner IDs and performs batch lookups to avoid N+1 queries.
 */
async function enrichImages(
    ctx: QueryCtx,
    images: Doc<"generatedImages">[]
): Promise<EnrichedImage[]> {
    if (images.length === 0) return []

    // Collect unique owner IDs
    const ownerIds = [...new Set(images.map((img) => img.ownerId))]

    // Batch fetch all owners
    const owners = await Promise.all(
        ownerIds.map((id: string) =>
            ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", id))
                .unique()
        )
    )
    const ownerMap = new Map<string, Doc<"users">>(
        owners.filter((o): o is Doc<"users"> => o !== null).map((o) => [o.clerkId, o])
    )

    return images.map((image) => {
        const owner = ownerMap.get(image.ownerId)
        return {
            ...image,
            ownerName: owner?.username ?? "Anonymous",
            ownerPictureUrl: owner?.pictureUrl ?? null,
        }
    })
}

/**
 * Filter images with extreme aspect ratios (> 4:1 or 1:4).
 */
function filterExtremeAspectRatios(
    images: Doc<"generatedImages">[]
): Doc<"generatedImages">[] {
    return images.filter((img) => !img.aspectRatio || img.aspectRatio <= 4)
}

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
        generationParams: v.any(),
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
            aspectRatio: args.width && args.height
                ? Math.max(args.width, args.height) / Math.min(args.width, args.height)
                : undefined,
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

/** Lightweight thumbnail data for gallery display (excludes heavy fields like generationParams) */
type ThumbnailImage = {
    _id: Doc<"generatedImages">["_id"]
    _creationTime: number
    /** URL to display - uses thumbnailUrl if available, otherwise falls back to original */
    url: string
    /** Original full-size URL (for lightbox/download) */
    originalUrl: string
    visibility: "public" | "unlisted"
    createdAt: number
    // Include model for filtering badge display (small field)
    model: string
    // Include contentType for video detection
    contentType: string
}

/**
 * Helper to map full documents to lightweight thumbnail format.
 * Reduces bandwidth by ~90% by excluding generationParams, prompt, and other unused fields.
 * Uses thumbnailUrl when available (~98% additional bandwidth reduction for gallery).
 */
function toThumbnails(images: Doc<"generatedImages">[]): ThumbnailImage[] {
    return images.map(img => ({
        _id: img._id,
        _creationTime: img._creationTime,
        // Prefer thumbnail for gallery display, fall back to original for legacy images
        url: img.thumbnailUrl ?? img.url,
        // Always include original URL for when user opens lightbox
        originalUrl: img.url,
        visibility: img.visibility,
        createdAt: img.createdAt,
        model: img.model,
        contentType: img.contentType,
    }))
}

/**
 * Get the current user's generated images for gallery display (paginated).
 * Returns LIGHTWEIGHT thumbnail data only - excludes generationParams and other heavy fields.
 * Use getById for full image details when user clicks on an image.
 * 
 * Supports optional filtering by visibility and models.
 * 
 * Note: When filters are applied, individual pages may contain fewer items
 * than requested if matching documents are sparse. Clients should continue
 * loading until isDone is true.
 */
export const getMyImages = query({
    args: {
        paginationOpts: paginationOptsValidator,
        /** Filter by visibility (undefined = all, "unlisted" = private only, "public" = public only) */
        visibility: v.optional(v.union(v.literal("public"), v.literal("unlisted"))),
        /** Filter by specific models (undefined or empty = all models) */
        models: v.optional(v.array(v.string())),
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

        const hasVisibilityFilter = !!args.visibility
        const hasModelFilter = args.models && args.models.length > 0
        const modelsSet = hasModelFilter ? new Set(args.models) : null

        // Strategy: Use the most selective index available
        // Then apply any remaining filters with .filter()

        let paginatedResult

        // Case 1: No filters - use basic owner index
        if (!hasVisibilityFilter && !hasModelFilter) {
            paginatedResult = await ctx.db
                .query("generatedImages")
                .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
                .order("desc")
                .paginate(args.paginationOpts)
        }
        // Case 2: Single model filter - use by_owner_model for direct index lookup
        else if (!hasVisibilityFilter && hasModelFilter && modelsSet!.size === 1) {
            const singleModel = [...modelsSet!][0]
            paginatedResult = await ctx.db
                .query("generatedImages")
                .withIndex("by_owner_model", (q) =>
                    q.eq("ownerId", identity.subject).eq("model", singleModel)
                )
                .order("desc")
                .paginate(args.paginationOpts)
        }
        // Case 3: Visibility filter only - use by_owner_visibility
        else if (hasVisibilityFilter && !hasModelFilter) {
            paginatedResult = await ctx.db
                .query("generatedImages")
                .withIndex("by_owner_visibility", (q) =>
                    q.eq("ownerId", identity.subject).eq("visibility", args.visibility!)
                )
                .order("desc")
                .paginate(args.paginationOpts)
        }
        // Case 4: Visibility + single model - use NEW direct index
        else if (hasVisibilityFilter && hasModelFilter && modelsSet!.size === 1) {
            const singleModel = [...modelsSet!][0]
            paginatedResult = await ctx.db
                .query("generatedImages")
                .withIndex("by_owner_visibility_model", (q) =>
                    q.eq("ownerId", identity.subject)
                        .eq("visibility", args.visibility!)
                        .eq("model", singleModel)
                )
                .order("desc")
                .paginate(args.paginationOpts)
        }
        // Case 5: Multiple models (with or without visibility)
        else {
            const baseQuery = hasVisibilityFilter
                ? ctx.db.query("generatedImages")
                    .withIndex("by_owner_visibility", (q) =>
                        q.eq("ownerId", identity.subject).eq("visibility", args.visibility!)
                    )
                : ctx.db.query("generatedImages")
                    .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))

            const modelArray = [...modelsSet!]
            paginatedResult = await baseQuery
                .filter((q) => {
                    const modelConditions = modelArray.map(model =>
                        q.eq(q.field("model"), model)
                    )
                    return modelConditions.length === 1
                        ? modelConditions[0]
                        : q.or(...modelConditions)
                })
                .order("desc")
                .paginate(args.paginationOpts)
        }

        // Return lightweight thumbnail data only
        return {
            ...paginatedResult,
            page: toThumbnails(paginatedResult.page),
        }
    },
})

/** Display-ready image data for history page (includes display fields, excludes generationParams) */
type DisplayImage = {
    _id: Doc<"generatedImages">["_id"]
    _creationTime: number
    url: string
    visibility: "public" | "unlisted"
    createdAt: number
    model: string
    prompt: string
    width: number | undefined
    height: number | undefined
    seed: number | undefined
    contentType: string
}

/**
 * Helper to map full documents to display-ready format.
 * Includes fields needed for ImageCard display but excludes heavy generationParams.
 */
function toDisplayImages(images: Doc<"generatedImages">[]): DisplayImage[] {
    return images.map(img => ({
        _id: img._id,
        _creationTime: img._creationTime,
        url: img.url,
        visibility: img.visibility,
        createdAt: img.createdAt,
        model: img.model,
        prompt: img.prompt,
        width: img.width,
        height: img.height,
        seed: img.seed,
        contentType: img.contentType,
    }))
}

/**
 * Get the current user's generated images with display data (paginated).
 * Returns fields needed for ImageCard display (prompt, dimensions, seed) but excludes
 * heavy generationParams field. Use this for the dedicated history page.
 * 
 * For lightweight gallery sidebar, use getMyImages instead.
 */
export const getMyImagesWithDisplayData = query({
    args: {
        paginationOpts: paginationOptsValidator,
        visibility: v.optional(v.union(v.literal("public"), v.literal("unlisted"))),
        models: v.optional(v.array(v.string())),
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

        const hasVisibilityFilter = !!args.visibility
        const hasModelFilter = args.models && args.models.length > 0
        const modelsSet = hasModelFilter ? new Set(args.models) : null

        let paginatedResult

        if (!hasVisibilityFilter && !hasModelFilter) {
            paginatedResult = await ctx.db
                .query("generatedImages")
                .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
                .order("desc")
                .paginate(args.paginationOpts)
        }
        else if (!hasVisibilityFilter && hasModelFilter && modelsSet!.size === 1) {
            const singleModel = [...modelsSet!][0]
            paginatedResult = await ctx.db
                .query("generatedImages")
                .withIndex("by_owner_model", (q) =>
                    q.eq("ownerId", identity.subject).eq("model", singleModel)
                )
                .order("desc")
                .paginate(args.paginationOpts)
        }
        else if (hasVisibilityFilter && !hasModelFilter) {
            paginatedResult = await ctx.db
                .query("generatedImages")
                .withIndex("by_owner_visibility", (q) =>
                    q.eq("ownerId", identity.subject).eq("visibility", args.visibility!)
                )
                .order("desc")
                .paginate(args.paginationOpts)
        }
        else if (hasVisibilityFilter && hasModelFilter && modelsSet!.size === 1) {
            const singleModel = [...modelsSet!][0]
            paginatedResult = await ctx.db
                .query("generatedImages")
                .withIndex("by_owner_visibility_model", (q) =>
                    q.eq("ownerId", identity.subject)
                        .eq("visibility", args.visibility!)
                        .eq("model", singleModel)
                )
                .order("desc")
                .paginate(args.paginationOpts)
        }
        else {
            const baseQuery = hasVisibilityFilter
                ? ctx.db.query("generatedImages")
                    .withIndex("by_owner_visibility", (q) =>
                        q.eq("ownerId", identity.subject).eq("visibility", args.visibility!)
                    )
                : ctx.db.query("generatedImages")
                    .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))

            const modelArray = [...modelsSet!]
            paginatedResult = await baseQuery
                .filter((q) => {
                    const modelConditions = modelArray.map(model =>
                        q.eq(q.field("model"), model)
                    )
                    return modelConditions.length === 1
                        ? modelConditions[0]
                        : q.or(...modelConditions)
                })
                .order("desc")
                .paginate(args.paginationOpts)
        }

        // Return display-ready data (excludes generationParams)
        return {
            ...paginatedResult,
            page: toDisplayImages(paginatedResult.page),
        }
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
            .filter((q) =>
                // Filter extreme aspect ratios: missing or <= 4
                // In Convex filter, if a field is missing, comparisons return false/undefined.
                // We use q.not(q.gt(...)) to include missing fields + values <= 4.
                q.not(q.gt(q.field("aspectRatio"), 4))
            )
            .order("desc")
            .paginate(args.paginationOpts)

        // All filtering is now server-side. Simply enrich the remaining images.
        const enrichedPage = await enrichImages(ctx, paginatedResult.page)

        return {
            ...paginatedResult,
            page: enrichedPage,
        }
    },
})

/**
 * Get public images for a specific user (by username).
 */
export const getImagesByUsername = query({
    args: {
        username: v.string(),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        // First find the user
        const user = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .unique()

        if (!user) {
            return {
                page: [],
                isDone: true,
                continueCursor: "",
            }
        }

        const paginatedResult = await ctx.db
            .query("generatedImages")
            .withIndex("by_owner_visibility", (q) =>
                q.eq("ownerId", user.clerkId).eq("visibility", "public")
            )
            .filter((q) => q.not(q.gt(q.field("aspectRatio"), 4)))
            .order("desc")
            .paginate(args.paginationOpts)

        // Enrich with user info (we already have the user)
        const enrichedPage = paginatedResult.page.map((image) => ({
            ...image,
            ownerName: user.username ?? "Anonymous",
            ownerPictureUrl: user.pictureUrl ?? null,
        }))

        return {
            ...paginatedResult,
            page: enrichedPage,
        }
    },
})

/**
 * Get feed of images from users the current user follows.
 * Uses single-pass over-fetch + filter strategy (Convex only allows one paginate call per query).
 */
export const getFollowingFeed = query({
    args: {
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return { page: [], isDone: true, continueCursor: "" }
        }

        // Get list of followed user IDs
        const follows = await ctx.db
            .query("follows")
            .withIndex("by_follower", (q) => q.eq("followerId", identity.subject))
            .collect()
        const followedIds = follows.map((f) => f.followeeId)

        if (followedIds.length === 0) {
            return { page: [], isDone: true, continueCursor: "" }
        }

        // Use server-side filtering for ownerId and aspectRatio.
        // We scan the public feed and only return images from users we follow.
        // Pages may be sparse if matches are infrequent in the public stream.
        const paginatedResult = await ctx.db
            .query("generatedImages")
            .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
            .filter((q) => {
                // Owner filter: ownerId must be in followedIds
                const ownerConditions = followedIds.map(id => q.eq(q.field("ownerId"), id))
                const ownerFilter = ownerConditions.length === 1
                    ? ownerConditions[0]
                    : q.or(...ownerConditions)

                // Aspect ratio filter: not extreme
                const aspectRatioFilter = q.not(q.gt(q.field("aspectRatio"), 4))

                return q.and(ownerFilter, aspectRatioFilter)
            })
            .order("desc")
            .paginate(args.paginationOpts)

        const enrichedPage = await enrichImages(ctx, paginatedResult.page)

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
 * Bulk update visibility for multiple images.
 * Only the owner can change visibility of their images.
 * Returns the count of successfully updated images.
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
 * Bulk delete multiple generated image records.
 * Only the owner can delete their images.
 * Returns all r2Keys so the caller can delete them from R2.
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

        const r2Keys: string[] = []
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

                    if (image.r2Key) {
                        r2Keys.push(image.r2Key)
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
            errors: errors.length > 0 ? errors : undefined,
        }
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
