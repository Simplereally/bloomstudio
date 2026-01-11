"use client"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useMutation, usePaginatedQuery, useQuery } from "convex/react"

/**
 * Hook to fetch the current user's favorited images with pagination.
 */
export function useFavorites() {
    return usePaginatedQuery(
        api.favorites.list,
        {},
        { initialNumItems: 20 }
    )
}

/**
 * Hook to check if a specific image is favorited by the current user.
 */
export function useIsFavorited(imageId?: string) {
    return useQuery(
        api.favorites.isFavorited, 
        imageId ? { imageId: imageId as Id<"generatedImages"> } : "skip"
    )
}

/**
 * Hook to toggle favorite status for an image.
 */
export function useToggleFavorite() {
    return useMutation(api.favorites.toggle)
}

/**
 * Hook to batch check if multiple images are favorited.
 */
export function useBatchIsFavorited(imageIds: Id<"generatedImages">[]) {
    return useQuery(
        api.favorites.batchIsFavorited,
        imageIds.length > 0 ? { imageIds } : "skip"
    )
}
