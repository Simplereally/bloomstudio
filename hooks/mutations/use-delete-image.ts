"use client"

import { useMutation as useConvexMutation } from "convex/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
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
            const result = await removeImage({ imageId })
            
            // Mutation throws on error, no need to check success


            // Delete original image from R2 via API route
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

            // Delete thumbnail from R2 via API route (if exists)
            if (result.thumbnailR2Key) {
                try {
                    const response = await fetch("/api/images/delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ r2Key: result.thumbnailR2Key }),
                    })

                    if (!response.ok) {
                        const error = await response.json()
                        console.error("[useDeleteGeneratedImage] Failed to delete thumbnail from R2:", error)
                    }
                } catch (error) {
                    console.error("[useDeleteGeneratedImage] Network error deleting thumbnail from R2:", error)
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
 * Hook to bulk delete multiple generated images.
 * Uses a single Convex mutation and shows a single toast.
 */
export function useBulkDeleteGeneratedImages() {
    const removeImages = useConvexMutation(api.generatedImages.removeMany)
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (imageIds: Id<"generatedImages">[]) => {
            // Delete all from Convex in one call (returns r2Keys and thumbnailR2Keys)
            const result = await removeImages({ imageIds })

            // Handle potential legacy/test shape where 'error' string is returned
            const flexibleResult = result as typeof result & { error?: string }
            const errors = flexibleResult.errors ?? (flexibleResult.error ? [flexibleResult.error] : undefined)

            if (errors && errors.length > 0) {
                throw new Error(errors.join(", ") || `Failed to delete images. Success: ${result.successCount}/${imageIds.length}`)
            }

            // Collect all keys to delete (both images and thumbnails)
            const allKeysToDelete: string[] = [
                ...(result.r2Keys ?? []),
                ...(result.thumbnailR2Keys ?? []),
            ]

            // Delete all R2 files in parallel but don't block on failures
            if (allKeysToDelete.length > 0) {
                await Promise.allSettled(
                    allKeysToDelete.map(async (r2Key: string) => {
                        try {
                            const response = await fetch("/api/images/delete", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ r2Key }),
                            })

                            if (!response.ok) {
                                const error = await response.json()
                                console.error("[useBulkDeleteGeneratedImages] Failed to delete from R2:", error)
                            }
                        } catch (error) {
                            console.error("[useBulkDeleteGeneratedImages] Network error deleting from R2:", error)
                        }
                    })
                )
            }

            return result
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["image-history"] })
            await queryClient.cancelQueries({ queryKey: ["public-feed"] })

            const previousHistory = queryClient.getQueryData(["image-history"])
            const previousFeed = queryClient.getQueryData(["public-feed"])

            return { previousHistory, previousFeed }
        },
        onSuccess: (result) => {
            const count = result.successCount
            toast.success(`Deleted ${count} image${count !== 1 ? "s" : ""}`)
            queryClient.invalidateQueries({ queryKey: ["image-history"] })
            queryClient.invalidateQueries({ queryKey: ["public-feed"] })
        },
        onError: (error, _imageIds, context) => {
            if (context) {
                queryClient.setQueryData(["image-history"], context.previousHistory)
                queryClient.setQueryData(["public-feed"], context.previousFeed)
            }
            toast.error("Failed to delete images", {
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
            const result = await removeImage({ imageId })

            // Mutation throws on error, no need to check success


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
