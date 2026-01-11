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
    const isConvexId = (id?: string): id is Id<"generatedImages"> => {
        // Convex IDs are base32 strings, but strict validation is complex.
        // We mainly want to ensure it's not a temp ID (which often start with 'img_')
        // and let the server handle strict validation if it passes this basic check.
        // Ideally, we'd use a regex if we knew the exact format, but simple length/content checks help.
        // For now, we trust non-empty strings that don't look like our temp IDs.
        return !!id && !id.startsWith("img_")
    }

    const shouldFetch = isConvexId(imageId)

    return useQuery(
        api.favorites.isFavorited, 
        shouldFetch ? { imageId } : "skip"
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
