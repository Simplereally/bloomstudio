"use client"

import {
    ActiveFilterBadges,
    HistoryFiltersDropdown,
    type HistoryFilterState,
} from "@/components/gallery/history-filters"
import type { Id } from "@/convex/_generated/dataModel"
import { useBulkDeleteGeneratedImages } from "@/hooks/mutations/use-delete-image"
import { useSetBulkVisibility } from "@/hooks/mutations/use-set-visibility"
import { useImageHistory, type HistoryFilters } from "@/hooks/queries/use-image-history"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { loadMyHistoryPage } from "@/app/_server/actions/history"
import { useUser } from "@clerk/nextjs"
import * as React from "react"
import { ImageGallery, type ImageGalleryProps, type ThumbnailData } from "./image-gallery"

const INITIAL_FILTER_STATE: HistoryFilterState = {
    selectedVisibility: [],
    selectedModels: [],
}

// Type for the paginated result from server cache
type PaginatedGalleryResult = {
    page: Array<{
        _id: string
        _creationTime: number
        url: string
        visibility?: "public" | "unlisted"
        model?: string
        contentType?: string
    }>
    isDone: boolean
    continueCursor: string
}

/**
 * Props for PersistentImageGallery - excludes props that are managed internally
 */
type PersistentImageGalleryProps = Omit<
    ImageGalleryProps,
    "images" | "headerContent" | "isLoading" | "isExhausted" |
    "onMakeSelectedPublic" | "onMakeSelectedPrivate" | "onDeleteSelected" |
    "selectionMode" | "selectedIds" | "onSelectionChange" | "onToggleSelectionMode"
> & {
    /** Server-cached initial page (reduces Convex bandwidth on initial load) */
    initialPage?: PaginatedGalleryResult
}

/**
 * Smart component that fetches persistent image history from Convex
 * and displays it using the ImageGallery presentational component.
 * 
 * HYBRID CACHING STRATEGY:
 * - Initial page: Uses server-cached data if provided (reduces Convex bandwidth)
 * - Real-time updates: Convex reactive hooks keep the first page fresh
 * - Load more: Uses server actions for subsequent pages (cached)
 * 
 * This gives us the best of both worlds:
 * - Fast initial load from server cache
 * - Instant updates when new images are generated
 * - Reduced Convex bandwidth for pagination
 * 
 * Performance: Manages selection state internally to avoid propagating
 * selection changes to parent components. This prevents unnecessary
 * re-renders when checking/unchecking items.
 * 
 * Includes filter state management for visibility and model filtering.
 */
export function PersistentImageGallery(props: PersistentImageGalleryProps) {
    const { initialPage, ...restProps } = props

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

    // Track if filters have been changed from default (affects caching strategy)
    const hasActiveFilters = filterState.selectedVisibility.length > 0 || filterState.selectedModels.length > 0

    // Mutations
    const setBulkVisibilityMutation = useSetBulkVisibility()
    const bulkDeleteMutation = useBulkDeleteGeneratedImages()

    // Convert filter state to query parameters
    const queryFilters: HistoryFilters = React.useMemo(() => ({
        visibility: filterState.selectedVisibility.length === 1
            ? filterState.selectedVisibility[0]
            : undefined,
        models: filterState.selectedModels.length > 0 ? filterState.selectedModels : undefined,
    }), [filterState])

    const modelsKey = queryFilters.models?.join(",") ?? ""

    // ========================================
    // Hybrid Data Strategy
    // ========================================
    // Use Convex reactive hook for real-time updates (new generations appear instantly)
    const convexQuery = useImageHistory(queryFilters)
    
    // Server-cached pages for "load more" (reduces Convex bandwidth)
    const [cachedPages, setCachedPages] = React.useState<ThumbnailData[]>([])
    const [cachedCursor, setCachedCursor] = React.useState<string | null>(null)
    const [cachedIsDone, setCachedIsDone] = React.useState(false)
    const [isLoadingCached, setIsLoadingCached] = React.useState(false)
    
    // Initialize cached state from server-provided initial page (only if no filters)
    const initializedRef = React.useRef(false)
    React.useEffect(() => {
        if (initialPage && !initializedRef.current && !hasActiveFilters) {
            initializedRef.current = true
            // We don't use the initial page data directly since Convex hook provides
            // the same data with reactivity. But we capture the cursor for "load more".
            setCachedCursor(initialPage.continueCursor || null)
            setCachedIsDone(initialPage.isDone)
        }
    }, [initialPage, hasActiveFilters])
    
    // Reset cached state when filters change
    React.useEffect(() => {
        setCachedPages([])
        setCachedCursor(null)
        setCachedIsDone(false)
        initializedRef.current = false
    }, [queryFilters.visibility, modelsKey])

    // Combine Convex results with cached pages
    const convexResults = convexQuery.results
    const convexStatus = convexQuery.status
    const convexLoadMore = convexQuery.loadMore
    
    // Determine overall status
    const isLoading = convexStatus === "LoadingFirstPage"
    const isLoadingMore = convexStatus === "LoadingMore" || isLoadingCached
    
    // For exhausted state: check both Convex and cached
    // If there's no cachedCursor (no initialPage provided), consider cached as done
    const convexExhausted = convexStatus === "Exhausted"
    const effectivelyCachedDone = cachedIsDone || !cachedCursor
    const isExhausted = convexExhausted && effectivelyCachedDone
    const canLoadMore = convexStatus === "CanLoadMore" || (!cachedIsDone && cachedCursor)

    // Combined results: Convex reactive data + cached pages
    const results = React.useMemo(() => {
        // If we have cached pages, append them after Convex results
        // But avoid duplicates by checking IDs (cast to string for comparison)
        const convexIds = new Set(convexResults.map(r => String(r._id)))
        const uniqueCachedPages = cachedPages.filter(p => !convexIds.has(p.id))
        return [...convexResults, ...uniqueCachedPages]
    }, [convexResults, cachedPages])

    // Load more handler - uses server action for cached pages
    const handleLoadMore = React.useCallback(async () => {
        // First, exhaust Convex pagination
        if (convexStatus === "CanLoadMore") {
            convexLoadMore(20)
            return
        }
        
        // Then, load from server cache
        if (!cachedIsDone && cachedCursor && !isLoadingCached) {
            setIsLoadingCached(true)
            try {
                const result = await loadMyHistoryPage({
                    cursor: cachedCursor,
                    numItems: 20,
                    filters: queryFilters,
                })
                
                // Map to ThumbnailData format
                const newImages: ThumbnailData[] = result.page.map(img => ({
                    id: img._id,
                    _id: img._id,
                    _creationTime: img._creationTime,
                    url: img.url,
                    visibility: img.visibility,
                    model: img.model,
                    contentType: img.contentType,
                    prompt: "",
                }))
                
                setCachedPages(prev => [...prev, ...newImages])
                setCachedCursor(result.continueCursor || null)
                setCachedIsDone(result.isDone)
            } catch (error) {
                console.error("Failed to load more from cache:", error)
            } finally {
                setIsLoadingCached(false)
            }
        }
    }, [convexStatus, convexLoadMore, cachedCursor, cachedIsDone, isLoadingCached, queryFilters])

    // Auto-load more if we got an empty page but aren't done
    React.useEffect(() => {
        if (canLoadMore && results.length === 0 && !isLoading && !isLoadingMore) {
            handleLoadMore()
        }
    }, [canLoadMore, results.length, isLoading, isLoadingMore, handleLoadMore])

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
            // Handle both Convex results and cached ThumbnailData
            // Convex results have _id, cached ThumbnailData has id
            const id = "_id" in img ? String(img._id) : (img as ThumbnailData).id
             
            const cached = imageCache.current.get(id)

            // Get values from either format
            const url = img.url
            const visibility = img.visibility
            const model = img.model
            const contentType = img.contentType
            const creationTime = "_creationTime" in img ? img._creationTime : (img as ThumbnailData)._creationTime

            // Check if cached version is still valid (same data)
            // Only compare fields that would affect rendering
            if (cached &&
                cached.url === url &&
                cached.visibility === visibility &&
                cached.model === model &&
                cached.contentType === contentType) {
                // Reuse cached object reference - prevents child re-render
                newCache.set(id, cached)
                return cached
            }

            // Create new object for new/changed images
            const newImage: ThumbnailData = {
                id,
                _id: id,
                _creationTime: creationTime,
                url,
                visibility,
                model,
                contentType,
                prompt: "", // Placeholder - full data loaded on click via getById
            }

            newCache.set(id, newImage)
            return newImage
        })

        // Update cache for next render
         
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
            setSelectedIds(new Set())
            setSelectionMode(false)
        } catch (error) {
            console.error("Failed to make images public:", error)
            // The mutation hook already shows toasts
        }
    }, [setBulkVisibilityMutation])

    const handleMakeSelectedPrivate = React.useCallback(async () => {
        const currentSelectedIds = selectedIdsRef.current
        if (currentSelectedIds.size === 0) return

        const imageIds = Array.from(currentSelectedIds) as Id<"generatedImages">[]
        try {
            await setBulkVisibilityMutation.mutateAsync({ imageIds, visibility: "unlisted" })
            setSelectedIds(new Set())
            setSelectionMode(false)
        } catch (error) {
            console.error("Failed to make images private:", error)
            // The mutation hook already shows toasts
        }
    }, [setBulkVisibilityMutation])

    const handleDeleteSelected = React.useCallback(async () => {
        const currentSelectedIds = selectedIdsRef.current
        if (currentSelectedIds.size === 0) return

        const imageIds = Array.from(currentSelectedIds) as Id<"generatedImages">[]
        try {
            // Use bulk delete mutation - single Convex call, single toast
            await bulkDeleteMutation.mutateAsync(imageIds)
            setSelectedIds(new Set())
            setSelectionMode(false)
        } catch (error) {
            console.error("Failed to delete images:", error)
            // The mutation hook already shows error toast
        }
    }, [bulkDeleteMutation])

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
    const memoizedLoadMore = React.useCallback(() => {
        handleLoadMore()
    }, [handleLoadMore])

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
            onLoadMore={canLoadMore || isLoadingMore ? memoizedLoadMore : undefined}
            isLoadingMore={isLoadingMore}
            onMakeSelectedPublic={handleMakeSelectedPublic}
            onMakeSelectedPrivate={handleMakeSelectedPrivate}
            onDeleteSelected={handleDeleteSelected}
        />
    )
}
