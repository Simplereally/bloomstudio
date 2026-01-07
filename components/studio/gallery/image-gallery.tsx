"use client"

/**
 * ImageGallery - Grid of generated images with scroll and selection
 * Follows SRP: Only manages gallery grid display
 * 
 * Performance: Uses virtualization for large galleries (50+ images)
 * to only render visible thumbnails.
 */

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Eye, EyeOff, ImageOff, Loader2, MoreHorizontal, Trash2 } from "lucide-react"
import * as React from "react"
import { GalleryThumbnail } from "./gallery-thumbnail"

/**
 * Lightweight data structure for gallery thumbnails.
 * Contains only the fields needed for rendering thumbnails.
 * Full image data is loaded on-demand when opening lightbox.
 */
export interface ThumbnailData {
    id: string
    _id?: string
    url: string
    prompt?: string
    visibility?: "public" | "unlisted"
    model?: string
    _creationTime?: number
}

/**
 * Memoized thumbnail wrapper - prevents re-renders when parent updates
 * but this specific thumbnail's props haven't changed.
 */
interface ThumbnailItemProps {
    image: ThumbnailData
    isActive: boolean
    isChecked: boolean
    onSelect: (image: ThumbnailData) => void
    onCheckedChange: (id: string, checked: boolean) => void
    showCheckbox: boolean
    size: "sm" | "md" | "lg"
}

const ThumbnailItem = React.memo(function ThumbnailItem({
    image,
    isActive,
    isChecked,
    onSelect,
    onCheckedChange,
    showCheckbox,
    size,
}: ThumbnailItemProps) {
    // Create stable callbacks that use the image's data
    const handleClick = React.useCallback(() => {
        onSelect(image)
    }, [onSelect, image])

    const handleChecked = React.useCallback((checked: boolean) => {
        onCheckedChange(image.id, checked)
    }, [onCheckedChange, image.id])

    return (
        <GalleryThumbnail
            image={image}
            isActive={isActive}
            isChecked={isChecked}
            onClick={handleClick}
            onCheckedChange={handleChecked}
            showCheckbox={showCheckbox}
            size={size}
        />
    )
})

// Size mappings for virtualization calculations
const THUMBNAIL_SIZES = {
    sm: 64,  // w-16 h-16
    md: 96,  // w-24 h-24
    lg: 128, // w-32 h-32
} as const

const GRID_COLUMNS = {
    sm: 4,
    md: 3,
    lg: 2,
} as const

const GAP_SIZE = 8 // gap-2 = 0.5rem = 8px
const PADDING = 8 // p-2 = 0.5rem = 8px

/** Threshold for enabling virtualization (number of images) */
const VIRTUALIZATION_THRESHOLD = 50

/**
 * VirtualizedGalleryGrid - Renders only visible thumbnails for performance
 */
interface VirtualizedGalleryGridProps {
    images: ThumbnailData[]
    activeImageId?: string
    selectedIds: Set<string>
    selectionMode: boolean
    thumbnailSize: "sm" | "md" | "lg"
    onSelect: (image: ThumbnailData) => void
    onCheckedChange: (id: string, checked: boolean) => void
}

const VirtualizedGalleryGrid = React.memo(function VirtualizedGalleryGrid({
    images,
    activeImageId,
    selectedIds,
    selectionMode,
    thumbnailSize,
    onSelect,
    onCheckedChange,
}: VirtualizedGalleryGridProps) {
    const parentRef = React.useRef<HTMLDivElement>(null)
    
    const columns = GRID_COLUMNS[thumbnailSize]
    const itemSize = THUMBNAIL_SIZES[thumbnailSize]
    const rowHeight = itemSize + GAP_SIZE
    
    // Calculate number of rows
    const rowCount = Math.ceil(images.length / columns)
    
    const virtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan: 3, // Render 3 extra rows above/below viewport
    })
    
    const virtualRows = virtualizer.getVirtualItems()
    
    return (
        <div
            ref={parentRef}
            className="flex-1 overflow-auto"
            data-testid="gallery-scroll"
        >
            <div
                className="relative w-full"
                style={{
                    height: `${virtualizer.getTotalSize() + PADDING * 2}px`,
                }}
            >
                <div
                    className="absolute top-0 left-0 w-full"
                    style={{
                        transform: `translateY(${(virtualRows[0]?.start ?? 0) + PADDING}px)`,
                        padding: `0 ${PADDING}px`,
                    }}
                >
                    {virtualRows.map((virtualRow) => {
                        const rowStartIndex = virtualRow.index * columns
                        const rowImages = images.slice(rowStartIndex, rowStartIndex + columns)
                        
                        return (
                            <div
                                key={virtualRow.key}
                                className="grid gap-2"
                                style={{
                                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                                    height: `${rowHeight}px`,
                                }}
                                data-index={virtualRow.index}
                            >
                                {rowImages.map((image) => (
                                    <ThumbnailItem
                                        key={image.id}
                                        image={image}
                                        isActive={activeImageId === image.id}
                                        isChecked={selectedIds.has(image.id)}
                                        onSelect={onSelect}
                                        onCheckedChange={onCheckedChange}
                                        showCheckbox={selectionMode}
                                        size={thumbnailSize}
                                    />
                                ))}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
})

export interface ImageGalleryProps {
    /** Array of thumbnail data for display */
    images: ThumbnailData[]
    /** Currently active/selected image ID */
    activeImageId?: string
    /** Callback when an image is selected (clicked to view in canvas) */
    onSelectImage?: (image: ThumbnailData) => void
    /** Whether bulk selection mode is enabled */
    selectionMode?: boolean
    /** Set of selected image IDs */
    selectedIds?: Set<string>
    /** Callback when selection changes */
    onSelectionChange?: (selectedIds: Set<string>) => void
    /** Callback to toggle selection mode */
    onToggleSelectionMode?: () => void
    /** Callback to delete selected images */
    onDeleteSelected?: () => void
    /** Callback to make selected images public */
    onMakeSelectedPublic?: () => void
    /** Callback to make selected images private */
    onMakeSelectedPrivate?: () => void
    /** Layout direction */
    direction?: "horizontal" | "vertical"
    /** Thumbnail size */
    thumbnailSize?: "sm" | "md" | "lg"
    /** Additional class names */
    className?: string
    /** Callback to load more images */
    onLoadMore?: () => void
    /** Whether more images are being loaded */
    isLoadingMore?: boolean
    /** Whether initial data is loading */
    isLoading?: boolean
    /** Whether all data has been loaded */
    isExhausted?: boolean
    /** Optional content to render when empty and exhausted */
    emptyContent?: React.ReactNode
    /** Optional content to render in the header (e.g., filter controls) */
    headerContent?: React.ReactNode
}

export const ImageGallery = React.memo(function ImageGallery({
    images,
    activeImageId,
    onSelectImage,
    selectionMode = false,
    selectedIds = new Set(),
    onSelectionChange,
    onToggleSelectionMode,
    onDeleteSelected,
    onMakeSelectedPublic,
    onMakeSelectedPrivate,
    direction = "vertical",
    thumbnailSize = "md",
    className,
    onLoadMore,
    isLoadingMore = false,
    isLoading = false,
    isExhausted = false,
    emptyContent,
    headerContent,
}: ImageGalleryProps) {
    // Defer selection state updates to keep UI responsive during rapid changes
    // This allows the UI thread to handle interactions (like clicking Select button)
    // without waiting for all thumbnail checkboxes to update
    const deferredSelectedIds = React.useDeferredValue(selectedIds)
    
    // Memoized callback for checkbox changes - uses selectedIds ref to avoid recreating on selection changes
    const selectedIdsRef = React.useRef(selectedIds)
    selectedIdsRef.current = selectedIds

    const handleCheckedChange = React.useCallback((imageId: string, checked: boolean) => {
        const newSelection = new Set(selectedIdsRef.current)
        if (checked) {
            newSelection.add(imageId)
        } else {
            newSelection.delete(imageId)
        }
        onSelectionChange?.(newSelection)
    }, [onSelectionChange])

    // Memoized select all - stable reference
    const selectAll = React.useCallback(() => {
        onSelectionChange?.(new Set(images.map((img) => img.id)))
    }, [onSelectionChange, images])

    // Memoized deselect all - stable reference
    const deselectAll = React.useCallback(() => {
        onSelectionChange?.(new Set())
    }, [onSelectionChange])

    // Memoized handler for individual thumbnails - avoid creating new functions in the map
    const handleImageClick = React.useCallback((image: ThumbnailData) => {
        onSelectImage?.(image)
    }, [onSelectImage])

    // Loading state component - displayed inline within the gallery
    const loadingState = (
        <div
            className="flex flex-col items-center justify-center flex-1 text-center p-6"
            data-testid="gallery-loading"
        >
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
    )

    // Empty state component - displayed inline within the gallery
    const emptyState = (
        <div
            className="flex flex-col items-center justify-center flex-1 text-center p-6"
            data-testid="gallery-empty"
        >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                <ImageOff className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No images found</p>
            <p className="text-xs text-muted-foreground mt-1">
                {headerContent ? "Try adjusting your filters" : "Generated images will appear here"}
            </p>
        </div>
    )

    // Determine what to render in the content area
    const renderContent = () => {
        if (isLoading) {
            return loadingState
        }
        // FIXED: Only show empty state if exhausted and no images
        if (images.length === 0 && isExhausted) {
            return emptyContent ?? emptyState
        }
        return null // Will render the ScrollArea with images
    }

    const contentState = renderContent()

    return (
        <div
            className={cn("flex flex-col h-full", className)}
            data-testid="image-gallery"
        >
            {/* Header with selection controls */}
            <div className="flex flex-col gap-2 p-2 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                        History ({images.length})
                    </span>
                    <div className="flex items-center gap-1.5">
                        {selectionMode ? (
                            <>
                                <label 
                                    className="flex items-center gap-1.5 cursor-pointer select-none"
                                    data-testid="select-all-label"
                                >
                                    <Checkbox
                                        checked={
                                            images.length === 0 
                                                ? false 
                                                : selectedIds.size === images.length 
                                                    ? true 
                                                    : selectedIds.size > 0 
                                                        ? "indeterminate" 
                                                        : false
                                        }
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                selectAll()
                                            } else {
                                                deselectAll()
                                            }
                                        }}
                                        data-testid="select-all"
                                        disabled={images.length === 0}
                                        className="h-3.5 w-3.5"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
                                    </span>
                                </label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-6 px-2 text-xs"
                                            data-testid="bulk-actions-menu"
                                            disabled={selectedIds.size === 0}
                                        >
                                            <MoreHorizontal className="h-3 w-3 mr-1" />
                                            Actions
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        {onMakeSelectedPublic && (
                                            <DropdownMenuItem
                                                onClick={onMakeSelectedPublic}
                                                data-testid="make-public"
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Make Public
                                            </DropdownMenuItem>
                                        )}
                                        {onMakeSelectedPrivate && (
                                            <DropdownMenuItem
                                                onClick={onMakeSelectedPrivate}
                                                data-testid="make-private"
                                            >
                                                <EyeOff className="h-4 w-4 mr-2" />
                                                Make Private
                                            </DropdownMenuItem>
                                        )}
                                        {(onMakeSelectedPublic || onMakeSelectedPrivate) && onDeleteSelected && (
                                            <DropdownMenuSeparator />
                                        )}
                                        {onDeleteSelected && (
                                            <DropdownMenuItem
                                                onClick={onDeleteSelected}
                                                variant="destructive"
                                                data-testid="delete-selected"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete Selected
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : null}
                        {onToggleSelectionMode && (
                            <Button
                                variant={selectionMode ? "secondary" : "ghost"}
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={onToggleSelectionMode}
                                data-testid="toggle-selection"
                                disabled={images.length === 0 && !selectionMode}
                            >
                                {selectionMode ? "Done" : "Select"}
                            </Button>
                        )}
                    </div>
                </div>
                {/* Optional header content (e.g., filter controls) */}
                {headerContent}
            </div>

            {/* Gallery Grid, Loading State, or Empty State */}
            {contentState ?? (
                images.length >= VIRTUALIZATION_THRESHOLD && direction === "vertical" ? (
                    // Virtualized grid for large datasets
                    <div className="flex-1 flex flex-col min-h-0">
                        <VirtualizedGalleryGrid
                            images={images}
                            activeImageId={activeImageId}
                            selectedIds={deferredSelectedIds}
                            selectionMode={selectionMode}
                            thumbnailSize={thumbnailSize}
                            onSelect={handleImageClick}
                            onCheckedChange={handleCheckedChange}
                        />
                        {onLoadMore && (
                            <div className="p-4 flex justify-center border-t border-border/10 flex-shrink-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onLoadMore}
                                    disabled={isLoadingMore}
                                    className="text-xs text-muted-foreground"
                                >
                                    {isLoadingMore ? (
                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                    ) : null}
                                    Load More
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    // Standard grid for smaller datasets or horizontal layout
                    <ScrollArea className="flex-1" data-testid="gallery-scroll">
                        <div
                            className={cn(
                                "p-2",
                                direction === "horizontal"
                                    ? "flex gap-2 overflow-x-auto"
                                    : "grid gap-2",
                                direction === "vertical" && {
                                    "grid-cols-2": thumbnailSize === "lg",
                                    "grid-cols-3": thumbnailSize === "md",
                                    "grid-cols-4": thumbnailSize === "sm",
                                }
                            )}
                            data-testid="gallery-grid"
                        >
                            {images.map((image) => (
                                <ThumbnailItem
                                    key={image.id}
                                    image={image}
                                    isActive={activeImageId === image.id}
                                    isChecked={deferredSelectedIds.has(image.id)}
                                    onSelect={handleImageClick}
                                    onCheckedChange={handleCheckedChange}
                                    showCheckbox={selectionMode}
                                    size={thumbnailSize}
                                />
                            ))}
                        </div>

                        {onLoadMore && (
                            <div className="p-4 flex justify-center border-t border-border/10">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onLoadMore}
                                    disabled={isLoadingMore}
                                    className="text-xs text-muted-foreground"
                                >
                                    {isLoadingMore ? (
                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                    ) : null}
                                    Load More
                                </Button>
                            </div>
                        )}
                    </ScrollArea>
                )
            )}
        </div>
    )
})
