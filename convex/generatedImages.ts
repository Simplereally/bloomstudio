/**
 * Convex Generated Images Functions
 *
 * Queries and mutations for managing AI-generated images.
 */
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import type { Doc } from "./_generated/dataModel"
import { mutation, query, type QueryCtx, internalMutation, internalQuery } from "./_generated/server"
import { internal } from "./_generated/api"
import { analyzePromptForNSFW } from "./lib/nsfwDetection"

/**
 * Maximum number of items allowed in bulk operations to avoid hitting Convex limits.
 * Convex has limits on transaction size and number of reads/writes per transaction.
 */
const MAX_BULK_OPERATION_SIZE = 100

/** Image with enriched owner display information */
type EnrichedImage = Doc<"generatedImages"> & {
    ownerName: string
    ownerPictureUrl: string | null
}

/**
 * Helper to batch-enrich images with owner display info.
 * Collects unique owner IDs and performs batch lookups to avoid N+1 queries.
 * 
 * NOTE: Current Limitation (Bandwidth Consideration)
 * This fetches full user documents including encrypted API keys (pollinationsApiKey).
 * Convex doesn't support field projection at the DB layer.
 * 
 * If user documents grow significantly (>10KB), consider splitting into a separate
 * `userProfiles` table with only public display fields (username, pictureUrl).
 * This would reduce internal bandwidth usage per enrichImages call.
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
 * Optimized public feed image data for unauthenticated display.
 * Includes only fields needed for feed cards - excludes heavy generationParams.
 * Uses full-size images for quality - thumbnails are too small for feed card dimensions.
 */
type PublicFeedImage = {
    _id: Doc<"generatedImages">["_id"]
    _creationTime: number
    /** Full-size URL for proper display quality at feed card dimensions */
    url: string
    /** Original full-size URL (for lightbox/download) */
    originalUrl: string
    visibility: "public" | "unlisted"
    createdAt: number
    model: string
    /** Prompt for display (users can copy) */
    prompt: string
    /** Dimensions for aspect ratio calculation */
    width: number | undefined
    height: number | undefined
    /** Seed for display badges */
    seed: number | undefined
    /** MIME type for video detection */
    contentType: string
    /** Owner display name */
    ownerName: string
    /** Owner avatar URL */
    ownerPictureUrl: string | null
    /** Whether content is sensitive */
    isSensitive: boolean
}

/**
 * Helper to map enriched images to optimized public feed format.
 * Reduces bandwidth by using video previews for feed cards and excluding unused fields.
 * 
 * For videos: Uses compressed previewUrl (~480px width) instead of full-size video.
 * For images: Uses full-size url (thumbnailUrl is too small for 360px+ feed cards).
 */
function toPublicFeedImages(images: EnrichedImage[]): PublicFeedImage[] {
    return images.map(img => {
        // For videos, prefer previewUrl (smaller file) if available
        // Fall back to full URL if no preview was generated
        const isVideo = img.contentType?.startsWith("video/")
        const feedUrl = isVideo && img.previewUrl ? img.previewUrl : img.url

        return {
            _id: img._id,
            _creationTime: img._creationTime,
            url: feedUrl,
            // Always keep original URL for lightbox/download
            originalUrl: img.url,
            visibility: img.visibility,
            createdAt: img.createdAt,
            model: img.model,
            prompt: img.prompt,
            width: img.width,
            height: img.height,
            seed: img.seed,
            contentType: img.contentType,
            ownerName: img.ownerName,
            ownerPictureUrl: img.ownerPictureUrl,
            isSensitive: !!img.isSensitive, // Convert null/undefined to false for client boolean (default safe)
        }
    })
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

        // Private images (unlisted) bypass NSFW detection entirely.
        // They are never shown in public feeds, so content analysis is unnecessary.
        const isPrivate = (args.visibility ?? "public") === "unlisted"
        const needsModeration = !isPrivate
        const needsSecondaryAssets = args.contentType.startsWith("video/")

        let isSensitive: boolean | null = false
        let sensitiveSource: "prompt_analysis" | undefined = undefined
        let sensitiveConfidence = 0

        if (!isPrivate) {
            // Analyze prompt for NSFW content (public images only)
            const promptAnalysis = analyzePromptForNSFW(args.prompt)
            console.log(`[Prompt Analysis] Score: ${promptAnalysis.confidence}, Sensitive: ${promptAnalysis.isSensitive}, Terms: ${promptAnalysis.matchedTerms.join(", ")}`)

            isSensitive = promptAnalysis.confidence >= 0.9 ? true : null
            sensitiveSource = promptAnalysis.confidence >= 0.9 ? "prompt_analysis" : undefined
            sensitiveConfidence = promptAnalysis.confidence
        } else {
            console.log(`[Prompt Analysis] Skipped — private image`)
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
            createdAt: Date.now(),

            isSensitive,
            sensitiveSource,
            sensitiveConfidence,
            moderationStage: needsModeration && sensitiveConfidence < 0.9 ? "prompt_inference" : undefined,
            moderationDispatchStatus: needsModeration && sensitiveConfidence < 0.9 ? "pending" : undefined,
            moderationDispatchAttempts: needsModeration && sensitiveConfidence < 0.9 ? 0 : undefined,
            moderationUpdatedAt: needsModeration && sensitiveConfidence < 0.9 ? Date.now() : undefined,
            secondaryAssetsDispatchStatus: needsSecondaryAssets ? "pending" : undefined,
            secondaryAssetsDispatchAttempts: needsSecondaryAssets ? 0 : undefined,
            secondaryAssetsUpdatedAt: needsSecondaryAssets ? Date.now() : undefined,
        })

        // Store heavy details in side table (P0 Optimization)
        await ctx.db.insert("generatedImageDetails", {
            imageId,
            generationParams: args.generationParams,
        })

        // Schedule async Prompt Inference (Phase 3) only for public images
        // that were not explicitly flagged by Gate 1.
        if (!isPrivate && sensitiveConfidence < 0.9) {
            await ctx.scheduler.runAfter(0, internal.promptInference.analyzePromptImage, {
                imageId,
                prompt: args.prompt,
            })
        }

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
 * Check whether an image needs NSFW analysis when transitioning to public.
 *
 * Private images bypass NSFW detection at generation time (isSensitive=false,
 * sensitiveSource=undefined). When making them public, we must run the full
 * analysis pipeline before they appear in public feeds.
 *
 * Returns true if the image was never analyzed (generated as private and
 * no subsequent analysis has been performed).
 */
function needsNsfwAnalysis(image: Doc<"generatedImages">): boolean {
    // Image was never run through any analysis gate — sensitiveSource is unset
    // AND the confidence is 0 (the default for skipped private images).
    // Images that were analyzed and found safe will have a sensitiveSource set.
    return !image.sensitiveSource && (image.sensitiveConfidence === 0 || image.sensitiveConfidence === undefined)
}

/**
 * Update the visibility of a generated image.
 * Only the owner can change visibility.
 *
 * When transitioning from unlisted (private) → public, triggers NSFW detection
 * for images that were never analyzed. The image's isSensitive is set to null
 * (pending) so it won't appear in public feeds until analysis completes.
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

        // Detect private → public transition for unanalyzed images
        const isGoingPublic = image.visibility === "unlisted" && args.visibility === "public"
        const requiresAnalysis = isGoingPublic && needsNsfwAnalysis(image)

        if (requiresAnalysis) {
            // Run synchronous prompt keyword analysis (Gate 1)
            const promptAnalysis = analyzePromptForNSFW(image.prompt)
            console.log(`[Visibility] Private→Public NSFW check for ${args.imageId}: score=${promptAnalysis.confidence}, sensitive=${promptAnalysis.isSensitive}, terms=[${promptAnalysis.matchedTerms.join(", ")}]`)

            if (promptAnalysis.confidence >= 0.9) {
                // Gate 1 high-confidence: mark as sensitive immediately
                await ctx.db.patch(args.imageId, {
                    visibility: args.visibility,
                    isSensitive: true,
                    sensitiveSource: "prompt_analysis",
                    sensitiveConfidence: promptAnalysis.confidence,
                })
            } else {
                // Set to pending (null) so image is hidden from public feeds
                // until async analysis (Gate 2/3) completes
                await ctx.db.patch(args.imageId, {
                    visibility: args.visibility,
                    isSensitive: null,
                    sensitiveConfidence: promptAnalysis.confidence,
                    moderationStage: "prompt_inference",
                    moderationDispatchStatus: "pending",
                    moderationDispatchAttempts: 0,
                    moderationUpdatedAt: Date.now(),
                })

                // Schedule async prompt inference (Gate 2), which may escalate to vision (Gate 3)
                await ctx.scheduler.runAfter(0, internal.promptInference.analyzePromptImage, {
                    imageId: args.imageId,
                    prompt: image.prompt,
                })
            }
        } else {
            await ctx.db.patch(args.imageId, {
                visibility: args.visibility,
            })
        }

        return { success: true }
    },
})

/**
 * Bulk update visibility for multiple images.
 * Only the owner can change visibility of their images.
 * Returns the count of successfully updated images.
 *
 * When transitioning from unlisted → public, triggers NSFW detection for
 * images that were never analyzed (same logic as setVisibility).
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

        // Collect images that need async NSFW analysis (scheduled after all patches)
        const imagesToAnalyze: { imageId: typeof args.imageIds[number]; prompt: string }[] = []

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

                    // Detect private → public transition for unanalyzed images
                    const isGoingPublic = image.visibility === "unlisted" && args.visibility === "public"
                    const requiresAnalysis = isGoingPublic && needsNsfwAnalysis(image)

                    if (requiresAnalysis) {
                        const promptAnalysis = analyzePromptForNSFW(image.prompt)
                        console.log(`[Visibility] Bulk private→public NSFW check for ${imageId}: score=${promptAnalysis.confidence}, sensitive=${promptAnalysis.isSensitive}`)

                        if (promptAnalysis.confidence >= 0.9) {
                            await ctx.db.patch(imageId, {
                                visibility: args.visibility,
                                isSensitive: true,
                                sensitiveSource: "prompt_analysis",
                                sensitiveConfidence: promptAnalysis.confidence,
                            })
                        } else {
                            await ctx.db.patch(imageId, {
                                visibility: args.visibility,
                                isSensitive: null,
                                sensitiveConfidence: promptAnalysis.confidence,
                                moderationStage: "prompt_inference",
                                moderationDispatchStatus: "pending",
                                moderationDispatchAttempts: 0,
                                moderationUpdatedAt: Date.now(),
                            })
                            imagesToAnalyze.push({ imageId, prompt: image.prompt })
                        }
                    } else {
                        await ctx.db.patch(imageId, {
                            visibility: args.visibility,
                        })
                    }
                    successCount++
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error"
                    errors.push(`Failed to update image ${imageId}: ${errorMessage}`)
                }
            })
        )

        // Schedule async NSFW analysis for all images that need it
        for (const { imageId, prompt } of imagesToAnalyze) {
            await ctx.scheduler.runAfter(0, internal.promptInference.analyzePromptImage, {
                imageId,
                prompt,
            })
        }

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
 * Returns the R2 keys so the caller can also delete them from storage.
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
        const previewR2Key = image.previewR2Key

        await ctx.db.delete(args.imageId)

        return { r2Key, thumbnailR2Key, previewR2Key }
    },
})

/**
 * Internal query to get image data for analysis.
 * Bypasses visibility checks.
 */
export const getByIdInternal = internalQuery({
    args: { imageId: v.id("generatedImages") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.imageId);
    },
});

/**
 * Internal mutation to update the image with analysis results.
 */
export const updateImageSensitivity = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
        isSensitive: v.boolean(),
        confidence: v.number(),
        contentAnalysis: v.object({
            nudity: v.optional(v.string()),
            sexual: v.optional(v.string()),
            violence: v.optional(v.string()),
            analyzedAt: v.number(),
        }),
    },
    handler: async (ctx, args) => {
        // Update main record with lightweight flags
        await ctx.db.patch(args.imageId, {
            isSensitive: args.isSensitive,
            // If vision found it sensitive, update source
            sensitiveSource: "vision_analysis",
            sensitiveConfidence: args.confidence,
        });

        // Update details record with heavy analysis object
        const details = await ctx.db
            .query("generatedImageDetails")
            .withIndex("by_image", (q) => q.eq("imageId", args.imageId))
            .unique();

        if (details) {
            await ctx.db.patch(details._id, {
                contentAnalysis: args.contentAnalysis,
            });
        } else {
            // Create details if missing (legacy data)
            await ctx.db.insert("generatedImageDetails", {
                imageId: args.imageId,
                generationParams: {}, // Required field, placeholder for legacy
                contentAnalysis: args.contentAnalysis,
            });
        }
    },
});

/**
 * Internal mutation to update image with prompt inference results.
 */
export const updateImagePromptInference = internalMutation({
    args: {
        imageId: v.id("generatedImages"),
        promptInference: v.object({
            category: v.string(),
            confidence: v.number(),
            reasoning: v.string(),
            provider: v.string(),
            analyzedAt: v.number(),
        }),
        isSensitive: v.optional(v.boolean()), // If decided
        confidence: v.optional(v.number()), // If decided
    },
    handler: async (ctx, args) => {
        // 1. Update main record if sensitivity decision was made
        if (args.isSensitive !== undefined) {
             const updates: Record<string, unknown> = {
                isSensitive: args.isSensitive,
                sensitiveSource: "prompt_inference",
            };
            
            if (args.confidence !== undefined) {
                updates.sensitiveConfidence = args.confidence;
            }
            
            await ctx.db.patch(args.imageId, updates);
        }

        // 2. Update details record with inference data
        const details = await ctx.db
            .query("generatedImageDetails")
            .withIndex("by_image", (q) => q.eq("imageId", args.imageId))
            .unique();

        if (details) {
            await ctx.db.patch(details._id, {
                promptInference: args.promptInference,
            });
        } else {
            // Create details if missing (legacy data)
            await ctx.db.insert("generatedImageDetails", {
                imageId: args.imageId,
                generationParams: {}, // Required field, placeholder for legacy
                promptInference: args.promptInference,
            });
        }
    },
});

/**
 * Lightweight analysis recovery state for catch-up actions.
 * Lets recovery paths skip repeating prompt inference when it already ran.
 */
export const getAnalysisRecoveryState = internalQuery({
    args: {
        imageId: v.id("generatedImages"),
    },
    handler: async (ctx, args) => {
        const details = await ctx.db
            .query("generatedImageDetails")
            .withIndex("by_image", (q) => q.eq("imageId", args.imageId))
            .unique()

        return {
            hasPromptInference: details?.promptInference !== undefined,
        }
    },
})

/**
 * Find images that haven't been tagged yet for the cron job.
 * Using 'isSensitive' == null (or undefined for legacy)
 */
export const getUnanalyzedImages = internalQuery({
    args: { limit: v.number() },
    handler: async (ctx, args) => {
        // We want images where isSensitive is NULL (pending) or UNDEFINED (legacy).
        // Index `by_sensitivity` contains keys for `isSensitive` values.
        // However, standard indexing of `null` allows efficient lookup.

        // Priority 1: Check explicit nulls (new schema)
        let pending = await ctx.db
            .query("generatedImages")
            .withIndex("by_sensitivity", q => q.eq("isSensitive", null))
            .take(args.limit);

        // Priority 2: Legacy undefined (backlog) - Only if we need more items
        if (pending.length < args.limit) {
            const legacyPending = await ctx.db
                .query("generatedImages")
                // Scan recent first to clear new stuff, or old first? 
                // Default order is sufficient.
                .filter(q => q.eq(q.field("isSensitive"), undefined))
                .take(args.limit - pending.length);

            pending = [...pending, ...legacyPending];
        }

        return pending;
    },
});

/**
 * Find unanalyzed images that are not already in-flight on the moderation worker plane.
 * Used by the recovery scheduler so it does not keep re-dispatching the same claimed job.
 */
export const getRecoverableUnanalyzedImages = internalQuery({
    args: { limit: v.number() },
    handler: async (ctx, args) => {
        const isRecoverable = (image: Doc<"generatedImages">) =>
            image.moderationDispatchStatus !== "dispatched" &&
            image.moderationDispatchStatus !== "processing";

        const recentPending = await ctx.db
            .query("generatedImages")
            .withIndex("by_sensitivity", (q) => q.eq("isSensitive", null))
            .take(Math.max(args.limit * 4, args.limit));

        let recoverable = recentPending.filter(isRecoverable).slice(0, args.limit);

        if (recoverable.length < args.limit) {
            const legacyPending = await ctx.db
                .query("generatedImages")
                .filter((q) => q.eq(q.field("isSensitive"), undefined))
                .take(Math.max((args.limit - recoverable.length) * 4, args.limit - recoverable.length));

            recoverable = [
                ...recoverable,
                ...legacyPending.filter(isRecoverable).slice(0, args.limit - recoverable.length),
            ];
        }

        return recoverable;
    },
})


/**
 * Bulk delete multiple generated image records.
 * Only the owner can delete their images.
 * Returns all referenced R2 keys so the caller can delete them from storage.
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
                previewR2Keys: [],
                errors: undefined,
            }
        }

        const r2Keys: string[] = []
        const thumbnailR2Keys: string[] = []
        const previewR2Keys: string[] = []
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
                    if (image.previewR2Key) {
                        previewR2Keys.push(image.previewR2Key)
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
            previewR2Keys,
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



