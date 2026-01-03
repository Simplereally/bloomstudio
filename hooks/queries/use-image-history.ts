"use client"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import type { FeedType } from "@/lib/feed-types"
import { usePaginatedQuery, useQuery } from "convex/react"

/** Filter options for image history */
export interface HistoryFilters {
    /** Filter by visibility (undefined = all, "unlisted" = private only, "public" = public only) */
    visibility?: "public" | "unlisted"
    /** Filter by specific model IDs (undefined or empty = all models) */
    models?: string[]
}

/**
 * Hook to fetch the current user's generated image history (LIGHTWEIGHT).
 * Uses Convex paginated query with infinite scroll support.
 * 
 * NOTE: Returns lightweight thumbnail data only (id, url, visibility, createdAt, model).
 * Use this for the studio gallery sidebar where bandwidth is critical.
 * Use useImageDetails() to fetch full image data for lightbox display.
 * 
 * @param filters - Optional filters for visibility and models
 */
export function useImageHistory(filters?: HistoryFilters) {
    return usePaginatedQuery(
        api.generatedImages.getMyImages,
        {
            visibility: filters?.visibility,
            models: filters?.models && filters.models.length > 0 ? filters.models : undefined,
        },
        { initialNumItems: 20 }
    )
}

/**
 * Hook to fetch the current user's generated image history (WITH DISPLAY DATA).
 * Returns fields needed for ImageCard display (prompt, dimensions, seed) but excludes
 * heavy generationParams field. Use this for the dedicated history page.
 * 
 * @param filters - Optional filters for visibility and models
 */
export function useImageHistoryWithDisplayData(filters?: HistoryFilters) {
    return usePaginatedQuery(
        api.generatedImages.getMyImagesWithDisplayData,
        {
            visibility: filters?.visibility,
            models: filters?.models && filters.models.length > 0 ? filters.models : undefined,
        },
        { initialNumItems: 20 }
    )
}

/**
 * Hook to fetch full details of a single image.
 * Use this when opening lightbox to get prompt, model, dimensions, etc.
 * 
 * @param imageId - The image ID to fetch, or null/undefined to skip
 */
export function useImageDetails(imageId: Id<"generatedImages"> | null | undefined) {
    return useQuery(
        api.generatedImages.getById,
        imageId ? { imageId } : "skip"
    )
}

/**
 * Hook to fetch the feed with a specific type.
 * Calls the appropriate separate query based on feed type.
 * @param type - "public" for global feed, "following" for followed users only
 */
export function useFeed(type: FeedType) {
    const publicFeed = usePaginatedQuery(
        api.generatedImages.getPublicFeed,
        type === "public" ? {} : "skip",
        { initialNumItems: 20 }
    )
    const followingFeed = usePaginatedQuery(
        api.generatedImages.getFollowingFeed,
        type === "following" ? {} : "skip",
        { initialNumItems: 20 }
    )

    return type === "public" ? publicFeed : followingFeed
}

/**
 * Hook to fetch the public community feed of generated images.
 */
export function usePublicFeed() {
    return usePaginatedQuery(
        api.generatedImages.getPublicFeed,
        {},
        { initialNumItems: 20 }
    )
}

/**
 * Hook to fetch the feed of users the current user follows.
 */
export function useFollowingFeed() {
    return usePaginatedQuery(
        api.generatedImages.getFollowingFeed,
        {},
        { initialNumItems: 20 }
    )
}

/**
 * Hook to fetch public images for a specific profile by username.
 */
export function useProfileImages(username: string) {
    return usePaginatedQuery(
        api.generatedImages.getImagesByUsername,
        { username },
        { initialNumItems: 20 }
    )
}

