"use client"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useMutation as useConvexMutation, usePaginatedQuery, useQuery } from "convex/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { invalidateUserFavoritesCache } from "@/app/_server/actions/invalidation"
import { toast } from "sonner"

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
 * Uses TanStack Query for mutation state and side effects (invalidation).
 */
export function useToggleFavorite() {
    const toggleFavorite = useConvexMutation(api.favorites.toggle)
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ imageId }: { imageId: Id<"generatedImages"> }) => {
            return await toggleFavorite({ imageId })
        },
        onSuccess: async () => {
            // Invalidate server-side cache
            await invalidateUserFavoritesCache()

            // Note: We don't strictly need to invalidate client-side queries here
            // because Convex subscriptions (useQuery) are real-time and self-updating.
            // But if we had TanStack query based fetches, we would invalidate them here.
        },
        onError: (error) => {
            toast.error("Failed to update favorite", {
                description: error instanceof Error ? error.message : "Unknown error",
            })
        },
    })
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
