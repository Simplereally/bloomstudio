"use client"

/**
 * ReferenceImagesBrowserModal - Modal for browsing and selecting reference images
 * 
 * Displays reference images in two tabs:
 * - "History" tab: user's generated images (default tab) — independently paginated
 * - "Uploads" tab: manually uploaded reference images
 * 
 * The History tab uses the same hybrid caching strategy as PersistentImageGallery:
 * - Convex reactive hook (`useImageHistory`) for real-time updates
 * - Server-cached pages (`loadMyHistoryPage`) for "load more" pagination
 * - Virtualization via @tanstack/react-virtual for smooth scrolling over large datasets
 * 
 * Both tabs share search/filter capability. Used by both ReferenceImagePicker
 * and VideoReferenceImagePicker to allow browsing the full image library.
 */

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useReferenceImages } from "@/hooks/queries/use-reference-images"
import { useDeleteReferenceImage } from "@/hooks/mutations/use-delete-image"
import { useImageHistory } from "@/hooks/queries/use-image-history"
import { loadMyHistoryPage } from "@/app/_server/actions/history"
import type { ThumbnailData } from "@/components/studio/gallery/types"
import { DeleteImageDialog } from "@/components/studio/delete-image-dialog"
import type { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { Search, Loader2, Image as ImageIcon, X, Upload, History, Check } from "lucide-react"
import Image from "next/image"
import { useState, useMemo, useCallback, useEffect, useRef, memo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"

/** Stable empty array to avoid re-render from default prop allocation. */
const EMPTY_URLS: string[] = []

/** Number of columns in the modal grid at different breakpoints. */
const MODAL_COLUMNS = 6
/** Gap between grid items in pixels. */
const MODAL_GAP = 8
/** Padding around the grid in pixels. */
const MODAL_PADDING = 4

/** Shape of an image item renderable in the grid */
interface BrowsableImage {
    _id: string
    /** URL to display as thumbnail */
    url: string
    /** URL to use when the image is selected */
    selectUrl: string
    /** Whether this image can be deleted from the grid (only uploads) */
    isDeletable: boolean
    /** Typed Convex ID for deletable items (reference images). Avoids unsafe `as` cast at deletion time. */
    referenceImageId?: Id<"referenceImages">
}

/** Filter browsable images by matching the URL filename portion against a search query. */
function filterBySearch(items: BrowsableImage[], query: string): BrowsableImage[] {
    const trimmed = query.trim()
    if (!trimmed) return items
    const lower = trimmed.toLowerCase()
    return items.filter((img) => {
        const filename = img.url.split("/").pop()?.toLowerCase() ?? ""
        return filename.includes(lower)
    })
}

/** Extract a human-readable name from a URL for accessibility labels. */
function getImageName(url: string): string {
    const filename = url.split("/").pop() ?? "image"
    // Remove query params and decode
    const clean = filename.split("?")[0]
    try {
        return decodeURIComponent(clean)
    } catch {
        return clean
    }
}

interface ImageGridProps {
    items: BrowsableImage[]
    isLoading: boolean
    emptyMessage: string
    searchQuery: string
    selectedUrls: string[]
    onSelect: (url: string) => void
    onClearSearch: () => void
    deleteMutation: { mutateAsync: (id: Id<"referenceImages">) => Promise<unknown>; isPending: boolean }
}

/** Grid of browsable images displayed within a tab. */
const ImageGrid = memo(function ImageGrid({
    items,
    isLoading,
    emptyMessage,
    searchQuery,
    selectedUrls,
    onSelect,
    onClearSearch,
    deleteMutation,
}: ImageGridProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[200px]" role="status">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="sr-only">Loading images</span>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 min-h-[200px]">
                <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                    {searchQuery ? "No images match your search" : emptyMessage}
                </p>
                {searchQuery && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearSearch}
                        className="mt-2"
                    >
                        Clear search
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div
            className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 p-1"
            role="grid"
            aria-label="Reference images"
            data-testid="reference-images-grid"
        >
            {items.map((img) => {
                const isSelected =
                    selectedUrls.includes(img.url) ||
                    selectedUrls.includes(img.selectUrl)
                const imageName = getImageName(img.url)
                return (
                    <div
                        key={img._id}
                        className={cn(
                            "relative group aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer",
                            isSelected
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border hover:border-primary/50"
                        )}
                        data-testid="reference-image-item"
                    >
                        <button
                            onClick={() => onSelect(img.selectUrl)}
                            className="w-full h-full relative"
                            aria-label={`Select ${imageName}${isSelected ? " (selected)" : ""}`}
                            aria-pressed={isSelected}
                            data-testid={`select-image-${img._id}`}
                        >
                            <Image
                                src={img.url}
                                alt={imageName}
                                fill
                                className="object-cover"
                            />
                            {isSelected && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                                        <Check className="h-4 w-4" />
                                    </div>
                                </div>
                            )}
                        </button>
                        {/* Delete button overlay (only for uploads) */}
                        {img.isDeletable && (
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DeleteImageDialog
                                    title="Delete Reference"
                                    onConfirm={async () => {
                                        if (img.referenceImageId) {
                                            await deleteMutation.mutateAsync(img.referenceImageId)
                                        }
                                    }}
                                    isDeleting={deleteMutation.isPending}
                                />
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
})

// ────────────────────────────────────────────────────────────────────────────
// VirtualizedHistoryGrid — virtualized, infinitely-scrolling history grid
// ────────────────────────────────────────────────────────────────────────────

interface VirtualizedHistoryGridProps {
    items: BrowsableImage[]
    isLoading: boolean
    emptyMessage: string
    searchQuery: string
    selectedUrls: string[]
    onSelect: (url: string) => void
    onClearSearch: () => void
    /** Callback to load more images when the sentinel enters the viewport */
    onLoadMore?: () => void
    /** Whether more content can be loaded */
    canLoadMore: boolean
    /** Whether a page is currently being fetched */
    isLoadingMore: boolean
}

/** Virtualized grid for the History tab with infinite scroll support. */
const VirtualizedHistoryGrid = memo(function VirtualizedHistoryGrid({
    items,
    isLoading,
    emptyMessage,
    searchQuery,
    selectedUrls,
    onSelect,
    onClearSearch,
    onLoadMore,
    canLoadMore,
    isLoadingMore,
}: VirtualizedHistoryGridProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const sentinelRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(0)

    // Track container width for dynamic row height
    useEffect(() => {
        const el = scrollContainerRef.current
        if (!el) return
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry) setContainerWidth(entry.contentRect.width)
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    // Compute row height from container width
    const columns = MODAL_COLUMNS
    const availableWidth = containerWidth > 0
        ? containerWidth - MODAL_PADDING * 2 - (columns - 1) * MODAL_GAP
        : 0
    const itemWidth = availableWidth > 0 ? availableWidth / columns : 80
    const rowHeight = itemWidth + MODAL_GAP

    const rowCount = Math.ceil(items.length / columns)

    const getScrollElement = useCallback(() => scrollContainerRef.current, [])
    const estimateSize = useCallback(() => rowHeight, [rowHeight])

    // eslint-disable-next-line react-hooks/incompatible-library
    const virtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement,
        estimateSize,
        overscan: 4,
    })

    // Recalculate when row height changes (container resizes)
    useEffect(() => {
        virtualizer.measure()
    }, [virtualizer, rowHeight])

    const virtualRows = virtualizer.getVirtualItems()

    // Infinite scroll: IntersectionObserver on a sentinel element
    useEffect(() => {
        const sentinel = sentinelRef.current
        const scrollContainer = scrollContainerRef.current
        if (!sentinel || !scrollContainer || !onLoadMore || !canLoadMore || isLoadingMore) return

        let debounceTimer: ReturnType<typeof setTimeout> | null = null
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (entry?.isIntersecting && canLoadMore && !isLoadingMore) {
                    if (debounceTimer) clearTimeout(debounceTimer)
                    debounceTimer = setTimeout(() => {
                        if (canLoadMore && !isLoadingMore) onLoadMore()
                    }, 100)
                }
            },
            { root: scrollContainer, rootMargin: "0px 0px 600px 0px", threshold: 0.1 },
        )
        observer.observe(sentinel)
        return () => {
            observer.disconnect()
            if (debounceTimer) clearTimeout(debounceTimer)
        }
    }, [onLoadMore, canLoadMore, isLoadingMore])

    // Loading state
    if (isLoading || (isLoadingMore && items.length === 0)) {
        return (
            <div className="flex items-center justify-center h-full min-h-[200px]" role="status">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="sr-only">Loading images</span>
            </div>
        )
    }

    // Empty state
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 min-h-[200px]">
                <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                    {searchQuery ? "No images match your search" : emptyMessage}
                </p>
                {searchQuery && (
                    <Button variant="ghost" size="sm" onClick={onClearSearch} className="mt-2">
                        Clear search
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div
            ref={scrollContainerRef}
            className="h-full overflow-y-auto"
            data-testid="history-virtual-scroll"
        >
            <div
                className="relative w-full"
                style={{ height: `${virtualizer.getTotalSize() + MODAL_PADDING * 2}px` }}
                data-testid="reference-images-grid"
                role="grid"
                aria-label="History images"
            >
                {virtualRows.map((virtualRow) => {
                    const rowStartIndex = virtualRow.index * columns
                    const rowImages = items.slice(rowStartIndex, rowStartIndex + columns)

                    return (
                        <div
                            key={virtualRow.key}
                            className="absolute top-0 left-0 w-full grid"
                            style={{
                                height: `${rowHeight}px`,
                                transform: `translateY(${virtualRow.start + MODAL_PADDING}px)`,
                                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                                gap: `${MODAL_GAP}px`,
                                paddingLeft: `${MODAL_PADDING}px`,
                                paddingRight: `${MODAL_PADDING}px`,
                            }}
                        >
                            {rowImages.map((img) => {
                                const isSelected =
                                    selectedUrls.includes(img.url) ||
                                    selectedUrls.includes(img.selectUrl)
                                const imageName = getImageName(img.url)
                                return (
                                    <div
                                        key={img._id}
                                        className={cn(
                                            "relative group aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer",
                                            isSelected
                                                ? "border-primary ring-2 ring-primary/20"
                                                : "border-border hover:border-primary/50",
                                        )}
                                        data-testid="reference-image-item"
                                    >
                                        <button
                                            onClick={() => onSelect(img.selectUrl)}
                                            className="w-full h-full relative"
                                            aria-label={`Select ${imageName}${isSelected ? " (selected)" : ""}`}
                                            aria-pressed={isSelected}
                                            data-testid={`select-image-${img._id}`}
                                        >
                                            <Image
                                                src={img.url}
                                                alt={imageName}
                                                fill
                                                className="object-cover"
                                            />
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                                                        <Check className="h-4 w-4" />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
            </div>

            {/* Infinite scroll sentinel */}
            {(canLoadMore || isLoadingMore) && (
                <div
                    ref={sentinelRef}
                    className="flex justify-center items-center py-4"
                    data-testid="load-more-sentinel"
                >
                    {isLoadingMore && (
                        <Loader2
                            className="h-4 w-4 animate-spin text-muted-foreground"
                            data-testid="loading-spinner"
                        />
                    )}
                </div>
            )}
        </div>
    )
})

// ────────────────────────────────────────────────────────────────────────────
// Hook: useModalHistoryData — encapsulates the hybrid data-fetching strategy
// ────────────────────────────────────────────────────────────────────────────

function useModalHistoryData(open: boolean, allowVideo: boolean) {
    // Query the user's full history and filter by media type client-side.
    // Using model IDs as a proxy for "image" hides older/unknown image models.
    // The auto-load logic below keeps paging until we find renderable images.
    // Convex reactive query — provides instant updates for new generations
    const convexQuery = useImageHistory()
    const convexResults = convexQuery.results
    const convexStatus = convexQuery.status

    // Server-cached pages for "load more"
    const [cachedPages, setCachedPages] = useState<ThumbnailData[]>([])
    const [cachedCursor, setCachedCursor] = useState<string | null>(null)
    const [cachedIsDone, setCachedIsDone] = useState(false)
    const [isLoadingCached, setIsLoadingCached] = useState(false)

    // Reset pagination state when modal closes so it starts fresh on reopen
    const prevOpenRef = useRef(false)
    if (!open && prevOpenRef.current) {
        // Modal just closed — will be picked up on next render
    }
    if (open !== prevOpenRef.current) {
        prevOpenRef.current = open
    }

    // Clear cached pages when modal closes so we don't show stale extra pages on reopen
    useEffect(() => {
        if (!open) {
            setCachedPages([])
            setCachedCursor(null)
            setCachedIsDone(false)
        }
    }, [open])

    // Determine overall loading / pagination state
    const isLoading = convexStatus === "LoadingFirstPage"
    const isLoadingMore = convexStatus === "LoadingMore" || isLoadingCached
    const convexExhausted = convexStatus === "Exhausted"
    const effectivelyCachedDone = cachedIsDone || !cachedCursor
    const isExhausted = convexExhausted && effectivelyCachedDone
    const canLoadMore = convexStatus === "CanLoadMore" || (!cachedIsDone && Boolean(cachedCursor))

    // Combine Convex reactive data + cached pages, deduplicating by ID
    const combinedResults: ThumbnailData[] = useMemo(() => {
        const mapped: ThumbnailData[] = convexResults.map((img) => ({
            id: String(img._id),
            _id: String(img._id),
            _creationTime: img._creationTime,
            url: img.url,
            originalUrl: (img as Record<string, unknown>).originalUrl as string | undefined,
            visibility: img.visibility,
            model: img.model,
            contentType: img.contentType,
            prompt: "",
        }))
        const convexIds = new Set(mapped.map((m) => m.id))
        const uniqueCachedPages = cachedPages.filter((p) => !convexIds.has(p.id))
        return [...mapped, ...uniqueCachedPages]
    }, [convexResults, cachedPages])

    // Filter by content type (image vs video)
    const filteredResults: BrowsableImage[] = useMemo(() => {
        return combinedResults
            .filter((img) => {
                if (allowVideo) return true
                return img.contentType?.startsWith("image/") ?? true
            })
            .map((img) => ({
                _id: img.id,
                url: img.url,
                selectUrl: img.originalUrl ?? img.url,
                isDeletable: false,
            }))
    }, [combinedResults, allowVideo])

    // Load more handler — exhausts Convex pagination first, then server cache
    const handleLoadMore = useCallback(async () => {
        if (convexStatus === "CanLoadMore") {
            convexQuery.loadMore(20)
            return
        }
        if (!cachedIsDone && cachedCursor && !isLoadingCached) {
            setIsLoadingCached(true)
            try {
                const result = await loadMyHistoryPage({
                    cursor: cachedCursor,
                    numItems: 20,
                })
                const newImages: ThumbnailData[] = result.page.map((img) => ({
                    id: img._id,
                    _id: img._id,
                    _creationTime: img._creationTime,
                    url: img.url,
                    originalUrl: img.originalUrl,
                    visibility: img.visibility,
                    model: img.model,
                    contentType: img.contentType,
                    prompt: "",
                }))
                setCachedPages((prev) => [...prev, ...newImages])
                setCachedCursor(result.continueCursor || null)
                setCachedIsDone(result.isDone)
            } catch (error) {
                console.error("Failed to load more history in modal:", error)
            } finally {
                setIsLoadingCached(false)
            }
        }
    }, [convexStatus, convexQuery, cachedCursor, cachedIsDone, isLoadingCached])

    useEffect(() => {
        if (!open || isLoading || isLoadingMore || filteredResults.length > 0 || !canLoadMore) {
            return
        }

        void handleLoadMore()
    }, [open, isLoading, isLoadingMore, filteredResults.length, canLoadMore, handleLoadMore])

    return {
        items: filteredResults,
        isLoading,
        isLoadingMore,
        isExhausted,
        canLoadMore,
        handleLoadMore,
        totalCount: filteredResults.length,
    }
}

// ────────────────────────────────────────────────────────────────────────────
// ReferenceImagesBrowserModal
// ────────────────────────────────────────────────────────────────────────────

interface ReferenceImagesBrowserModalProps {
    /** Whether the modal is open */
    open: boolean
    /** Callback when the modal closes */
    onOpenChange: (open: boolean) => void
    /** Callback when an image is selected */
    onSelect: (url: string) => void
    /** Title for the modal */
    title?: string
    /** Description for the modal */
    description?: string
    /** Currently selected image URLs to highlight */
    selectedUrls?: string[]
    /** Whether to allow selecting video content from history (default: false) */
    allowVideo?: boolean
    /**
     * Pre-loaded history images from the gallery.
     * @deprecated The modal now fetches its own history data independently.
     *             This prop is accepted for backward-compatibility but ignored.
     */
    historyImages?: ThumbnailData[]
}

/**
 * Modal component for browsing reference images with tabs for History and Uploads.
 *
 * The History tab implements its own independent infinite scrolling and
 * virtualization so it is not limited by whatever the sidebar has already loaded.
 */
export function ReferenceImagesBrowserModal({
    open,
    onOpenChange,
    onSelect,
    title = "Browse Reference Images",
    description = "Select an image from your library",
    selectedUrls = EMPTY_URLS,
    allowVideo = false,
    // historyImages is accepted for backward-compat but unused
}: ReferenceImagesBrowserModalProps) {
    const recentUploads = useReferenceImages()
    const isLoadingUploads = recentUploads === undefined
    const deleteMutation = useDeleteReferenceImage()
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState<"history" | "uploads">("history")

    // Independent history data with pagination
    const history = useModalHistoryData(open, allowVideo)

    // Reset ephemeral UI state when modal opens so users always start fresh.
    // Uses the "previous value" pattern to detect open transitions without useEffect.
    const [prevOpen, setPrevOpen] = useState(false)
    if (open && !prevOpen) {
        setSearchQuery("")
        setActiveTab("history")
    }
    if (open !== prevOpen) {
        setPrevOpen(open)
    }

    const handleTabChange = useCallback((value: string) => {
        if (value === "history" || value === "uploads") {
            setActiveTab(value)
        }
    }, [])

    // Normalize uploads to BrowsableImage
    const uploadItems: BrowsableImage[] = useMemo(() => {
        if (!recentUploads) return []
        return recentUploads.map((img) => ({
            _id: img._id,
            url: img.url,
            selectUrl: img.url,
            isDeletable: true,
            referenceImageId: img._id,
        }))
    }, [recentUploads])

    // Apply search filter to both tabs
    const filteredUploads = useMemo(
        () => filterBySearch(uploadItems, searchQuery),
        [uploadItems, searchQuery],
    )

    const filteredHistory = useMemo(
        () => filterBySearch(history.items, searchQuery),
        [history.items, searchQuery],
    )

    const totalFilteredCount = filteredHistory.length + filteredUploads.length

    const handleClearSearch = useCallback(() => {
        setSearchQuery("")
    }, [])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-primary" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {/* Search input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search images..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-9"
                        aria-label="Search reference images"
                        data-testid="reference-images-search"
                    />
                    {searchQuery && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Clear search"
                            data-testid="clear-search-button"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Tabbed content */}
                <Tabs value={activeTab} className="flex-1 flex flex-col min-h-0" onValueChange={handleTabChange}>
                    <TabsList className="w-full" data-testid="browser-tabs">
                        <TabsTrigger value="history" className="flex items-center gap-1.5" data-testid="tab-history">
                            <History className="h-3.5 w-3.5" />
                            History
                        </TabsTrigger>
                        <TabsTrigger value="uploads" className="flex items-center gap-1.5" data-testid="tab-uploads">
                            <Upload className="h-3.5 w-3.5" />
                            Uploads
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent
                        value="history"
                        forceMount
                        className={cn(
                            "flex-1 flex flex-col min-h-0 overflow-hidden",
                            activeTab !== "history" && "hidden"
                        )}
                        data-testid="history-tab-content"
                    >
                        <VirtualizedHistoryGrid
                            items={filteredHistory}
                            isLoading={history.isLoading}
                            emptyMessage="No generated images yet"
                            searchQuery={searchQuery}
                            selectedUrls={selectedUrls}
                            onSelect={onSelect}
                            onClearSearch={handleClearSearch}
                            onLoadMore={history.canLoadMore ? history.handleLoadMore : undefined}
                            canLoadMore={history.canLoadMore && !searchQuery}
                            isLoadingMore={history.isLoadingMore}
                        />
                    </TabsContent>

                    <TabsContent
                        value="uploads"
                        forceMount
                        className={cn(
                            "flex-1 min-h-0 overflow-y-auto",
                            activeTab !== "uploads" && "hidden"
                        )}
                        data-testid="uploads-tab-content"
                    >

                        <ImageGrid
                            items={filteredUploads}
                            isLoading={isLoadingUploads}
                            emptyMessage="No reference images uploaded yet"
                            searchQuery={searchQuery}
                            selectedUrls={selectedUrls}
                            onSelect={onSelect}
                            onClearSearch={handleClearSearch}
                            deleteMutation={deleteMutation}
                        />
                    </TabsContent>
                </Tabs>

                {/* Footer with count */}
                <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground" data-testid="image-count">
                        {isLoadingUploads || history.isLoading || (history.isLoadingMore && history.totalCount === 0)
                            ? "Loading..."
                            : `${totalFilteredCount} image${totalFilteredCount !== 1 ? "s" : ""} available`}
                    </span>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
