/**
 * Convex Favorites Functions
 *
 * Queries and mutations for managing user's favorited images.
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
 * Toggle favorite status for an image.
 * If already favorited, removes the favorite. Otherwise, adds it.
 */
export const toggle = mutation({
    args: {
        imageId: v.id("generatedImages"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new Error("Not authenticated")
        }

        const userId = identity.subject

        // Check if already favorited
        const existing = await ctx.db
            .query("favorites")
            .withIndex("by_user_image", (q) =>
                q.eq("userId", userId).eq("imageId", args.imageId)
            )
            .unique()

        if (existing) {
            // Remove favorite
            await ctx.db.delete(existing._id)
            return { favorited: false }
        } else {
            // Add favorite
            await ctx.db.insert("favorites", {
                userId,
                imageId: args.imageId,
                createdAt: Date.now(),
            })
            return { favorited: true }
        }
    },
})

/**
 * Check if the current user has favorited a specific image.
 */
export const isFavorited = query({
    args: {
        imageId: v.id("generatedImages"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            return false
        }

        const existing = await ctx.db
            .query("favorites")
            .withIndex("by_user_image", (q) =>
                q.eq("userId", identity.subject).eq("imageId", args.imageId)
            )
            .unique()

        return !!existing
    },
})

/**
 * Get the current user's favorited images (paginated).
 * Returns images in reverse chronological order of when they were favorited.
 */
export const list = query({
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

        // Get favorited image IDs with pagination
        const favoritesResult = await ctx.db
            .query("favorites")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .order("desc")
            .paginate(args.paginationOpts)

        // Fetch the actual images
        const images = await Promise.all(
            favoritesResult.page.map((fav) => ctx.db.get(fav.imageId))
        )

        // Filter out null (deleted images) and enrich
        const validImages = images.filter(
            (img): img is Doc<"generatedImages"> => img !== null
        )
        const enrichedImages = await enrichImages(ctx, validImages)

        return {
            ...favoritesResult,
            page: enrichedImages,
        }
    },
})

/**
 * Batch check if current user has favorited multiple images.
 * Useful for efficiently checking favorite status in feeds.
 */
export const batchIsFavorited = query({
    args: {
        imageIds: v.array(v.id("generatedImages")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            // Return empty map if not authenticated
            return {}
        }

        const userId = identity.subject
        const result: Record<string, boolean> = {}

        // Check each image
        await Promise.all(
            args.imageIds.map(async (imageId) => {
                const existing = await ctx.db
                    .query("favorites")
                    .withIndex("by_user_image", (q) =>
                        q.eq("userId", userId).eq("imageId", imageId)
                    )
                    .unique()
                result[imageId] = !!existing
            })
        )

        return result
    },
})
