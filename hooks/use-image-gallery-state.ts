"use client"

/**
 * useImageGalleryState Hook
 *
 * Manages the gallery's image collection, selection state, and history.
 * Extracted from use-studio-client-shell to reduce complexity.
 * 
 * Performance optimizations:
 * - Uses ref pattern for selectedIds and images to avoid recreating callbacks
 * - All callbacks are stable to prevent child re-renders
 */

import { Id } from "@/convex/_generated/dataModel"
import { useDeleteGeneratedImage } from "@/hooks/mutations/use-delete-image"
import { useSetBulkVisibility, type ImageVisibility } from "@/hooks/mutations/use-set-visibility"
import type { GeneratedImage } from "@/types/pollinations"
import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"

export interface UseImageGalleryStateReturn {
    // Image state
    images: GeneratedImage[]
    setImages: React.Dispatch<React.SetStateAction<GeneratedImage[]>>
    currentImage: GeneratedImage | null
    setCurrentImage: React.Dispatch<React.SetStateAction<GeneratedImage | null>>

    // History
    promptHistory: string[]
    addToPromptHistory: (prompt: string) => void

    // Selection mode
    selectionMode: boolean
    setSelectionMode: React.Dispatch<React.SetStateAction<boolean>>
    selectedIds: Set<string>
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>

    // Handlers
    handleRemoveImage: (id: string) => Promise<void>
    handleDeleteSelected: () => Promise<void>
    handleSetSelectedVisibility: (visibility: ImageVisibility) => Promise<void>
    addImage: (image: GeneratedImage) => void
}

/**
 * Hook for managing image gallery state including images, selection, and history.
 * Uses ref pattern to keep callbacks stable while still accessing current state.
 */
export function useImageGalleryState(): UseImageGalleryStateReturn {
    // Image collection state
    const [images, setImages] = useState<GeneratedImage[]>([])
    const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null)

    // History state
    const [promptHistory, setPromptHistory] = useState<string[]>([])

    // Selection mode state
    const [selectionMode, setSelectionMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Refs to access current state without causing callback recreation
    const imagesRef = useRef(images)
    imagesRef.current = images
    const selectedIdsRef = useRef(selectedIds)
    selectedIdsRef.current = selectedIds

    // Mutations
    const deleteMutation = useDeleteGeneratedImage()
    const setBulkVisibilityMutation = useSetBulkVisibility()

    // Add prompt to history (deduped, max 10) - stable callback
    const addToPromptHistory = useCallback((prompt: string) => {
        setPromptHistory((prev) => {
            if (prev.includes(prompt)) return prev
            return [prompt, ...prev.slice(0, 9)]
        })
    }, [])

    // Add a new image to the collection - stable callback
    const addImage = useCallback((image: GeneratedImage) => {
        setImages((prev) => [image, ...prev])
        setCurrentImage(image)
    }, [])

    // Handle single image removal - stable callback using ref
    const handleRemoveImage = useCallback(async (id: string) => {
        // First check if this image exists in local state
        const imageInLocalState = imagesRef.current.find(img => img.id === id)

        // Determine the Convex ID to use for deletion
        // For persistent gallery: id IS the _id (mapped in PersistentImageGallery)
        // For local images: use _id if available
        const convexId = imageInLocalState?._id ?? id

        // Try to delete from Convex if we have what looks like a Convex ID
        if (convexId && typeof convexId === 'string') {
            try {
                await deleteMutation.mutateAsync(convexId as Id<"generatedImages">)
            } catch (error) {
                console.error("Failed to delete image from server:", error)
                // Mutation hook already shows toast, but we should stop here
                return
            }
        }

        // Also clean up local state if the image was there
        setImages((prev) => prev.filter((img) => img.id !== id))
        setCurrentImage((curr) => {
            if (curr?.id === id) {
                return null
            }
            return curr
        })
    }, [deleteMutation])

    // Handle bulk delete - stable callback using refs
    const handleDeleteSelected = useCallback(async () => {
        const currentImages = imagesRef.current
        const currentSelectedIds = selectedIdsRef.current
        const imagesToDelete = currentImages.filter(img => currentSelectedIds.has(img.id))

        // Delete all persistent images
        const persistentIds = imagesToDelete
            .filter(img => img._id)
            .map(img => img._id as Id<"generatedImages">)

        if (persistentIds.length > 0) {
            try {
                await Promise.all(persistentIds.map(dbId => deleteMutation.mutateAsync(dbId)))
                toast.success(`Deleted ${persistentIds.length} images`)
            } catch (error) {
                console.error("Bulk delete partially failed:", error)
            }
        }

        setImages((prev) => prev.filter((img) => !currentSelectedIds.has(img.id)))
        setCurrentImage((curr) => {
            if (curr && currentSelectedIds.has(curr.id)) {
                return null
            }
            return curr
        })
        setSelectedIds(new Set())
        setSelectionMode(false)
    }, [deleteMutation])

    // Handle bulk visibility change - stable callback using refs
    const handleSetSelectedVisibility = useCallback(async (visibility: ImageVisibility) => {
        const currentImages = imagesRef.current
        const currentSelectedIds = selectedIdsRef.current
        const imagesToUpdate = currentImages.filter(img => currentSelectedIds.has(img.id))

        // Get persistent image IDs (those with _id from Convex)
        const persistentIds = imagesToUpdate
            .filter(img => img._id)
            .map(img => img._id as Id<"generatedImages">)

        if (persistentIds.length === 0) {
            toast.error("No persistent images selected")
            return
        }

        try {
            await setBulkVisibilityMutation.mutateAsync({ imageIds: persistentIds, visibility })
            // Update local state to reflect the visibility change
            setImages(prev => prev.map(img => 
                currentSelectedIds.has(img.id) ? { ...img, visibility } : img
            ))
            setSelectedIds(new Set())
            setSelectionMode(false)
        } catch (error) {
            console.error("Bulk visibility update failed:", error)
        }
    }, [setBulkVisibilityMutation])

    return {
        // Image state
        images,
        setImages,
        currentImage,
        setCurrentImage,

        // History
        promptHistory,
        addToPromptHistory,

        // Selection mode
        selectionMode,
        setSelectionMode,
        selectedIds,
        setSelectedIds,

        // Handlers
        handleRemoveImage,
        handleDeleteSelected,
        handleSetSelectedVisibility,
        addImage,
    }
}
