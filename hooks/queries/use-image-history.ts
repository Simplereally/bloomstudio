"use client"

import { usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

/**
 * Hook to fetch the current user's generated image history.
 * Uses Convex paginated query with infinite scroll support.
 */
export function useImageHistory() {
    return usePaginatedQuery(
        api.generatedImages.getMyImages,
        {},
        { initialNumItems: 20 }
    )
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
