"use client"

import { useMutation as useConvexMutation } from "convex/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"

export type ImageVisibility = "public" | "unlisted"

/**
 * Hook to set visibility for a single generated image.
 */
export function useSetImageVisibility() {
    const setVisibility = useConvexMutation(api.generatedImages.setVisibility)
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ 
            imageId, 
            visibility 
        }: { 
            imageId: Id<"generatedImages">
            visibility: ImageVisibility 
        }) => {
            return await setVisibility({ imageId, visibility })
        },
        onSuccess: (_result, { visibility }) => {
            const label = visibility === "public" ? "public" : "private"
            toast.success(`Image marked as ${label}`)
            queryClient.invalidateQueries({ queryKey: ["image-history"] })
            queryClient.invalidateQueries({ queryKey: ["public-feed"] })
        },
        onError: (error) => {
            toast.error("Failed to update visibility", {
                description: error instanceof Error ? error.message : "Unknown error",
            })
        },
    })
}

/**
 * Hook to bulk update visibility for multiple generated images.
 */
export function useSetBulkVisibility() {
    const setBulkVisibility = useConvexMutation(api.generatedImages.setBulkVisibility)
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ 
            imageIds, 
            visibility 
        }: { 
            imageIds: Id<"generatedImages">[]
            visibility: ImageVisibility 
        }) => {
            return await setBulkVisibility({ imageIds, visibility })
        },
        onSuccess: (result, { visibility }) => {
            const label = visibility === "public" ? "public" : "private"
            if (result.successCount > 0) {
                toast.success(`${result.successCount} image${result.successCount > 1 ? "s" : ""} marked as ${label}`)
            }
            if (result.errors && result.errors.length > 0) {
                toast.error(`Failed to update ${result.errors.length} images`)
            }
            queryClient.invalidateQueries({ queryKey: ["image-history"] })
            queryClient.invalidateQueries({ queryKey: ["public-feed"] })
        },
        onError: (error) => {
            toast.error("Failed to update visibility", {
                description: error instanceof Error ? error.message : "Unknown error",
            })
        },
    })
}
