"use client"

/**
 * useImageSelection Hook
 *
 * Provides image selection state and bulk action handlers for list views.
 * Can be used by history page, favorites page, or any view with selectable images.
 * 
 * Performance optimizations:
 * - Uses ref pattern for selectedIds to avoid recreating callbacks on selection changes
 * - All callbacks are stable (don't change reference) to prevent child re-renders
 */

import type { Id } from "@/convex/_generated/dataModel"
import { useDeleteGeneratedImage } from "@/hooks/mutations/use-delete-image"
import { useSetBulkVisibility, type ImageVisibility } from "@/hooks/mutations/use-set-visibility"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

export interface SelectableImage {
    _id: string
    [key: string]: unknown
}

export interface UseImageSelectionReturn {
    // Selection state
    selectionMode: boolean
    setSelectionMode: React.Dispatch<React.SetStateAction<boolean>>
    selectedIds: Set<string>
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>

    // Selection helpers
    toggleSelection: (id: string) => void
    selectAll: (images: SelectableImage[]) => void
    deselectAll: () => void
    isSelected: (id: string) => boolean

    // Bulk action handlers
    handleDeleteSelected: () => Promise<void>
    handleSetSelectedVisibility: (visibility: ImageVisibility) => Promise<void>

    // Loading states
    isDeleting: boolean
    isUpdatingVisibility: boolean
}

/**
 * Hook for managing image selection and bulk actions in list views.
 * Uses ref pattern to keep callbacks stable while still accessing current selection state.
 */
export function useImageSelection(): UseImageSelectionReturn {
    // Selection state
    const [selectionMode, setSelectionMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    
    // Ref to access current selectedIds without causing callback recreation
    const selectedIdsRef = useRef(selectedIds)

    useEffect(() => {
        selectedIdsRef.current = selectedIds
    }, [selectedIds])

    // Mutations
    const deleteMutation = useDeleteGeneratedImage()
    const setBulkVisibilityMutation = useSetBulkVisibility()

    // Toggle selection for a single image - stable callback using ref
    const toggleSelection = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }, [])

    // Select all images - stable callback
    const selectAll = useCallback((images: SelectableImage[]) => {
        setSelectedIds(new Set(images.map((img) => img._id)))
    }, [])

    // Deselect all images - stable callback
    const deselectAll = useCallback(() => {
        setSelectedIds(new Set())
    }, [])

    // Check if an image is selected - stable callback using ref
    const isSelected = useCallback(
        (id: string) => selectedIdsRef.current.has(id),
        []
    )

    // Handle bulk delete - stable callback using ref
    const handleDeleteSelected = useCallback(async () => {
        const currentSelectedIds = selectedIdsRef.current
        if (currentSelectedIds.size === 0) return

        const imageIds = Array.from(currentSelectedIds) as Id<"generatedImages">[]

        try {
            // Delete all selected images sequentially (Convex handles the logic)
            await Promise.all(
                imageIds.map((id) => deleteMutation.mutateAsync(id))
            )
            toast.success(`Deleted ${imageIds.length} image${imageIds.length > 1 ? "s" : ""}`)
            setSelectedIds(new Set())
            setSelectionMode(false)
        } catch (error) {
            console.error("Bulk delete failed:", error)
            // Individual failures are handled by the mutation
        }
    }, [deleteMutation])

    // Handle bulk visibility change - stable callback using ref
    const handleSetSelectedVisibility = useCallback(
        async (visibility: ImageVisibility) => {
            const currentSelectedIds = selectedIdsRef.current
            if (currentSelectedIds.size === 0) {
                toast.error("No images selected")
                return
            }

            const imageIds = Array.from(currentSelectedIds) as Id<"generatedImages">[]

            try {
                await setBulkVisibilityMutation.mutateAsync({ imageIds, visibility })
                setSelectedIds(new Set())
                setSelectionMode(false)
            } catch (error) {
                console.error("Bulk visibility update failed:", error)
            }
        },
        [setBulkVisibilityMutation]
    )

    return {
        // Selection state
        selectionMode,
        setSelectionMode,
        selectedIds,
        setSelectedIds,

        // Selection helpers
        toggleSelection,
        selectAll,
        deselectAll,
        isSelected,

        // Bulk action handlers
        handleDeleteSelected,
        handleSetSelectedVisibility,

        // Loading states
        isDeleting: deleteMutation.isPending,
        isUpdatingVisibility: setBulkVisibilityMutation.isPending,
    }
}
