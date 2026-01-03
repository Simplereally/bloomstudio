"use client"

import { useMutation as useConvexMutation } from "convex/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"

/**
 * Hook to delete a generated image.
 * Deletes from Convex first, then attempts to delete from R2.
 */
export function useDeleteGeneratedImage() {
    const removeImage = useConvexMutation(api.generatedImages.remove)
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (imageId: Id<"generatedImages">) => {
            // Delete from Convex (returns r2Key)
            const result = await removeImage({ imageId })

            // Delete from R2 via API route
            if (result.r2Key) {
                try {
                    const response = await fetch("/api/images/delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ r2Key: result.r2Key }),
                    })

                    if (!response.ok) {
                        const error = await response.json()
                        console.error("[useDeleteGeneratedImage] Failed to delete from R2:", error)
                        // Don't throw - Convex record is already deleted, so the UI should reflect that
                    }
                } catch (error) {
                    console.error("[useDeleteGeneratedImage] Network error deleting from R2:", error)
                }
            }

            return result
        },
        onMutate: async () => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["image-history"] })
            await queryClient.cancelQueries({ queryKey: ["public-feed"] })

            // Snapshot the previous value
            const previousHistory = queryClient.getQueryData(["image-history"])
            const previousFeed = queryClient.getQueryData(["public-feed"])

            // Optimistically update to the new value
            // Note: Since usePaginatedQuery is used, this is more complex.
            // For simplicity in this implementation, we rely on invalidation
            // but we can still perform partial optimistic removal if cache is simple.

            return { previousHistory, previousFeed }
        },
        onSuccess: () => {
            toast.success("Image deleted")
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ["image-history"] })
            queryClient.invalidateQueries({ queryKey: ["public-feed"] })
        },
        onError: (error, _imageId, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context) {
                queryClient.setQueryData(["image-history"], context.previousHistory)
                queryClient.setQueryData(["public-feed"], context.previousFeed)
            }
            toast.error("Failed to delete image", {
                description: error instanceof Error ? error.message : "Unknown error",
            })
        },
    })
}

/**
 * Hook to delete a reference image.
 * Deletes from Convex first, then attempts to delete from R2.
 */
export function useDeleteReferenceImage() {
    const removeImage = useConvexMutation(api.referenceImages.remove)
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (imageId: Id<"referenceImages">) => {
            // Delete from Convex (returns r2Key)
            const result = await removeImage({ imageId })

            // Delete from R2 via API route
            if (result.r2Key) {
                try {
                    const response = await fetch("/api/images/delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ r2Key: result.r2Key }),
                    })

                    if (!response.ok) {
                        const error = await response.json()
                        console.error("[useDeleteReferenceImage] Failed to delete from R2:", error)
                    }
                } catch (error) {
                    console.error("[useDeleteReferenceImage] Network error deleting from R2:", error)
                }
            }

            return result
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["reference-images"] })
            const previous = queryClient.getQueryData(["reference-images"])
            return { previous }
        },
        onSuccess: () => {
            toast.success("Reference image deleted")
            // Invalidate reference images query
            queryClient.invalidateQueries({ queryKey: ["reference-images"] })
        },
        onError: (error, _imageId, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["reference-images"], context.previous)
            }
            toast.error("Failed to delete reference image", {
                description: error instanceof Error ? error.message : "Unknown error",
            })
        },
    })
}
