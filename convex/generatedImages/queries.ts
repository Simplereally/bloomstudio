/**
 * Public queries for generated images.
 */
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { query } from "../_generated/server"
import type { EnrichedImage } from "./types"
import {
    enrichImages,
    toPublicFeedImages,
    toThumbnails,
    toDisplayImages,
    getMyImagesQueryStrategy,
    getDisplayDataQueryStrategy,
    executeMyImagesQuery,
} from "./helpers"

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

        const strategy = getMyImagesQueryStrategy(args.visibility, args.models)
        const ownerId = identity.subject
        const paginatedResult = await executeMyImagesQuery(ctx, ownerId, strategy, args.paginationOpts)

        // Return lightweight thumbnail data only
        return {
            ...paginatedResult,
            page: toThumbnails(paginatedResult.page),
        }
    },
})

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

        const strategy = getDisplayDataQueryStrategy(args.visibility, args.models)
        let paginatedResult

        switch (strategy.type) {
            case "no_filters":
                paginatedResult = await ctx.db
                    .query("generatedImages")
                    .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
                    .order("desc")
                    .paginate(args.paginationOpts)
                break

            case "single_model_only":
                paginatedResult = await ctx.db
                    .query("generatedImages")
                    .withIndex("by_owner_model", (q) =>
                        q.eq("ownerId", identity.subject).eq("model", strategy.model)
                    )
                    .order("desc")
                    .paginate(args.paginationOpts)
                break

            case "visibility_only":
                paginatedResult = await ctx.db
                    .query("generatedImages")
                    .withIndex("by_owner_visibility", (q) =>
                        q.eq("ownerId", identity.subject).eq("visibility", strategy.visibility)
                    )
                    .order("desc")
                    .paginate(args.paginationOpts)
                break

            case "visibility_single_model":
                paginatedResult = await ctx.db
                    .query("generatedImages")
                    .withIndex("by_owner_visibility_model", (q) =>
                        q.eq("ownerId", identity.subject)
                            .eq("visibility", strategy.visibility)
                            .eq("model", strategy.model)
                    )
                    .order("desc")
                    .paginate(args.paginationOpts)
                break

            case "multi_model_filter": {
                const visibilityValue = strategy.visibility
                const baseQuery = visibilityValue === null
                    ? ctx.db.query("generatedImages")
                        .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
                    : ctx.db.query("generatedImages")
                        .withIndex("by_owner_visibility", (q) =>
                            q.eq("ownerId", identity.subject).eq("visibility", visibilityValue)
                        )

                const modelArray = strategy.models
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
                break
            }
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
 * Returns OPTIMIZED data for public feed display:
 * - Uses thumbnailUrl for bandwidth optimization
 * - Includes only essential fields (no generationParams)
 * - Includes owner info for community feed display
 */
export const getPublicFeed = query({
    args: {
        paginationOpts: paginationOptsValidator,
        /** User's content filter preference */
        filterPreference: v.optional(v.union(v.literal("block"), v.literal("blur"), v.literal("allow"))),
    },
    handler: async (ctx, args) => {
        const { filterPreference = "blur" } = args;

        let paginatedResult;

        // CASE 1: BLOCK - Show ONLY safe content (isSensitive=false)
        if (filterPreference === "block") {
            paginatedResult = await ctx.db
                .query("generatedImages")
                .withIndex("by_visibility_sensitive", (q) =>
                    q.eq("visibility", "public").eq("isSensitive", false)
                )
                .filter((q) =>
                    // Filter extreme aspect ratios
                    q.not(q.gt(q.field("aspectRatio"), 4))
                )
                .order("desc")
                .paginate(args.paginationOpts);

        }
        // CASE 2 & 3: BLUR / ALLOW - Show ALL tagged content (safe OR sensitive)
        // We filter out 'null' (pending)
        else {
            paginatedResult = await ctx.db
                .query("generatedImages")
                // Use the main index and filter
                .withIndex("by_visibility", (q) =>
                    q.eq("visibility", "public")
                )
                .filter((q) =>
                    q.and(
                        // Not extreme aspect ratio
                        q.not(q.gt(q.field("aspectRatio"), 4)),
                        // Has been analyzed (not null)
                        q.neq(q.field("isSensitive"), null)
                    )
                )
                .order("desc")
                .paginate(args.paginationOpts);
        }

        // Enrich with owner info, then convert to optimized public feed format
        const enrichedPage = await enrichImages(ctx, paginatedResult.page)

        return {
            ...paginatedResult,
            page: toPublicFeedImages(enrichedPage),
        }
    },
})

/**
 * Get public images for a specific user (by username).
 * Respects the viewer's content filter preference for sensitive content.
 */
export const getImagesByUsername = query({
    args: {
        username: v.string(),
        paginationOpts: paginationOptsValidator,
        /** Viewer's content filter preference */
        filterPreference: v.optional(v.union(v.literal("block"), v.literal("blur"), v.literal("allow"))),
    },
    handler: async (ctx, args) => {
        const { filterPreference = "blur" } = args;

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

        let paginatedResult;

        // CASE 1: BLOCK - Show ONLY safe content (isSensitive=false)
        if (filterPreference === "block") {
            paginatedResult = await ctx.db
                .query("generatedImages")
                .withIndex("by_owner_visibility", (q) =>
                    q.eq("ownerId", user.clerkId).eq("visibility", "public")
                )
                .filter((q) =>
                    q.and(
                        q.not(q.gt(q.field("aspectRatio"), 4)),
                        q.eq(q.field("isSensitive"), false)
                    )
                )
                .order("desc")
                .paginate(args.paginationOpts)
        }
        // CASE 2 & 3: BLUR / ALLOW - Show ALL tagged content (safe OR sensitive)
        // Filter out 'null' (pending) to avoid showing unanalyzed content
        else {
            paginatedResult = await ctx.db
                .query("generatedImages")
                .withIndex("by_owner_visibility", (q) =>
                    q.eq("ownerId", user.clerkId).eq("visibility", "public")
                )
                .filter((q) =>
                    q.and(
                        q.not(q.gt(q.field("aspectRatio"), 4)),
                        // Has been analyzed (not null) - prevents showing pending content
                        q.neq(q.field("isSensitive"), null)
                    )
                )
                .order("desc")
                .paginate(args.paginationOpts)
        }

        // Enrich with user info (we already have the user), cast to EnrichedImage for helper
        const enrichedPage = paginatedResult.page.map((image) => ({
            ...image,
            ownerName: user.username ?? "Anonymous",
            ownerPictureUrl: user.pictureUrl ?? null,
        })) as EnrichedImage[]

        return {
            ...paginatedResult,
            page: toPublicFeedImages(enrichedPage),
        }
    },
})

/**
 * Get feed of images from users the current user follows.
 * 
 * OPTIMIZATION: Uses per-user indexed queries instead of scanning all public images.
 * - Old approach: Scan ALL public images with filter → O(total_public_images)
 * - New approach: Query each followed user with index → O(followed_users * IMAGES_PER_USER)
 * 
 * For users following <50 accounts, this is dramatically faster and more scalable.
 * 
 * Note: This simplified implementation fetches a fixed number of recent images per user
 * and does not support cursor-based pagination. For MVP, this is acceptable since
 * most users follow <50 accounts. Cursor support can be added later if needed.
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

        // Fetch latest N images per followed user using indexed queries
        // This uses the by_owner_visibility index for O(log n) lookups per user
        // instead of scanning all public images
        const IMAGES_PER_USER = 10 // Tune this based on expected follow counts
        const perUserResults = await Promise.all(
            followedIds.map((userId) =>
                ctx.db
                    .query("generatedImages")
                    .withIndex("by_owner_visibility", (q) =>
                        q.eq("ownerId", userId).eq("visibility", "public")
                    )
                    .filter((q) => q.not(q.gt(q.field("aspectRatio"), 4)))
                    .order("desc")
                    .take(IMAGES_PER_USER)
            )
        )

        // Merge and sort by createdAt descending
        const allImages = perUserResults.flat()
        allImages.sort((a, b) => b.createdAt - a.createdAt)

        // Take requested page size
        const pageSize = args.paginationOpts.numItems ?? 20
        const page = allImages.slice(0, pageSize)

        const enrichedPage = await enrichImages(ctx, page)

        // Note: Simplified pagination - isDone when we've shown all merged images
        // For true cursor-based pagination, we'd need a more complex approach
        return {
            page: toPublicFeedImages(enrichedPage),
            isDone: allImages.length <= pageSize,
            continueCursor: "", // Simplified: no cursor support
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
