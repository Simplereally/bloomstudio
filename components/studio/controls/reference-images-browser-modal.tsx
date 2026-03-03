"use client"

/**
 * ReferenceImagesBrowserModal - Modal for browsing and selecting reference images
 * 
 * Displays reference images in two tabs:
 * - "History" tab: user's generated images (default tab)
 * - "Uploads" tab: manually uploaded reference images
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
import type { ThumbnailData } from "@/components/studio/gallery/types"
import { DeleteImageDialog } from "@/components/studio/delete-image-dialog"
import type { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { Search, Loader2, Image as ImageIcon, X, Upload, History, Check } from "lucide-react"
import Image from "next/image"
import { useState, useMemo, useCallback, memo } from "react"

/** Stable empty array to avoid re-render from default prop allocation. */
const EMPTY_URLS: string[] = []

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
    /** Pre-loaded history images from the gallery (avoids redundant Convex query) */
    historyImages?: ThumbnailData[]
}

/**
 * Modal component for browsing reference images with tabs for History and Uploads.
 */
export function ReferenceImagesBrowserModal({
    open,
    onOpenChange,
    onSelect,
    title = "Browse Reference Images",
    description = "Select an image from your library",
    selectedUrls = EMPTY_URLS,
    allowVideo = false,
    historyImages,
}: ReferenceImagesBrowserModalProps) {
    const recentUploads = useReferenceImages()
    const isLoadingUploads = recentUploads === undefined
    const isLoadingHistory = historyImages === undefined
    const deleteMutation = useDeleteReferenceImage()
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState<"history" | "uploads">("history")

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

    // Normalize history images to BrowsableImage, filtering by content type
    const historyItems: BrowsableImage[] = useMemo(() => {
        if (!historyImages) return []
        return historyImages
            .filter((img) => {
                if (allowVideo) return true
                // Only show images (not videos) when allowVideo is false
                return img.contentType?.startsWith("image/") ?? true
            })
            .map((img) => ({
                _id: img.id,
                url: img.url,
                selectUrl: img.originalUrl ?? img.url,
                isDeletable: false,
            }))
    }, [historyImages, allowVideo])

    const filteredUploads = useMemo(
        () => filterBySearch(uploadItems, searchQuery),
        [uploadItems, searchQuery],
    )

    const filteredHistory = useMemo(
        () => filterBySearch(historyItems, searchQuery),
        [historyItems, searchQuery],
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
                            "flex-1 overflow-y-auto min-h-[200px] max-h-[400px]",
                            activeTab !== "history" && "hidden"
                        )}
                        data-testid="history-tab-content"
                    >
                        <ImageGrid
                            items={filteredHistory}
                            isLoading={isLoadingHistory}
                            emptyMessage="No generated images yet"
                            searchQuery={searchQuery}
                            selectedUrls={selectedUrls}
                            onSelect={onSelect}
                            onClearSearch={handleClearSearch}
                            deleteMutation={deleteMutation}
                        />
                    </TabsContent>

                    <TabsContent
                        value="uploads"
                        forceMount
                        className={cn(
                            "flex-1 overflow-y-auto min-h-[200px] max-h-[400px]",
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
                        {isLoadingUploads || isLoadingHistory
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
