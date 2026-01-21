/**
 * Helper functions for generated images queries.
 * Pure functions that transform data - no database access.
 */
import type { Doc } from "../_generated/dataModel"
import type { QueryCtx } from "../_generated/server"
import type {
    EnrichedImage,
    PublicFeedImage,
    ThumbnailImage,
    DisplayImage,
    MyImagesQueryStrategy,
    DisplayDataQueryStrategy,
} from "./types"

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
export async function enrichImages(
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
 * Helper to map enriched images to optimized public feed format.
 * Reduces bandwidth by using video previews for feed cards and excluding unused fields.
 * 
 * For videos: Uses compressed previewUrl (~480px width) instead of full-size video.
 * For images: Uses full-size url (thumbnailUrl is too small for 360px+ feed cards).
 */
export function toPublicFeedImages(images: EnrichedImage[]): PublicFeedImage[] {
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
 * Helper to map full documents to lightweight thumbnail format.
 * Reduces bandwidth by ~90% by excluding generationParams, prompt, and other unused fields.
 * Uses thumbnailUrl when available (~98% additional bandwidth reduction for gallery).
 */
export function toThumbnails(images: Doc<"generatedImages">[]): ThumbnailImage[] {
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
 * Helper to map full documents to display-ready format.
 * Includes fields needed for ImageCard display but excludes heavy generationParams.
 */
export function toDisplayImages(images: Doc<"generatedImages">[]): DisplayImage[] {
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
 * Determines query strategy for getMyImages based on filter combination.
 */
export function getMyImagesQueryStrategy(
    visibility: "public" | "unlisted" | undefined,
    models: string[] | undefined
): MyImagesQueryStrategy {
    const hasModelFilter = models && models.length > 0
    const modelsSet = hasModelFilter ? new Set(models) : null
    const isSingleModel = modelsSet?.size === 1

    // No filters case
    if (!visibility && !hasModelFilter) {
        return { type: "no_filters" }
    }
    // Single model only (no visibility filter)
    if (!visibility && isSingleModel && modelsSet) {
        const [model] = [...modelsSet]
        if (model) {
            return { type: "single_model_only", model }
        }
    }
    // Visibility only (no model filter)
    if (visibility && !hasModelFilter) {
        return { type: "visibility_only", visibility }
    }
    // Visibility + single model
    if (visibility && isSingleModel && modelsSet) {
        const [model] = [...modelsSet]
        if (model) {
            return { type: "visibility_single_model", visibility, model }
        }
    }
    // Multiple models (with or without visibility)
    if (hasModelFilter && modelsSet) {
        return { type: "multi_model_filter", visibility: visibility ?? null, models: [...modelsSet] }
    }

    // Fallback (should not reach here with valid inputs)
    return { type: "no_filters" }
}

/**
 * Determines query strategy for getMyImagesWithDisplayData based on filter combination.
 */
export function getDisplayDataQueryStrategy(
    visibility: "public" | "unlisted" | undefined,
    models: string[] | undefined
): DisplayDataQueryStrategy {
    const hasModelFilter = models && models.length > 0
    const modelsSet = hasModelFilter ? new Set(models) : null
    const isSingleModel = modelsSet?.size === 1

    // No filters case
    if (!visibility && !hasModelFilter) {
        return { type: "no_filters" }
    }
    // Single model only (no visibility filter)
    if (!visibility && isSingleModel && modelsSet) {
        const [model] = [...modelsSet]
        if (model) {
            return { type: "single_model_only", model }
        }
    }
    // Visibility filter only
    if (visibility && !hasModelFilter) {
        return { type: "visibility_only", visibility }
    }
    // Visibility + single model
    if (visibility && isSingleModel && modelsSet) {
        const [model] = [...modelsSet]
        if (model) {
            return { type: "visibility_single_model", visibility, model }
        }
    }
    // Multi-model filter (with or without visibility)
    return {
        type: "multi_model_filter",
        visibility: visibility ?? null,
        models: modelsSet ? [...modelsSet] : [],
    }
}

/**
 * Executes the appropriate paginated query based on the strategy.
 * Each case uses the optimal index for the given filter combination.
 */
export async function executeMyImagesQuery(
    ctx: QueryCtx,
    ownerId: string,
    strategy: MyImagesQueryStrategy,
    paginationOpts: { numItems: number; cursor: string | null }
) {
    switch (strategy.type) {
        case "no_filters":
            return ctx.db
                .query("generatedImages")
                .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
                .order("desc")
                .paginate(paginationOpts)

        case "single_model_only":
            return ctx.db
                .query("generatedImages")
                .withIndex("by_owner_model", (q) =>
                    q.eq("ownerId", ownerId).eq("model", strategy.model)
                )
                .order("desc")
                .paginate(paginationOpts)

        case "visibility_only":
            return ctx.db
                .query("generatedImages")
                .withIndex("by_owner_visibility", (q) =>
                    q.eq("ownerId", ownerId).eq("visibility", strategy.visibility)
                )
                .order("desc")
                .paginate(paginationOpts)

        case "visibility_single_model":
            return ctx.db
                .query("generatedImages")
                .withIndex("by_owner_visibility_model", (q) =>
                    q.eq("ownerId", ownerId)
                        .eq("visibility", strategy.visibility)
                        .eq("model", strategy.model)
                )
                .order("desc")
                .paginate(paginationOpts)

        case "multi_model_filter": {
            const visibilityValue = strategy.visibility
            const baseQuery = visibilityValue
                ? ctx.db
                    .query("generatedImages")
                    .withIndex("by_owner_visibility", (q) =>
                        q.eq("ownerId", ownerId).eq("visibility", visibilityValue)
                    )
                : ctx.db
                    .query("generatedImages")
                    .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))

            return baseQuery
                .filter((q) => {
                    const modelConditions = strategy.models.map(model =>
                        q.eq(q.field("model"), model)
                    )
                    return modelConditions.length === 1
                        ? modelConditions[0]
                        : q.or(...modelConditions)
                })
                .order("desc")
                .paginate(paginationOpts)
        }
    }
}
