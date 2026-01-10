"use client"

import {
    ActiveFilterBadges,
    HistoryFiltersDropdown,
    type HistoryFilterState,
} from "@/components/gallery/history-filters"
import type { Id } from "@/convex/_generated/dataModel"
import { useDeleteGeneratedImage } from "@/hooks/mutations/use-delete-image"
import { useSetBulkVisibility } from "@/hooks/mutations/use-set-visibility"
import { useImageHistory, type HistoryFilters } from "@/hooks/queries/use-image-history"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useUser } from "@clerk/nextjs"
import * as React from "react"
import { toast } from "sonner"
import { ImageGallery, type ImageGalleryProps, type ThumbnailData } from "./image-gallery"

const INITIAL_FILTER_STATE: HistoryFilterState = {
    selectedVisibility: [],
    selectedModels: [],
}

/**
 * Props for PersistentImageGallery - excludes props that are managed internally
 */
type PersistentImageGalleryProps = Omit<
    ImageGalleryProps, 
    "images" | "headerContent" | "isLoading" | "isExhausted" | 
    "onMakeSelectedPublic" | "onMakeSelectedPrivate" | "onDeleteSelected" |
    "selectionMode" | "selectedIds" | "onSelectionChange" | "onToggleSelectionMode"
>

/**
 * Smart component that fetches persistent image history from Convex
 * and displays it using the ImageGallery presentational component.
 * 
 * Performance: Manages selection state internally to avoid propagating
 * selection changes to parent components. This prevents unnecessary
 * re-renders when checking/unchecking items.
 * 
 * Includes filter state management for visibility and model filtering.
 */
export function PersistentImageGallery(props: PersistentImageGalleryProps) {
    const { ...restProps } = props

    const { user } = useUser()

    // ========================================
    // Internal Selection State (isolated from parent)
    // ========================================
    const [selectionMode, setSelectionMode] = React.useState(false)
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
    
    // Ref for stable callbacks
    const selectedIdsRef = React.useRef(selectedIds)
    
    React.useEffect(() => {
        selectedIdsRef.current = selectedIds
    }, [selectedIds])

    // Determine storage key based on user ID for account-specific preferences
    const storageKey = React.useMemo(() => 
        user?.id ? `bloom:studio-filters:${user.id}` : "bloom:studio-filters:anon",
    [user?.id])

    // Filter state persisted to localStorage
    const [filterState, setFilterState] = useLocalStorage<HistoryFilterState>(storageKey, INITIAL_FILTER_STATE)

    // Mutations
    const setBulkVisibilityMutation = useSetBulkVisibility()
    const deleteMutation = useDeleteGeneratedImage()

    // Convert filter state to query parameters
    const queryFilters: HistoryFilters = React.useMemo(() => ({
        visibility: filterState.selectedVisibility.length === 1
            ? filterState.selectedVisibility[0]
            : undefined,
        models: filterState.selectedModels.length > 0 ? filterState.selectedModels : undefined,
    }), [filterState])

    const { results, status, loadMore } = useImageHistory(queryFilters)

    const isLoading = status === "LoadingFirstPage"
    const isLoadingMore = status === "LoadingMore"
    const isExhausted = status === "Exhausted"
    const canLoadMore = status === "CanLoadMore"

    // Auto-load more if we got an empty page but aren't done
    React.useEffect(() => {
        if (canLoadMore && results.length === 0) {
            loadMore(20)
        }
    }, [canLoadMore, results.length, loadMore])

    // ========================================
    // Stable Image References (prevents full gallery re-render)
    // ========================================
    // When Convex pushes updates, the entire `results` array is replaced with new object references.
    // Without stabilization, every ThumbnailItem would re-render even if its data hasn't changed.
    // We use a cache map to preserve object references for unchanged images.
    const imageCache = React.useRef<Map<string, ThumbnailData>>(new Map())
    
    const mappedImages = React.useMemo(() => {
        const newCache = new Map<string, ThumbnailData>()
        
        const stableImages = results.map(img => {
            const id = img._id
            // eslint-disable-next-line react-hooks/refs -- Optimization: accessing ref during render for stable object identity
            const cached = imageCache.current.get(id)
            
            // Check if cached version is still valid (same data)
            // Only compare fields that would affect rendering
            if (cached && 
                cached.url === img.url && 
                cached.visibility === img.visibility &&
                cached.model === img.model) {
                // Reuse cached object reference - prevents child re-render
                newCache.set(id, cached)
                return cached
            }
            
            // Create new object for new/changed images
            const newImage: ThumbnailData = {
                id,
                _id: id,
                _creationTime: img._creationTime,
                url: img.url,
                visibility: img.visibility,
                model: img.model,
                prompt: "", // Placeholder - full data loaded on click via getById
            }
            
            newCache.set(id, newImage)
            return newImage
        })
        
        // Update cache for next render
        // Update cache for next render
        // eslint-disable-next-line react-hooks/refs -- Optimization: updating ref during render
        imageCache.current = newCache
        
        return stableImages
    }, [results])

    // ========================================
    // Selection Handlers (stable callbacks)
    // ========================================
    const handleToggleSelectionMode = React.useCallback(() => {
        setSelectionMode(prev => {
            // Clear selection when exiting selection mode
            if (prev) {
                setSelectedIds(new Set())
            }
            return !prev
        })
    }, [])

    const handleSelectionChange = React.useCallback((newSelection: Set<string>) => {
        setSelectedIds(newSelection)
    }, [])

    // ========================================
    // Bulk Action Handlers (stable callbacks using refs)
    // ========================================
    const handleMakeSelectedPublic = React.useCallback(async () => {
        const currentSelectedIds = selectedIdsRef.current
        if (currentSelectedIds.size === 0) return
        
        const imageIds = Array.from(currentSelectedIds) as Id<"generatedImages">[]
        try {
            await setBulkVisibilityMutation.mutateAsync({ imageIds, visibility: "public" })
            toast.success(`Made ${imageIds.length} image${imageIds.length > 1 ? "s" : ""} public`)
            setSelectedIds(new Set())
            setSelectionMode(false)
        } catch (error) {
            console.error("Failed to make images public:", error)
        }
    }, [setBulkVisibilityMutation])

    const handleMakeSelectedPrivate = React.useCallback(async () => {
        const currentSelectedIds = selectedIdsRef.current
        if (currentSelectedIds.size === 0) return
        
        const imageIds = Array.from(currentSelectedIds) as Id<"generatedImages">[]
        try {
            await setBulkVisibilityMutation.mutateAsync({ imageIds, visibility: "unlisted" })
            toast.success(`Made ${imageIds.length} image${imageIds.length > 1 ? "s" : ""} private`)
            setSelectedIds(new Set())
            setSelectionMode(false)
        } catch (error) {
            console.error("Failed to make images private:", error)
        }
    }, [setBulkVisibilityMutation])

    const handleDeleteSelected = React.useCallback(async () => {
        const currentSelectedIds = selectedIdsRef.current
        if (currentSelectedIds.size === 0) return
        
        const imageIds = Array.from(currentSelectedIds) as Id<"generatedImages">[]
        try {
            await Promise.all(imageIds.map(id => deleteMutation.mutateAsync(id)))
            toast.success(`Deleted ${imageIds.length} image${imageIds.length > 1 ? "s" : ""}`)
            setSelectedIds(new Set())
            setSelectionMode(false)
        } catch (error) {
            console.error("Failed to delete images:", error)
        }
    }, [deleteMutation])

    // Memoize header content to prevent unnecessary re-renders
    const headerContent = React.useMemo(() => (
        <div className="flex flex-col gap-1.5">
            <HistoryFiltersDropdown
                filters={filterState}
                onFiltersChange={setFilterState}
            />
            <ActiveFilterBadges
                filters={filterState}
                onFiltersChange={setFilterState}
            />
        </div>
    ), [filterState, setFilterState])

    // Memoize load more handler
    const handleLoadMore = React.useCallback(() => {
        loadMore(20)
    }, [loadMore])

    return (
        <ImageGallery
            {...restProps}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
            onToggleSelectionMode={handleToggleSelectionMode}
            images={mappedImages}
            headerContent={headerContent}
            isLoading={isLoading}
            isExhausted={isExhausted}
            onLoadMore={canLoadMore || isLoadingMore ? handleLoadMore : undefined}
            isLoadingMore={isLoadingMore}
            onMakeSelectedPublic={handleMakeSelectedPublic}
            onMakeSelectedPrivate={handleMakeSelectedPrivate}
            onDeleteSelected={handleDeleteSelected}
        />
    )
}
